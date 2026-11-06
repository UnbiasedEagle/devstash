import "server-only";
import { prisma } from "@/lib/prisma";
import type { TagSummary, TagWithCount } from "@/types/tags";

export async function getTagsWithCounts(
  userId: string,
): Promise<TagWithCount[]> {
  const tags = await prisma.tag.findMany({
    // Hides a tag whose last item was removed but which has not been cleaned up yet
    where: { userId, items: { some: {} } },
    orderBy: [{ items: { _count: "desc" } }, { name: "asc" }],
    select: { id: true, name: true, _count: { select: { items: true } } },
  });
  return tags.map(({ id, name, _count }) => ({
    id,
    name,
    count: _count.items,
  }));
}

export function getTagByName(
  userId: string,
  name: string,
): Promise<TagSummary | null> {
  return prisma.tag.findUnique({
    where: { userId_name: { userId, name } },
    select: { id: true, name: true },
  });
}
