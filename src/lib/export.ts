import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  ExportCollection,
  ExportedFiles,
  ExportFileItem,
  ExportFormat,
  ExportItem,
} from "@/types/export";

export const EXPORT_PAGE_SIZE = 200;

const itemSelect = {
  id: true,
  // Only to notice that an item has a file; the key is never written to the export
  fileKey: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  language: true,
  fileName: true,
  fileSize: true,
  fileMimeType: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  itemType: { select: { name: true } },
  collection: { select: { name: true } },
  tags: {
    select: { tag: { select: { name: true } } },
    orderBy: { tag: { name: "asc" } },
  },
} as const;

interface PageArgs {
  take: number;
  cursor?: { id: string };
  skip?: number;
}

export function exportFileName(
  now: Date,
  format: ExportFormat = "json",
): string {
  return `devstash-export-${now.toISOString().slice(0, 10)}.${format}`;
}

// Pages by cursor so a large stash is never read in one query. Callers order by date then id, which keeps the order the same on every request
async function* pagesOf<T extends { id: string }>(
  read: (args: PageArgs) => Promise<T[]>,
): AsyncGenerator<T[]> {
  let cursor: string | undefined;
  while (true) {
    const rows = await read({
      take: EXPORT_PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length > 0) yield rows;
    if (rows.length < EXPORT_PAGE_SIZE) return;
    cursor = rows[rows.length - 1].id;
  }
}

const ORDER = [{ createdAt: "asc" }, { id: "asc" }] as const;

// The storage key and every account field are left out on purpose: the file is for the user to keep, not a copy of how the app stores things
function toExportCollection(collection: {
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ExportCollection {
  return {
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

type DbItem = Awaited<
  ReturnType<typeof prisma.item.findMany<{ select: typeof itemSelect }>>
>[number];

function toExportItem(item: DbItem, filePath: string | undefined): ExportItem {
  return {
    title: item.title,
    description: item.description,
    type: item.itemType.name,
    contentType: item.contentType,
    content: item.content,
    url: item.url,
    language: item.language,
    fileName: item.fileName,
    fileSize: item.fileSize,
    fileMimeType: item.fileMimeType,
    ...(filePath ? { file: filePath } : {}),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    collection: item.collection?.name ?? null,
    tags: item.tags.map(({ tag }) => tag.name),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// The items that have a stored file, with only what is needed to fetch it, in the same stable order as the export. A damaged row with no name or size is still listed, so the export can say it is missing instead of silently leaving it out
export async function* listFileItems(
  userId: string,
): AsyncGenerator<ExportFileItem> {
  for await (const rows of pagesOf((args) =>
    prisma.item.findMany({
      where: { userId, fileKey: { not: null } },
      orderBy: [...ORDER],
      select: { id: true, fileKey: true, fileName: true, fileSize: true },
      ...args,
    }),
  )) {
    for (const { id, fileKey, fileName, fileSize } of rows) {
      if (fileKey)
        yield { id, fileKey, fileName: fileName ?? "file", fileSize };
    }
  }
}

// The export as a JSON document in pieces, one page of rows each, so memory stays at one page however large the stash is. The opening text is held back and sent with the first page, so the first piece only exists once a database read has worked. With `files` (a ZIP export) the items point to their file in the archive and the document ends with the files that are missing from it; `files` is read when its turn comes, so it can be filled in before the document is started
export async function* exportChunks(
  userId: string,
  now: Date = new Date(),
  files?: ExportedFiles,
): AsyncGenerator<string> {
  let pending = `{"version":1,"exportedAt":${JSON.stringify(now.toISOString())},"collections":[`;
  let separator = "";

  for await (const rows of pagesOf((args) =>
    prisma.collection.findMany({
      where: { userId },
      orderBy: [...ORDER],
      ...args,
    }),
  )) {
    yield pending +
      separator +
      rows.map((row) => JSON.stringify(toExportCollection(row))).join(",");
    pending = "";
    separator = ",";
  }

  // At most 20 per user, so no paging
  const itemTypes = await prisma.itemType.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { name: true, icon: true, color: true },
  });
  pending += `],"itemTypes":${JSON.stringify(itemTypes)},"items":[`;
  separator = "";
  // Files and items are read in two passes, so an item with a file that was added in between has neither a path nor a missing entry yet; it is listed here instead of making the export look complete
  const accountedFor = files
    ? new Set([...files.paths.keys(), ...files.missing.map((m) => m.itemId)])
    : undefined;

  for await (const rows of pagesOf((args) =>
    prisma.item.findMany({
      where: { userId },
      orderBy: [...ORDER],
      select: itemSelect,
      ...args,
    }),
  )) {
    if (files && accountedFor) {
      for (const row of rows) {
        if (row.fileKey && !accountedFor.has(row.id)) {
          files.missing.push({
            itemId: row.id,
            fileName: row.fileName ?? "file",
            reason: "unreadable",
          });
        }
      }
    }
    yield pending +
      separator +
      rows
        .map((row) =>
          JSON.stringify(toExportItem(row, files?.paths.get(row.id))),
        )
        .join(",");
    pending = "";
    separator = ",";
  }

  const missing = files ? `,"missing":${JSON.stringify(files.missing)}` : "";
  yield `${pending}]${missing}}`;
}
