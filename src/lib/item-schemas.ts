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

const tags = z
  .array(
    z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Tags can't be empty")
      .max(MAX_TAG_LENGTH, `Tags must be at most ${MAX_TAG_LENGTH} characters`),
  )
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

const common = { title, description, tags };

export const createItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Snippet"), ...common, content, language }),
  z.object({ type: z.literal("Command"), ...common, content, language }),
  z.object({ type: z.literal("Prompt"), ...common, content }),
  z.object({ type: z.literal("Note"), ...common, content }),
  z.object({ type: z.literal("URL"), ...common, url }),
]);

export type CreateItemInput = z.infer<typeof createItemSchema>;
