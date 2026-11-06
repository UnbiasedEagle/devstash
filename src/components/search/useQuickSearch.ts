"use client";

import { useEffect, useState } from "react";
import { quickSearch } from "@/actions/search";
import { parseSearchQuery } from "@/lib/search-schemas";
import type { QuickSearchResult } from "@/types/search";

export const SEARCH_DEBOUNCE_MS = 200;
export const SEARCH_FAILED_MESSAGE = "Could not search. Try again.";

type SearchStatus = "idle" | "loading" | "ready" | "error";

interface Response {
  query: string;
  results: QuickSearchResult[];
  error: string | null;
}

interface QuickSearchState {
  status: SearchStatus;
  // The trimmed query being searched, or null when there is nothing to search
  query: string | null;
  results: QuickSearchResult[];
  error: string | null;
}

export function useQuickSearch(input: string): QuickSearchState {
  const [response, setResponse] = useState<Response | null>(null);
  const parsed = parseSearchQuery(input);
  const query = parsed.status === "ok" ? parsed.query : null;

  useEffect(() => {
    if (!query) return;

    // Each keystroke re-runs this effect, so a response that arrives after a newer
    // query was typed finds `cancelled` set and is dropped
    let cancelled = false;
    const timer = setTimeout(async () => {
      let next: Response;
      try {
        const result = await quickSearch(query);
        next = result.success
          ? { query, results: result.data, error: null }
          : { query, results: [], error: result.error };
      } catch {
        // A thrown server action (network drop, deploy mismatch) must not leave the popup on "Searching…"
        next = { query, results: [], error: SEARCH_FAILED_MESSAGE };
      }
      if (!cancelled) setResponse(next);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (!query) {
    // Forgetting the last response means retyping the same query fetches again instead of reusing a stale result or error
    if (response) setResponse(null);
    return { status: "idle", query, results: [], error: null };
  }

  // Keeps showing the previous results until the new ones arrive, so the list does not flash empty
  const settled = response?.query === query;
  return {
    status: !settled ? "loading" : response.error ? "error" : "ready",
    query,
    results: response?.results ?? [],
    error: settled ? response.error : null,
  };
}
