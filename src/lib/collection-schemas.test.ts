import { describe, expect, it } from "vitest";
import {
  collectionSchema,
  MAX_COLLECTION_NAME_LENGTH,
} from "@/lib/collection-schemas";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/item-schemas";

describe("collectionSchema", () => {
  it("trims the name and description", () => {
    const parsed = collectionSchema.parse({
      name: "  React Patterns ",
      description: " Hooks and more ",
    });

    expect(parsed).toEqual({
      name: "React Patterns",
      description: "Hooks and more",
    });
  });

  it("accepts a missing description", () => {
    expect(collectionSchema.safeParse({ name: "DevOps" }).success).toBe(true);
  });

  it.each(["", "   "])("rejects a blank name %j", (name) => {
    expect(collectionSchema.safeParse({ name }).success).toBe(false);
  });

  it("rejects an oversized name and description", () => {
    expect(
      collectionSchema.safeParse({
        name: "a".repeat(MAX_COLLECTION_NAME_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      collectionSchema.safeParse({
        name: "ok",
        description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});
