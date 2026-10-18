import { describe, expect, it } from "vitest";
import { parsePage } from "@/lib/pagination";

describe("parsePage", () => {
  it("falls back to page 1 for missing or invalid values", () => {
    for (const value of [undefined, "", "abc", "0", "-3", "NaN", "  "]) {
      expect(parsePage(value)).toBe(1);
    }
  });

  it("parses valid page numbers", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("7")).toBe(7);
  });

  it("uses the first value when the parameter is repeated", () => {
    expect(parsePage(["4", "9"])).toBe(4);
    expect(parsePage([])).toBe(1);
  });

  it("truncates decimals and ignores unsafe integers", () => {
    expect(parsePage("2.7")).toBe(2);
    expect(parsePage("99999999999999999999")).toBe(1);
  });
});
