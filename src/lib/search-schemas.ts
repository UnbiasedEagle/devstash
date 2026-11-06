import { z } from "zod";

export const MAX_SEARCH_LENGTH = 100;
export const QUICK_SEARCH_LIMIT = 8;

const searchQuerySchema = z.string().trim().max(MAX_SEARCH_LENGTH);

export type SearchQueryResult =
  | { status: "empty" }
  | { status: "too-long" }
  | { status: "ok"; query: string };

export function parseSearchQuery(
  value: string | string[] | undefined,
): SearchQueryResult {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = searchQuerySchema.safeParse(raw ?? "");
  if (!parsed.success) return { status: "too-long" };
  return parsed.data
    ? { status: "ok", query: parsed.data }
    : { status: "empty" };
}

// Prisma's `contains` passes % and _ through as LIKE wildcards, so they must be escaped to match literally
export function escapeLikePattern(word: string): string {
  return word.replace(/[\\%_]/g, "\\$&");
}

// Each word adds a full-text scan of the user's items, so the number of words is capped
export const MAX_SEARCH_WORDS = 6;

export function splitSearchWords(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return [...new Set(words)].slice(0, MAX_SEARCH_WORDS);
}
