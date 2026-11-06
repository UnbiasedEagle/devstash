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

  if (!(await consumeSearchQuota(userId))) {
    return { success: false, error: SEARCH_LIMIT_MESSAGE };
  }

  try {
    const results = await quickSearchItems(
      userId,
      parsed.query,
      QUICK_SEARCH_LIMIT,
    );
    return { success: true, data: results };
  } catch (error) {
    console.error("Quick search failed", error);
    return { success: false, error: "Could not search. Try again." };
  }
}
