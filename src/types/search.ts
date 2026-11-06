import type { ItemTypeSummary } from "@/types/dashboard";

export interface QuickSearchResult {
  id: string;
  title: string;
  snippet: string | null;
  tags: string[];
  itemType: ItemTypeSummary;
}
