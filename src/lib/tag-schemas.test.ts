import { describe, expect, it } from "vitest";
import { MAX_TAG_LENGTH } from "@/lib/item-schemas";
import { parseTagName } from "@/lib/tag-schemas";

describe("parseTagName", () => {
  it("trims and lowercases like the stored tags", () => {
    expect(parseTagName("  React ")).toBe("react");
  });

  it("decodes a percent-encoded name exactly once", () => {
    expect(parseTagName("machine%20learning")).toBe("machine learning");
    expect(parseTagName("c%2B%2B")).toBe("c++");
    expect(parseTagName("100%2525")).toBe("100%25");
  });

  it("keeps a name that is not valid percent-encoding as is", () => {
    expect(parseTagName("100%")).toBe("100%");
  });

  it.each([undefined, "", "   ", "%20"])("rejects %j", (value) => {
    expect(parseTagName(value)).toBeUndefined();
  });

  it("accepts exactly the maximum length and rejects more", () => {
    expect(parseTagName("a".repeat(MAX_TAG_LENGTH))).toBeDefined();
    expect(parseTagName("a".repeat(MAX_TAG_LENGTH + 1))).toBeUndefined();
  });
});
