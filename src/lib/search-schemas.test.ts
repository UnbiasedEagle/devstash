import { describe, expect, it } from "vitest";
import {
  escapeLikePattern,
  MAX_SEARCH_LENGTH,
  MAX_SEARCH_WORDS,
  parseSearchQuery,
  splitSearchWords,
} from "@/lib/search-schemas";

describe("parseSearchQuery", () => {
  it("trims the query and takes the first one when the param is repeated", () => {
    expect(parseSearchQuery("  react hooks  ")).toEqual({
      status: "ok",
      query: "react hooks",
    });
    expect(parseSearchQuery(["first", "second"])).toEqual({
      status: "ok",
      query: "first",
    });
  });

  it.each([undefined, "", "   ", []])("treats %j as no query", (value) => {
    expect(parseSearchQuery(value)).toEqual({ status: "empty" });
  });

  it("accepts exactly the maximum length and rejects more", () => {
    expect(parseSearchQuery("a".repeat(MAX_SEARCH_LENGTH)).status).toBe("ok");
    expect(parseSearchQuery("a".repeat(MAX_SEARCH_LENGTH + 1))).toEqual({
      status: "too-long",
    });
  });
});

describe("escapeLikePattern", () => {
  it("escapes the LIKE wildcards and the escape character", () => {
    expect(escapeLikePattern("100%_done\\")).toBe("100\\%\\_done\\\\");
  });

  it("leaves ordinary text untouched", () => {
    expect(escapeLikePattern("react-hooks.v2")).toBe("react-hooks.v2");
  });
});

describe("splitSearchWords", () => {
  it("splits on any whitespace and drops repeats regardless of case", () => {
    expect(splitSearchWords("react  hooks\tReact\nhooks")).toEqual([
      "react",
      "hooks",
    ]);
  });

  it("keeps only the first words once the cap is reached", () => {
    const words = Array.from(
      { length: MAX_SEARCH_WORDS + 3 },
      (_, i) => `w${i}`,
    );
    expect(splitSearchWords(words.join(" "))).toEqual(
      words.slice(0, MAX_SEARCH_WORDS),
    );
  });
});
