import { z } from "zod";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/item-schemas";

export const MAX_COLLECTION_NAME_LENGTH = 100;

export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(
      MAX_COLLECTION_NAME_LENGTH,
      `Name must be at most ${MAX_COLLECTION_NAME_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
    )
    .optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
