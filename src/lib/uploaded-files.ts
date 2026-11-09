import "server-only";
import { randomUUID } from "node:crypto";
import { deleteObject, getObjectInfo, moveObject } from "@/lib/storage";
import {
  cleanFileName,
  fileKey,
  parsePendingKey,
  validateUpload,
  type UploadKind,
} from "@/lib/upload-rules";

export interface StoredFile {
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export type ClaimResult =
  { ok: true; file: StoredFile } | { ok: false; error: string };

const UPLOAD_MISSING = "The upload wasn't found. Choose the file again.";
const UPLOAD_MISMATCH = "The uploaded file doesn't match. Choose it again.";
const UPLOAD_CHANGED = "The file changed while saving. Choose it again.";

function hasName(error: unknown, name: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === name
  );
}

// Turns a pending upload into a stored file. Nothing the browser says is trusted: the key must be the user's own, and the size and type come from the object itself, which must also agree with what was submitted
export async function claimUploadedFile(options: {
  userId: string;
  kind: UploadKind;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
}): Promise<ClaimResult> {
  if (!parsePendingKey(options.userId, options.fileKey)) {
    return { ok: false, error: UPLOAD_MISSING };
  }

  const info = await getObjectInfo(options.fileKey);
  if (!info) return { ok: false, error: UPLOAD_MISSING };

  const validation = validateUpload({
    kind: options.kind,
    fileName: options.fileName,
    mimeType: options.fileMimeType,
    size: info.size,
  });
  if (!validation.ok) return { ok: false, error: validation.error };

  if (
    info.size !== options.fileSize ||
    info.contentType.toLowerCase() !== validation.mimeType
  ) {
    return { ok: false, error: UPLOAD_MISMATCH };
  }

  // A new id for every claim instead of the pending one, so two saves of the same upload at once can never end up sharing an object that one of them might then delete
  const key = fileKey(options.userId, randomUUID());
  try {
    // The link can be used again until it expires, so the move only goes ahead if the object is still the one that was checked
    await moveObject(options.fileKey, key, { ifMatch: info.etag });
  } catch (error) {
    if (hasName(error, "PreconditionFailed")) {
      return { ok: false, error: UPLOAD_CHANGED };
    }
    if (hasName(error, "NoSuchKey"))
      return { ok: false, error: UPLOAD_MISSING };
    throw error;
  }

  return {
    ok: true,
    file: {
      key,
      fileName: cleanFileName(options.fileName),
      size: info.size,
      mimeType: validation.mimeType,
    },
  };
}

// Used when an item couldn't be saved after its file was moved, and when an item is deleted. A failure only leaves an unused object in the bucket, so it is logged with the key and not shown
export async function discardStoredFile(key: string): Promise<void> {
  try {
    await deleteObject(key);
  } catch (error) {
    console.error("Failed to delete a stored file", {
      key,
      error,
    });
  }
}
