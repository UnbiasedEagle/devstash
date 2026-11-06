import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { itemTypeSummarySelect } from "@/lib/db/item-types";
import { buildSearchWhere } from "@/lib/db/search";
import { ITEMS_PER_PAGE } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { splitSearchWords } from "@/lib/search-schemas";
import type { DashboardItem } from "@/types/dashboard";
import type { DetailItem, ItemPage } from "@/types/items";

const dashboardItemSelect = {
  id: true,
  title: true,
  description: true,
  isPinned: true,
  isFavorite: true,
  updatedAt: true,
  itemType: { select: itemTypeSummarySelect },
  tags: { select: { tag: { select: { name: true } } } },
} satisfies Prisma.ItemSelect;

type ItemRecord = Prisma.ItemGetPayload<{ select: typeof dashboardItemSelect }>;

const CONTENT_PREVIEW_LENGTH = 160;

const listItemSelect = {
  ...dashboardItemSelect,
  contentType: true,
  url: true,
  fileName: true,
} satisfies Prisma.ItemSelect;

function toDashboardItem({ tags, ...item }: ItemRecord): DashboardItem {
  return { ...item, tags: tags.map(({ tag }) => tag.name) };
}

const detailItemSelect = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  fileName: true,
  fileSize: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  itemType: { select: itemTypeSummarySelect },
  tags: { select: { tag: { select: { name: true } } } },
  collection: { select: { id: true, name: true } },
} satisfies Prisma.ItemSelect;

async function findDetailItem(
  where: Prisma.ItemWhereInput,
): Promise<DetailItem | null> {
  const item = await prisma.item.findFirst({
    where,
    select: detailItemSelect,
  });
  if (!item) return null;

  const { tags, ...rest } = item;
  return { ...rest, tags: tags.map(({ tag }) => tag.name) };
}

export function getItemById(
  userId: string,
  id: string,
  scope: { itemTypeId: string },
): Promise<DetailItem | null> {
  return findDetailItem({ id, userId, ...scope });
}

export function getItemForUser(
  userId: string,
  id: string,
): Promise<DetailItem | null> {
  return findDetailItem({ id, userId });
}

export function getItemsByType(
  userId: string,
  itemTypeId: string,
  requestedPage: number,
): Promise<ItemPage> {
  return getItemPage(userId, { itemTypeId }, requestedPage);
}

export function getItemsByCollection(
  userId: string,
  collectionId: string,
  requestedPage: number,
): Promise<ItemPage> {
  return getItemPage(userId, { collectionId }, requestedPage);
}

export function getItemsByTag(
  userId: string,
  tagId: string,
  requestedPage: number,
): Promise<ItemPage> {
  return getItemPage(userId, { tags: { some: { tagId } } }, requestedPage);
}

export function searchItems(
  userId: string,
  query: string,
  requestedPage: number,
): Promise<ItemPage> {
  const words = splitSearchWords(query);
  // An empty AND would match every item
  if (words.length === 0) {
    return Promise.resolve({ items: [], total: 0, page: 1, totalPages: 1 });
  }

  return getItemPage(userId, buildSearchWhere(words), requestedPage);
}

async function getItemPage(
  userId: string,
  scope: Prisma.ItemWhereInput,
  requestedPage: number,
): Promise<ItemPage> {
  const where = { userId, ...scope };
  // One snapshot, so the count can't disagree with the page if items change in between
  const { total, totalPages, page, items } = await prisma.$transaction(
    async (tx) => {
      const total = await tx.item.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
      const page = Math.min(requestedPage, totalPages);

      const items = await tx.item.findMany({
        where,
        select: listItemSelect,
        // The id tiebreaker keeps items from repeating or skipping across pages when timestamps match
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      });
      return { total, totalPages, page, items };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );

  // Trimming in the database avoids loading up to 50,000 characters of content per item just for a preview
  const previews =
    items.length === 0
      ? []
      : await prisma.$queryRaw<{ id: string; preview: string | null }[]>`
          select id, left(content, ${CONTENT_PREVIEW_LENGTH}::int) as preview
          from "Item"
          where "userId" = ${userId}
            and id in (${Prisma.join(items.map(({ id }) => id))})`;
  const previewById = new Map(previews.map(({ id, preview }) => [id, preview]));

  return {
    items: items.map(({ tags, ...item }) => ({
      ...item,
      tags: tags.map(({ tag }) => tag.name),
      contentPreview: previewById.get(item.id) ?? null,
    })),
    total,
    page,
    totalPages,
  };
}

export async function getPinnedItems(
  userId: string,
  limit: number,
): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    select: dashboardItemSelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return items.map(toDashboardItem);
}

export async function getRecentItems(
  userId: string,
  limit: number,
): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    select: dashboardItemSelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return items.map(toDashboardItem);
}
