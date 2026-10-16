import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ItemTypeCount } from "@/types/dashboard";

export const itemTypeSummarySelect = {
  id: true,
  name: true,
  icon: true,
  color: true,
} satisfies Prisma.ItemTypeSelect;

export async function getItemTypeCounts(userId: string): Promise<ItemTypeCount[]> {
  const itemTypes = await prisma.itemType.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: {
      ...itemTypeSummarySelect,
      _count: { select: { items: { where: { userId } } } },
    },
    orderBy: { name: "asc" },
  });

  return itemTypes.map(({ _count, ...itemType }) => ({
    ...itemType,
    count: _count.items,
  }));
}
