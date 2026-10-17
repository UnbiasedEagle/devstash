import "server-only";
import { itemTypeSummarySelect } from "@/lib/db/item-types";
import { prisma } from "@/lib/prisma";
import type {
  DashboardCollection,
  ItemTypeSummary,
  SidebarCollection,
  SidebarCollections,
} from "@/types/dashboard";

const EMPTY_COLLECTION_COLOR = "#6b7280";

interface TypeUsage {
  itemType: ItemTypeSummary;
  count: number;
}

function byMostUsed(a: TypeUsage, b: TypeUsage) {
  return b.count - a.count || a.itemType.name.localeCompare(b.itemType.name);
}

async function findTypeUsageByCollection(
  collectionIds: string[],
): Promise<Map<string, TypeUsage[]>> {
  const typeUsage = await prisma.item.groupBy({
    by: ["collectionId", "itemTypeId"],
    where: { collectionId: { in: collectionIds } },
    _count: { _all: true },
  });
  const itemTypes = await prisma.itemType.findMany({
    where: { id: { in: typeUsage.map(({ itemTypeId }) => itemTypeId) } },
    select: itemTypeSummarySelect,
  });
  const itemTypeById = new Map(itemTypes.map((type) => [type.id, type]));

  const usageByCollection = new Map<string, TypeUsage[]>();
  for (const { collectionId, itemTypeId, _count } of typeUsage) {
    const itemType = itemTypeById.get(itemTypeId);
    if (!collectionId || !itemType) continue;
    const usage = usageByCollection.get(collectionId) ?? [];
    usage.push({ itemType, count: _count._all });
    usageByCollection.set(collectionId, usage);
  }
  for (const usage of usageByCollection.values()) usage.sort(byMostUsed);
  return usageByCollection;
}

async function findSidebarCollections(
  userId: string,
  isFavorite: boolean,
  limit?: number,
): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite },
    orderBy: isFavorite ? { name: "asc" } : { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true, _count: { select: { items: true } } },
  });
  const usageByCollection = await findTypeUsageByCollection(
    collections.map(({ id }) => id),
  );

  return collections.map(({ _count, ...collection }) => ({
    ...collection,
    itemCount: _count.items,
    color:
      usageByCollection.get(collection.id)?.[0]?.itemType.color ??
      EMPTY_COLLECTION_COLOR,
  }));
}

export async function getSidebarCollections(
  userId: string,
  favoriteLimit: number,
  recentLimit: number,
): Promise<SidebarCollections> {
  const [favorites, recent] = await Promise.all([
    findSidebarCollections(userId, true, favoriteLimit),
    findSidebarCollections(userId, false, recentLimit),
  ]);
  return { favorites, recent };
}

export async function getRecentCollections(
  userId: string,
  limit: number,
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      _count: { select: { items: true } },
    },
  });

  const usageByCollection = await findTypeUsageByCollection(
    collections.map(({ id }) => id),
  );

  return collections.map(({ _count, ...collection }) => {
    const usage = usageByCollection.get(collection.id) ?? [];

    return {
      ...collection,
      itemCount: _count.items,
      color: usage[0]?.itemType.color ?? EMPTY_COLLECTION_COLOR,
      itemTypes: usage.map(({ itemType }) => itemType),
    };
  });
}
