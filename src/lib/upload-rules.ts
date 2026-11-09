import { z } from "zod";

export type UploadKind = "image" | "file";

interface AllowedType {
  mimeType: string;
  // What browsers and systems send for the same files, such as an empty type for Markdown or a spreadsheet type for CSV on Windows
  aliases: string[];
  extensions: string[];
}

export type UploadValidation =
  { ok: true; mimeType: string } | { ok: false; error: string };

const MEGABYTE = 1024 * 1024;

export const MAX_UPLOAD_BYTES: Record<UploadKind, number> = {
  image: 5 * MEGABYTE,
  file: 10 * MEGABYTE,
};

const MAX_FILE_NAME_LENGTH = 120;
const MAX_EXTENSION_LENGTH = 10;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// SVG is left out on purpose: it can carry scripts, so it isn't safe to serve back as an image
const ALLOWED_TYPES: Record<UploadKind, AllowedType[]> = {
  image: [
    { mimeType: "image/png", aliases: ["image/x-png"], extensions: ["png"] },
    {
      mimeType: "image/jpeg",
      aliases: ["image/jpg", "image/pjpeg"],
      extensions: ["jpg", "jpeg"],
    },
    { mimeType: "image/gif", aliases: [], extensions: ["gif"] },
    { mimeType: "image/webp", aliases: [], extensions: ["webp"] },
  ],
  file: [
    {
      mimeType: "application/pdf",
      aliases: ["application/x-pdf"],
      extensions: ["pdf"],
    },
    { mimeType: "text/plain", aliases: [], extensions: ["txt"] },
    {
      mimeType: "text/markdown",
      aliases: ["text/x-markdown"],
      extensions: ["md", "markdown"],
    },
    {
      mimeType: "application/json",
      aliases: ["application/x-json", "text/json"],
      extensions: ["json"],
    },
    {
      mimeType: "text/csv",
      aliases: ["application/csv", "text/x-csv", "application/vnd.ms-excel"],
      extensions: ["csv"],
    },
    {
      mimeType: "application/zip",
      aliases: ["application/x-zip-compressed", "application/x-zip"],
      extensions: ["zip"],
    },
    {
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      aliases: [],
      extensions: ["docx"],
    },
    {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      aliases: [],
      extensions: ["xlsx"],
    },
    {
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      aliases: [],
      extensions: ["pptx"],
    },
  ],
};

const TYPE_ERRORS: Record<UploadKind, string> = {
  image: "Choose a PNG, JPEG, GIF or WebP image",
  file: "This file type isn't supported. Choose a PDF, text, Markdown, JSON, CSV or ZIP file, or a Word, Excel or PowerPoint document",
};

export const uploadRequestSchema = z.object({
  kind: z.enum(["image", "file"]),
  fileName: z.string().min(1).max(255),
  // Some systems send no type at all, and the extension is what decides the stored type anyway
  mimeType: z.string().max(127),
  size: z.number().int().positive(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// Control characters, line and paragraph separators, direction marks and the overrides that can make a name show a different extension than it has
function isHiddenCharacter(character: string) {
  const code = character.charCodeAt(0);
  return (
    code < 0x20 ||
    code === 0x7f ||
    (code >= 0x200e && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

// Keeps only the last path segment and drops hidden characters and leading dots, so a name can never point somewhere else or hide as a dotfile
export function cleanFileName(fileName: string): string {
  const lastSegment = fileName.split(/[\\/]/).pop() ?? "";
  const cleaned = [...lastSegment]
    .filter((character) => !isHiddenCharacter(character))
    .join("")
    .trim()
    .replace(/^\.+/, "")
    .trim();
  if (!cleaned) return "file";
  if (cleaned.length <= MAX_FILE_NAME_LENGTH) return cleaned;

  const dot = cleaned.lastIndexOf(".");
  const extension =
    dot > 0 && cleaned.length - dot <= MAX_EXTENSION_LENGTH
      ? cleaned.slice(dot)
      : "";
  return cleaned.slice(0, MAX_FILE_NAME_LENGTH - extension.length) + extension;
}

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

export function formatSizeLimit(bytes: number): string {
  return `${bytes / MEGABYTE} MB`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MEGABYTE) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MEGABYTE).toFixed(1)} MB`;
}

// For the file picker's `accept`, so it offers what the rules allow
export function acceptedExtensions(kind: UploadKind): string[] {
  return ALLOWED_TYPES[kind].flatMap((type) =>
    type.extensions.map((extension) => `.${extension}`),
  );
}

export const UPLOAD_HINTS: Record<UploadKind, string> = {
  image: `PNG, JPEG, GIF or WebP, up to ${formatSizeLimit(MAX_UPLOAD_BYTES.image)}`,
  file: `PDF, text, Markdown, JSON, CSV, ZIP, Word, Excel or PowerPoint, up to ${formatSizeLimit(MAX_UPLOAD_BYTES.file)}`,
};

// The extension decides the stored type. The declared type is only a hint that has to agree with it: empty, the type itself or a known alias, so a renamed file can't pass as another type
export function validateUpload(
  request: Pick<UploadRequest, "kind" | "fileName" | "mimeType" | "size">,
): UploadValidation {
  const { kind, fileName, mimeType, size } = request;
  if (size <= 0) return { ok: false, error: "This file is empty" };

  const limit = MAX_UPLOAD_BYTES[kind];
  if (size > limit) {
    const label = kind === "image" ? "Images" : "Files";
    return {
      ok: false,
      error: `${label} can be at most ${formatSizeLimit(limit)}`,
    };
  }

  const extension = getExtension(cleanFileName(fileName));
  const allowed = ALLOWED_TYPES[kind].find((type) =>
    type.extensions.includes(extension),
  );
  const declared = mimeType.trim().toLowerCase();
  const agrees =
    allowed !== undefined &&
    (declared === "" ||
      declared === allowed.mimeType ||
      allowed.aliases.includes(declared));
  if (!allowed || !agrees) return { ok: false, error: TYPE_ERRORS[kind] };

  return { ok: true, mimeType: allowed.mimeType };
}

// Stored types are always the canonical ones, so anything else coming back from the database is not something to serve
export function isAllowedMimeType(kind: UploadKind, mimeType: string): boolean {
  return ALLOWED_TYPES[kind].some(
    (type) => type.mimeType === mimeType.toLowerCase(),
  );
}

// The key never holds the user's file name, which is kept in the database, so nothing in it can be used to guess or traverse a path
export function pendingKey(userId: string, id: string): string {
  return `pending/${userId}/${id}`;
}

export function fileKey(userId: string, id: string): string {
  return `files/${userId}/${id}`;
}

// The only barrier between a key that came back from the browser and the storage calls: it must be this user's own pending upload and nothing else
export function parsePendingKey(userId: string, key: string): string | null {
  const parts = key.split("/");
  if (parts.length !== 3) return null;
  const [prefix, owner, id] = parts;
  if (prefix !== "pending" || owner !== userId || !UUID_PATTERN.test(id)) {
    return null;
  }
  return id;
}

// A plain ASCII name for old clients plus the full UTF-8 name for the rest
export function attachmentDisposition(fileName: string): string {
  const name = cleanFileName(fileName);
  const fallback = [...name]
    .map((character) =>
      character.charCodeAt(0) > 0x7e || character === '"' || character === "\\"
        ? "_"
        : character,
    )
    .join("");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
