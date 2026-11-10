import {
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  type ITEM_LANGUAGES,
} from "@/lib/item-schemas";

export const MAX_IMPORT_FILES = 20;
export const MAX_IMPORT_FILE_NAME_LENGTH = 255;
// A guard on the size of one request. The real limit is MAX_CONTENT_LENGTH, applied after trimming
export const MAX_IMPORT_RAW_LENGTH = 200_000;

type ItemLanguage = (typeof ITEM_LANGUAGES)[number];

export type ImportTarget =
  { type: "Note" } | { type: "Snippet"; language: ItemLanguage };

const NOTE: ImportTarget = { type: "Note" };

function snippet(language: ItemLanguage): ImportTarget {
  return { type: "Snippet", language };
}

const TARGETS: Record<string, ImportTarget> = {
  md: NOTE,
  markdown: NOTE,
  txt: NOTE,
  ts: snippet("typescript"),
  tsx: snippet("typescript"),
  js: snippet("javascript"),
  jsx: snippet("javascript"),
  mjs: snippet("javascript"),
  cjs: snippet("javascript"),
  py: snippet("python"),
  sh: snippet("bash"),
  bash: snippet("bash"),
  json: snippet("json"),
  html: snippet("html"),
  htm: snippet("html"),
  css: snippet("css"),
  sql: snippet("sql"),
  go: snippet("go"),
  rs: snippet("rust"),
  java: snippet("java"),
};

export const IMPORT_ACCEPT = Object.keys(TARGETS)
  .map((extension) => `.${extension}`)
  .join(",");

export const IMPORT_ERRORS = {
  unsupported: "Not a supported file type",
  binary: "Not a text file",
  empty: "The file is empty",
  tooLong: `The file is longer than ${MAX_CONTENT_LENGTH.toLocaleString("en-US")} characters`,
  badName: "The file name is not valid",
  nameTooLong: `The file name is longer than ${MAX_IMPORT_FILE_NAME_LENGTH} characters`,
};

function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function importTargetFor(fileName: string): ImportTarget | null {
  return TARGETS[extensionOf(fileName)] ?? null;
}

// Only the last extension goes, so notes.v2.md becomes notes.v2
export function importTitle(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  const base = (dot === -1 ? fileName : fileName.slice(0, dot)).trim();
  return (base || fileName.trim()).slice(0, MAX_TITLE_LENGTH);
}

export function importTargetLabel(target: ImportTarget) {
  return target.type === "Note" ? "Note" : `Snippet · ${target.language}`;
}

export type ImportCheck =
  | { ok: true; target: ImportTarget; title: string; content: string }
  | { ok: false; error: string };

export function checkImportFile(file: {
  fileName: string;
  content: string;
}): ImportCheck {
  if (file.fileName.length > MAX_IMPORT_FILE_NAME_LENGTH) {
    return { ok: false, error: IMPORT_ERRORS.nameTooLong };
  }
  // Postgres refuses a null character in text, and the name becomes the title
  if (file.fileName.includes("\0")) {
    return { ok: false, error: IMPORT_ERRORS.badName };
  }
  const target = importTargetFor(file.fileName);
  if (!target) return { ok: false, error: IMPORT_ERRORS.unsupported };
  if (file.content.includes("\0")) {
    return { ok: false, error: IMPORT_ERRORS.binary };
  }
  const content = file.content.trim();
  if (!content) return { ok: false, error: IMPORT_ERRORS.empty };
  if (content.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: IMPORT_ERRORS.tooLong };
  }
  return { ok: true, target, title: importTitle(file.fileName), content };
}
