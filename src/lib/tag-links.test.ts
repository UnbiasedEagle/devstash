import { describe, expect, it } from "vitest";
import { tagHref } from "@/lib/tag-links";
import { parseTagName } from "@/lib/tag-schemas";

describe("tagHref", () => {
  it("encodes spaces and reserved characters", () => {
    expect(tagHref("react")).toBe("/tags/react");
    expect(tagHref("machine learning")).toBe("/tags/machine%20learning");
    expect(tagHref("c++/c#")).toBe("/tags/c%2B%2B%2Fc%23");
  });

  // The route param reaches the page still encoded, so the link and the parser must agree
  it.each(["react", "machine learning", "c++/c#", "100%", "100%25", "café"])(
    "round-trips %s through the route parser",
    (name) => {
      const segment = tagHref(name).slice("/tags/".length);
      expect(parseTagName(segment)).toBe(name);
    },
  );
});
