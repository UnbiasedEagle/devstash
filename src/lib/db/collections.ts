import "server-only";
import { itemTypeSummarySelect } from "@/lib/db/item-types";
import { prisma } from "@/lib/prisma";
import type { DashboardCollection, ItemTypeSummary } from "@/types/dashboard";

const EMPTY_COLLECTION_COLOR = "#6b7280";

interface TypeUsage {
  itemType: ItemTypeSummary;
  count: number;
}

function byMostUsed(a: TypeUsage, b: TypeUsage) {
  return b.count - a.count || a.itemType.name.localeCompare(b.itemType.name);
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

  const typeUsage = await prisma.item.groupBy({
    by: ["collectionId", "itemTypeId"],
    where: { collectionId: { in: collections.map(({ id }) => id) } },
    _count: { _all: true },
  });
  const itemTypes = await prisma.itemType.findMany({
    where: { id: { in: typeUsage.map(({ itemTypeId }) => itemTypeId) } },
    select: itemTypeSummarySelect,
  });
  const itemTypeById = new Map(itemTypes.map((type) => [type.id, type]));

  return collections.map(({ _count, ...collection }) => {
    const usage = typeUsage
      .filter(({ collectionId }) => collectionId === collection.id)
      .map(({ itemTypeId, _count: { _all } }) => ({
        itemType: itemTypeById.get(itemTypeId)!,
        count: _all,
      }))
      .sort(byMostUsed);

    return {
      ...collection,
      itemCount: _count.items,
      color: usage[0]?.itemType.color ?? EMPTY_COLLECTION_COLOR,
      itemTypes: usage.map(({ itemType }) => itemType),
    };
  });
}
