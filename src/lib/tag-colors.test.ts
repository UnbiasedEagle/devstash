import { describe, expect, it } from "vitest";
import { getTagColor } from "@/lib/tag-colors";

describe("getTagColor", () => {
  it("returns the technology color for known tags, ignoring case", () => {
    expect(getTagColor("react")).toBe("#61dafb");
    expect(getTagColor("React")).toBe("#61dafb");
    expect(getTagColor("TYPESCRIPT")).toBe(getTagColor("typescript"));
  });

  it("returns a stable color for an unknown tag", () => {
    const first = getTagColor("my-private-tag");
    expect(getTagColor("my-private-tag")).toBe(first);
    expect(getTagColor("My-Private-Tag")).toBe(first);
    expect(first).toMatch(/^oklch\(0\.78 0\.12 \d+\)$/);
  });

  it("keeps the generated hue inside the color wheel", () => {
    for (const tag of ["a", "zzzzzzzz", "tag with spaces", "日本語"]) {
      const hue = Number(/ (\d+)\)$/.exec(getTagColor(tag))?.[1]);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});
