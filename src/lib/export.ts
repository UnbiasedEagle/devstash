import "server-only";
import { prisma } from "@/lib/prisma";
import type { ExportCollection, ExportItem } from "@/types/export";

export const EXPORT_PAGE_SIZE = 200;

const itemSelect = {
  id: true,
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

export function exportFileName(now: Date): string {
  return `devstash-export-${now.toISOString().slice(0, 10)}.json`;
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

function toExportItem(item: DbItem): ExportItem {
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
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    collection: item.collection?.name ?? null,
    tags: item.tags.map(({ tag }) => tag.name),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// The export as a JSON document in pieces, one page of rows each, so memory stays at one page however large the stash is. The opening text is held back and sent with the first page, so the first piece only exists once a database read has worked
export async function* exportChunks(
  userId: string,
  now: Date = new Date(),
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

  pending += '],"items":[';
  separator = "";

  for await (const rows of pagesOf((args) =>
    prisma.item.findMany({
      where: { userId },
      orderBy: [...ORDER],
      select: itemSelect,
      ...args,
    }),
  )) {
    yield pending +
      separator +
      rows.map((row) => JSON.stringify(toExportItem(row))).join(",");
    pending = "";
    separator = ",";
  }

  yield pending + "]}";
}
