import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ItemTypeCount, ItemTypeSummary } from "@/types/dashboard";

export const itemTypeSummarySelect = {
  id: true,
  name: true,
  icon: true,
  color: true,
} satisfies Prisma.ItemTypeSelect;

const SYSTEM_TYPE_ORDER = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "File",
  "Image",
  "URL",
];

function typeRank(name: string) {
  const index = SYSTEM_TYPE_ORDER.indexOf(name);
  return index === -1 ? SYSTEM_TYPE_ORDER.length : index;
}

export async function getItemTypeBySlug(
  userId: string,
  slug: string,
): Promise<ItemTypeSummary | null> {
  return prisma.itemType.findFirst({
    where: {
      name: { equals: slug, mode: "insensitive" },
      OR: [{ userId: null }, { userId }],
    },
    select: itemTypeSummarySelect,
    orderBy: { userId: { sort: "asc", nulls: "first" } },
  });
}

export async function getSystemItemTypes(): Promise<ItemTypeSummary[]> {
  const itemTypes = await prisma.itemType.findMany({
    where: { userId: null },
    select: itemTypeSummarySelect,
  });
  return itemTypes.sort((a, b) => typeRank(a.name) - typeRank(b.name));
}

export async function getItemTypeCounts(userId: string): Promise<ItemTypeCount[]> {
  const itemTypes = await prisma.itemType.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: {
      ...itemTypeSummarySelect,
      _count: { select: { items: { where: { userId } } } },
    },
    orderBy: { name: "asc" },
  });

  return itemTypes
    .map(({ _count, ...itemType }) => ({
      ...itemType,
      count: _count.items,
    }))
    .sort(
      (a, b) =>
        typeRank(a.name) - typeRank(b.name) || a.name.localeCompare(b.name),
    );
}
