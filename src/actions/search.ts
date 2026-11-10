"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { quickSearchItems } from "@/lib/db/search";
import {
  consumeSearchQuota,
  SEARCH_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import {
  MAX_SEARCH_LENGTH,
  parseSearchQuery,
  QUICK_SEARCH_LIMIT,
} from "@/lib/search-schemas";
import type { ActionResult } from "@/types/actions";
import type { QuickSearchResult } from "@/types/search";

export async function quickSearch(
  input: unknown,
): Promise<ActionResult<QuickSearchResult[]>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to search" };
  }
  const userId = session.user.id;

  const parsed = parseSearchQuery(
    typeof input === "string" ? input : undefined,
  );
  if (parsed.status === "too-long") {
    return {
      success: false,
      error: `Search is limited to ${MAX_SEARCH_LENGTH} characters`,
    };
  }
  if (parsed.status === "empty") return { success: true, data: [] };

  // The quota check and the search run together, so the Redis round trip is not added to the database ones. A user over the limit costs one wasted query, and gets no results
  const [allowed, search] = await Promise.allSettled([
    consumeSearchQuota(userId),
    quickSearchItems(userId, parsed.query, QUICK_SEARCH_LIMIT),
  ]);
  // consumeSearchQuota never rejects: it allows the request when Redis is down
  if (allowed.status === "fulfilled" && !allowed.value) {
    return { success: false, error: SEARCH_LIMIT_MESSAGE };
  }
  if (search.status === "rejected") {
    console.error("Quick search failed", search.reason);
    return { success: false, error: "Could not search. Try again." };
  }
  return { success: true, data: search.value };
}
