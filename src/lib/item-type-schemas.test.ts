import { describe, expect, it } from "vitest";
import {
  CUSTOM_TYPE_COLOR_NAMES,
  CUSTOM_TYPE_COLORS,
  CUSTOM_TYPE_ICON_LABELS,
  CUSTOM_TYPE_ICON_NAMES,
} from "@/lib/custom-type-options";
import { CUSTOM_TYPE_ICONS } from "@/lib/item-type-icons";
import { itemTypeSchema, MAX_TYPE_NAME_LENGTH } from "@/lib/item-type-schemas";

const VALID = { name: "Recipe", icon: "BookOpen", color: "#ef4444" };

// The built-in colors from prisma/seed.ts
const BUILT_IN_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#fde047",
  "#6b7280",
  "#ec4899",
  "#10b981",
];

describe("itemTypeSchema name", () => {
  it("accepts letters, digits and hyphens and trims", () => {
    const parsed = itemTypeSchema.parse({
      ...VALID,
      name: "  Meeting-notes2 ",
    });

    expect(parsed.name).toBe("Meeting-notes2");
  });

  it.each(["two words", "under_score", "", "   ", "emoji🙂"])(
    "rejects %j",
    (name) => {
      expect(itemTypeSchema.safeParse({ ...VALID, name }).success).toBe(false);
    },
  );

  it("allows the longest name and rejects one character more", () => {
    const longest = "a".repeat(MAX_TYPE_NAME_LENGTH);

    expect(itemTypeSchema.safeParse({ ...VALID, name: longest }).success).toBe(
      true,
    );
    expect(
      itemTypeSchema.safeParse({ ...VALID, name: `${longest}a` }).success,
    ).toBe(false);
  });

  it.each([
    "Snippet",
    "prompt",
    "COMMAND",
    "note",
    "File",
    "image",
    "url",
    "Link",
  ])("rejects the built-in name %s in any letter case", (name) => {
    expect(itemTypeSchema.safeParse({ ...VALID, name }).success).toBe(false);
  });
});

describe("custom type options", () => {
  it("has an icon for every name in the list", () => {
    for (const name of CUSTOM_TYPE_ICON_NAMES) {
      expect(CUSTOM_TYPE_ICONS[name]).toBeDefined();
    }
  });

  it("names every icon and color for screen readers, each name once", () => {
    const iconLabels = CUSTOM_TYPE_ICON_NAMES.map(
      (name) => CUSTOM_TYPE_ICON_LABELS[name],
    );
    const colorNames = CUSTOM_TYPE_COLORS.map(
      (color) => CUSTOM_TYPE_COLOR_NAMES[color],
    );

    expect(new Set(iconLabels).size).toBe(CUSTOM_TYPE_ICON_NAMES.length);
    expect(new Set(colorNames).size).toBe(CUSTOM_TYPE_COLORS.length);
    expect(
      [...iconLabels, ...colorNames].every((name) => name.length > 0),
    ).toBe(true);
  });

  it("never reuses a built-in color", () => {
    for (const color of CUSTOM_TYPE_COLORS) {
      expect(BUILT_IN_COLORS).not.toContain(color);
    }
  });

  it("rejects an icon or color outside the lists", () => {
    expect(itemTypeSchema.safeParse({ ...VALID, icon: "Code" }).success).toBe(
      false,
    );
    expect(
      itemTypeSchema.safeParse({ ...VALID, color: "#3b82f6" }).success,
    ).toBe(false);
  });
});
