import { z } from "zod";

export const CREATABLE_ITEM_TYPES = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "URL",
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export function isCreatableItemType(name: string): name is CreatableItemType {
  return (CREATABLE_ITEM_TYPES as readonly string[]).includes(name);
}

// Items made from an uploaded file. Edits change only their details, never the file
export const UPLOAD_ITEM_TYPES = ["File", "Image"] as const;

export type UploadItemType = (typeof UPLOAD_ITEM_TYPES)[number];

export type NewItemType = CreatableItemType | UploadItemType;

export function isUploadItemType(name: string): name is UploadItemType {
  return (UPLOAD_ITEM_TYPES as readonly string[]).includes(name);
}

export function isNewItemType(name: string): name is NewItemType {
  return isCreatableItemType(name) || isUploadItemType(name);
}

// A custom type's name can't be a built-in one, so any other name is one of the user's own types
export function isCustomItemType(name: string): boolean {
  return !isNewItemType(name);
}

export function uploadKindFor(type: UploadItemType): "image" | "file" {
  return type === "Image" ? "image" : "file";
}

export const ITEM_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "bash",
  "json",
  "html",
  "css",
  "sql",
  "go",
  "rust",
  "java",
  "plaintext",
] as const;

export function isItemLanguage(name: string) {
  return (ITEM_LANGUAGES as readonly string[]).includes(name);
}

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CONTENT_LENGTH = 50_000;
export const MAX_URL_LENGTH = 2048;

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isHttpUrl(value: string) {
  return parseHttpUrl(value) !== null;
}

function hasNoCredentials(value: string) {
  const url = parseHttpUrl(value);
  return url === null || (url.username === "" && url.password === "");
}

const title = z
  .string()
  .trim()
  .min(1, "Enter a title")
  .max(
    MAX_TITLE_LENGTH,
    `Title must be at most ${MAX_TITLE_LENGTH} characters`,
  );

const description = z
  .string()
  .trim()
  .max(
    MAX_DESCRIPTION_LENGTH,
    `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
  )
  .optional();

// Also used to normalize the tag name in the /tags/[name] route so both sides match
export const tagNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Tags can't be empty")
  .max(MAX_TAG_LENGTH, `Tags must be at most ${MAX_TAG_LENGTH} characters`);

const tags = z
  .array(tagNameSchema)
  .max(MAX_TAGS, `Add at most ${MAX_TAGS} tags`)
  .refine(
    (values) => new Set(values).size === values.length,
    "Remove duplicate tags",
  );

const content = z
  .string()
  .max(
    MAX_CONTENT_LENGTH,
    `Content must be at most ${MAX_CONTENT_LENGTH.toLocaleString("en-US")} characters`,
  )
  .refine((value) => value.trim().length > 0, "Enter some content");

const language = z.enum(ITEM_LANGUAGES).optional();

const url = z
  .string()
  .trim()
  .min(1, "Enter a URL")
  .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
  .refine(isHttpUrl, "Enter a valid http or https URL")
  .refine(hasNoCredentials, "Remove the username and password from the URL");

const collectionId = z.string().min(1).max(64).optional();

const common = { title, description, tags, collectionId };

// What every item form fills in, before a file has been chosen or uploaded
export const itemMetaSchema = z.object(common);

// The shape of a key from requestUpload; whose it is gets checked against the signed-in user on the server
const PENDING_KEY_PATTERN = /^pending\/[^/]+\/[0-9a-f-]{36}$/i;

const fileFields = {
  fileKey: z
    .string()
    .max(200)
    .regex(PENDING_KEY_PATTERN, "Upload the file again"),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive(),
  // May be empty on purpose: some systems send no type, and the server settles the type from the extension and the stored object
  fileMimeType: z.string().max(127),
};

const textItemSchemas = [
  z.object({ type: z.literal("Snippet"), ...common, content, language }),
  z.object({ type: z.literal("Command"), ...common, content, language }),
  z.object({ type: z.literal("Prompt"), ...common, content }),
  z.object({ type: z.literal("Note"), ...common, content }),
  z.object({ type: z.literal("URL"), ...common, url }),
] as const;

// A user's own type holds text like a Note. "Custom" isn't a type name: the type is the id, which the server checks belongs to the user
export const CUSTOM_ITEM_TYPE = "Custom";

const customItemSchema = z.object({
  type: z.literal(CUSTOM_ITEM_TYPE),
  customTypeId: z.string().min(1).max(64),
  ...common,
  content,
});

export const createItemSchema = z.discriminatedUnion("type", [
  ...textItemSchemas,
  customItemSchema,
  z.object({ type: z.literal("File"), ...common, ...fileFields }),
  z.object({ type: z.literal("Image"), ...common, ...fileFields }),
]);

export type CreateItemInput = z.infer<typeof createItemSchema>;

// Editing a File or an Image changes only what every item has, never the file itself
export const updateItemSchema = z.discriminatedUnion("type", [
  ...textItemSchemas,
  customItemSchema,
  z.object({ type: z.literal("File"), ...common }),
  z.object({ type: z.literal("Image"), ...common }),
]);

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const itemIdSchema = z.string().min(1).max(64);

// The `?item=` search param, which Next hands over as a string, an array when repeated, or nothing
export function parseItemId(value: string | string[] | undefined) {
  return itemIdSchema.safeParse(Array.isArray(value) ? value[0] : value).data;
}
