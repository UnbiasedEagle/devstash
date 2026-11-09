import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KIND_STYLES,
  LANDING_KINDS,
  type LandingKind,
} from "@/components/landing/type-styles";

const seed = readFileSync("prisma/seed.ts", "utf8");

// The page calls URL items "Link"
const SEED_NAME: Record<LandingKind, string> = {
  Snippet: "Snippet",
  Prompt: "Prompt",
  Command: "Command",
  Note: "Note",
  File: "File",
  Image: "Image",
  Link: "URL",
};

// Lightened on purpose: the seed's gray is too dark to read as text on the dark background
const LIGHTENED: Partial<Record<LandingKind, string>> = { File: "#8b93a0" };

function seedColor(name: string): string {
  const match = new RegExp(`name: "${name}",[^}]*color: "(#[0-9a-f]{6})"`).exec(
    seed,
  );
  if (!match) throw new Error(`No item type named ${name} in the seed`);
  return match[1];
}

describe("the landing page's type colors", () => {
  it.each(LANDING_KINDS)(
    "%s uses the color of its item type in the app",
    (kind) => {
      const expected = LIGHTENED[kind] ?? seedColor(SEED_NAME[kind]);

      expect(KIND_STYLES[kind].text).toBe(`text-[${expected}]`);
      expect(KIND_STYLES[kind].tint).toContain(`bg-[${expected}]/15`);
      expect(KIND_STYLES[kind].edge).toBe(`border-l-[${expected}]`);
      expect(KIND_STYLES[kind].underline).toBe(`decoration-[${expected}]`);
    },
  );

  it("only lightens the one color that is hard to read as text", () => {
    expect(Object.keys(LIGHTENED)).toEqual(["File"]);
    expect(seedColor("File")).not.toBe(LIGHTENED.File);
  });

  it("covers all seven item types in order", () => {
    expect(LANDING_KINDS).toEqual([
      "Snippet",
      "Prompt",
      "Command",
      "Note",
      "File",
      "Image",
      "Link",
    ]);
  });
});
