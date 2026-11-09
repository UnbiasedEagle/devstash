import "server-only";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import { exportChunks, listFileItems } from "@/lib/export";
import { getObjectBytes } from "@/lib/storage";
import { cleanFileName } from "@/lib/upload-rules";
import type {
  ExportedFiles,
  ExportFileItem,
  MissingFileReason,
} from "@/types/export";

// The browser holds the whole archive in memory before it saves it, and one request has to read every file and send it inside the platform's time limit. Kept low on purpose; raise it only after timing a real export of that size
export const EXPORT_FILES_LIMIT_BYTES = 200 * 1024 * 1024;
// The ZIP format this library writes counts entries in 16 bits, so past 65,535 the archive would be silently corrupt. export.json takes one entry
export const EXPORT_MAX_FILES = 10_000;
// A read that hangs would stall the whole download, and nothing else could cancel it
export const EXPORT_FILE_READ_TIMEOUT_MS = 30_000;

interface ExportZipOptions {
  // Aborted when the browser gives up on the download
  signal?: AbortSignal;
  filesLimitBytes?: number;
  maxFiles?: number;
}

// The export as a ZIP in pieces: every uploaded file, then export.json last, because only after the files are done does it know which ones made it in. One file is in memory at a time (at most 10 MB), so memory stays flat however many files there are
export async function* exportZipChunks(
  userId: string,
  now: Date = new Date(),
  {
    signal,
    filesLimitBytes = EXPORT_FILES_LIMIT_BYTES,
    maxFiles = EXPORT_MAX_FILES,
  }: ExportZipOptions = {},
): AsyncGenerator<Uint8Array> {
  const queue: Uint8Array[] = [];
  let zipError: unknown;
  const zip = new Zip((error, chunk) => {
    if (error) zipError = error;
    else queue.push(chunk);
  });
  function drain(): Uint8Array[] {
    if (zipError) throw zipError;
    return queue.splice(0);
  }

  const files: ExportedFiles = { paths: new Map(), missing: [] };
  function skip(item: ExportFileItem, reason: MissingFileReason) {
    files.missing.push({ itemId: item.id, fileName: item.fileName, reason });
  }

  let total = 0;
  let limitReached: MissingFileReason | null = null;

  for await (const item of listFileItems(userId)) {
    if (signal?.aborted) return;

    // Once a limit is hit, the rest are left out too, so the archive is a clear first part of the stash and not a scattering of whatever was small
    if (!limitReached && files.paths.size >= maxFiles) {
      limitReached = "count_limit";
    } else if (
      !limitReached &&
      item.fileSize !== null &&
      total + item.fileSize > filesLimitBytes
    ) {
      limitReached = "size_limit";
    }
    if (limitReached) {
      skip(item, limitReached);
      continue;
    }

    let bytes: Uint8Array;
    try {
      // Without a saved size there is nothing to check the file against
      if (item.fileSize === null) throw new Error("The item has no saved size");
      const readSignal = AbortSignal.any([
        ...(signal ? [signal] : []),
        AbortSignal.timeout(EXPORT_FILE_READ_TIMEOUT_MS),
      ]);
      bytes = await getObjectBytes(item.fileKey, item.fileSize, readSignal);
      if (bytes.length !== item.fileSize) {
        throw new Error(
          `Expected ${item.fileSize} bytes but read ${bytes.length}`,
        );
      }
    } catch (error) {
      // A read that was cut off because the browser left isn't a broken file
      if (signal?.aborted) return;
      console.error("Export skipped a file it could not read", {
        key: item.fileKey,
        reason: error instanceof Error ? error.message : String(error),
      });
      skip(item, "unreadable");
      continue;
    }

    total += bytes.length;
    // The item id in front keeps two files with the same name apart
    const path = `files/${item.id}-${cleanFileName(item.fileName)}`;
    // Uploads are images and documents that are already compressed, so storing them as they are saves the work
    const entry = new ZipPassThrough(path);
    zip.add(entry);
    entry.push(bytes, true);
    files.paths.set(item.id, path);
    yield* drain();
  }

  const document = new ZipDeflate("export.json", { level: 6 });
  zip.add(document);
  const encoder = new TextEncoder();
  for await (const piece of exportChunks(userId, now, files)) {
    document.push(encoder.encode(piece), false);
    yield* drain();
  }
  document.push(new Uint8Array(0), true);
  zip.end();
  yield* drain();
}
