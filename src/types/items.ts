import type { DashboardItem, ItemTypeSummary } from "@/types/dashboard";

export interface ListItem extends DashboardItem {
  contentType: "TEXT" | "FILE" | "URL";
  url: string | null;
  fileName: string | null;
  contentPreview: string | null;
}

export interface ItemFlags {
  isFavorite: boolean;
  isPinned: boolean;
}

export type DrawerPreview = Pick<
  ListItem,
  "id" | "title" | "description" | "tags" | "itemType"
>;

export interface ItemPage {
  items: ListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DetailItem {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: ItemTypeSummary;
  tags: string[];
}
