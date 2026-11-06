import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { itemTypeSummarySelect } from "@/lib/db/item-types";
import { prisma } from "@/lib/prisma";
import { escapeLikePattern, splitSearchWords } from "@/lib/search-schemas";
import type { QuickSearchResult } from "@/types/search";

const SNIPPET_LENGTH = 120;
const SNIPPET_LEAD = 30;

export function buildSearchWhere(words: string[]): Prisma.ItemWhereInput {
  const containsWord = (word: string) =>
    ({ contains: escapeLikePattern(word), mode: "insensitive" }) as const;

  return {
    AND: words.map((word) => ({
      OR: [
        { title: containsWord(word) },
        { description: containsWord(word) },
        { content: containsWord(word) },
        { url: containsWord(word) },
        { itemType: { name: containsWord(word) } },
        { tags: { some: { tag: { name: containsWord(word) } } } },
      ],
    })),
  };
}

// Starts a little before the first match so a match deep in a long description is still visible
function toSingleLine(
  text: string | null,
  words: string[] = [],
): string | null {
  const line = text?.replace(/\s+/g, " ").trim();
  if (!line) return null;

  const lowerLine = line.toLowerCase();
  const hits = words
    .map((word) => lowerLine.indexOf(word))
    .filter((i) => i >= 0);
  const start = hits.length ? Math.max(Math.min(...hits) - SNIPPET_LEAD, 0) : 0;
  return line.slice(start, start + SNIPPET_LENGTH);
}

export function pickSnippet(
  description: string | null,
  contentSnippet: string | null,
  contentMatched: boolean,
  words: string[],
): string | null {
  const lowerDescription = description?.toLowerCase() ?? "";
  if (words.some((word) => lowerDescription.includes(word))) {
    return toSingleLine(description, words);
  }
  if (contentMatched) return toSingleLine(contentSnippet);
  return toSingleLine(description) ?? toSingleLine(contentSnippet);
}

// Cut in the database so a 50,000 character note is never loaded just to show one line
async function getContentSnippets(
  userId: string,
  ids: string[],
  words: string[],
) {
  const firstMatch = Prisma.join(
    words.map(
      (word) => Prisma.sql`nullif(strpos(lower(content), lower(${word})), 0)`,
    ),
  );
  const rows = await prisma.$queryRaw<
    { id: string; snippet: string | null; matched: boolean }[]
  >`
    select id,
      substring(content from greatest(coalesce(${firstMatch}, 1) - ${SNIPPET_LEAD}::int, 1) for ${SNIPPET_LENGTH}::int) as snippet,
      coalesce(${firstMatch}) is not null as matched
    from "Item"
    where "userId" = ${userId}
      and id in (${Prisma.join(ids)})`;
  return new Map(rows.map((row) => [row.id, row]));
}

export async function quickSearchItems(
  userId: string,
  query: string,
  limit: number,
): Promise<QuickSearchResult[]> {
  const words = splitSearchWords(query);
  if (words.length === 0) return [];

  const items = await prisma.item.findMany({
    where: { userId, ...buildSearchWhere(words) },
    select: {
      id: true,
      title: true,
      description: true,
      itemType: { select: itemTypeSummarySelect },
      tags: { select: { tag: { select: { name: true } } } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    take: limit,
  });
  if (items.length === 0) return [];

  const snippets = await getContentSnippets(
    userId,
    items.map(({ id }) => id),
    words,
  );

  return items.map(({ description, tags, ...item }) => {
    const content = snippets.get(item.id);
    return {
      ...item,
      snippet: pickSnippet(
        description,
        content?.snippet ?? null,
        content?.matched ?? false,
        words,
      ),
      tags: tags.map(({ tag }) => tag.name),
    };
  });
}
