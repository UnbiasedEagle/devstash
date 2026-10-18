import type { DashboardItem } from "@/types/dashboard";

export interface ListItem extends DashboardItem {
  contentType: "TEXT" | "FILE" | "URL";
  url: string | null;
  fileName: string | null;
  contentPreview: string | null;
}

export interface ItemPage {
  items: ListItem[];
  total: number;
  page: number;
  totalPages: number;
}
