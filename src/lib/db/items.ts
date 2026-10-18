import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { itemTypeSummarySelect } from "@/lib/db/item-types";
import { ITEMS_PER_PAGE } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type { DashboardItem } from "@/types/dashboard";
import type { ItemPage } from "@/types/items";

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

export async function getItemsByType(
  userId: string,
  itemTypeId: string,
  requestedPage: number,
): Promise<ItemPage> {
  const where = { userId, itemTypeId };
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
