import type { ContentType } from "@/generated/prisma/client";

export interface ExportCollection {
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportItem {
  title: string;
  description: string | null;
  type: string;
  contentType: ContentType;
  content: string | null;
  url: string | null;
  language: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  collection: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  collections: ExportCollection[];
  items: ExportItem[];
}
