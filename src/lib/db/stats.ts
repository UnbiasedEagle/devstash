import "server-only";
import { getItemTypeCounts } from "@/lib/db/item-types";
import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/types/dashboard";

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [totalItems, totalCollections, favoriteItems, favoriteCollections, itemTypeCounts] =
    await Promise.all([
      prisma.item.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
      prisma.item.count({ where: { userId, isFavorite: true } }),
      prisma.collection.count({ where: { userId, isFavorite: true } }),
      getItemTypeCounts(userId),
    ]);

  return {
    totalItems,
    totalCollections,
    favoriteItems,
    favoriteCollections,
    itemTypeCounts,
  };
}
