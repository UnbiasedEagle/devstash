import type { ContentType } from "@/generated/prisma/client";

export type ExportFormat = "json" | "zip";

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
  // Where the file sits inside a ZIP export; absent from a plain JSON export
  file?: string;
  isFavorite: boolean;
  isPinned: boolean;
  collection: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type MissingFileReason = "unreadable" | "size_limit" | "count_limit";

export interface MissingFile {
  itemId: string;
  fileName: string;
  reason: MissingFileReason;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  collections: ExportCollection[];
  items: ExportItem[];
  // Only in a ZIP export: the files that didn't make it into the archive
  missing?: MissingFile[];
}

export interface ExportFileItem {
  id: string;
  fileKey: string;
  fileName: string;
  // Missing from the database for a row that is damaged, which can't be checked after reading
  fileSize: number | null;
}

// What a ZIP export tells the document about its files, filled in while the files are written
export interface ExportedFiles {
  paths: Map<string, string>;
  missing: MissingFile[];
}
