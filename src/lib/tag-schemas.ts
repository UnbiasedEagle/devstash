import { tagNameSchema } from "@/lib/item-schemas";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Next hands dynamic route params over still percent-encoded, so the name is decoded exactly once here
export function parseTagName(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return tagNameSchema.safeParse(safeDecode(value)).data;
}
