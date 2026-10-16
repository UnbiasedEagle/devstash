import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { itemTypeSummarySelect } from "@/lib/db/item-types";
import { prisma } from "@/lib/prisma";
import type { DashboardItem } from "@/types/dashboard";

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

function toDashboardItem({ tags, ...item }: ItemRecord): DashboardItem {
  return { ...item, tags: tags.map(({ tag }) => tag.name) };
}

export async function getPinnedItems(userId: string): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    select: dashboardItemSelect,
    orderBy: { updatedAt: "desc" },
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
