import { z } from "zod";
import {
  CUSTOM_TYPE_COLORS,
  CUSTOM_TYPE_ICON_NAMES,
} from "@/lib/custom-type-options";

export const MAX_TYPE_NAME_LENGTH = 24;

// "URL" is the stored name of the Link type and "Link" is its label, so both are taken
const RESERVED_TYPE_NAMES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "url",
  "link",
];

export const itemTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(
      MAX_TYPE_NAME_LENGTH,
      `Name must be at most ${MAX_TYPE_NAME_LENGTH} characters`,
    )
    .regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers and hyphens")
    .refine(
      (name) => !RESERVED_TYPE_NAMES.includes(name.toLowerCase()),
      "That name is used by a built-in type",
    ),
  icon: z.enum(CUSTOM_TYPE_ICON_NAMES, "Pick an icon"),
  color: z.enum(CUSTOM_TYPE_COLORS, "Pick a color"),
});

export type ItemTypeInput = z.infer<typeof itemTypeSchema>;

export const itemTypeIdSchema = z.string().min(1).max(64);
