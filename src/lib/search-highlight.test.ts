import { describe, expect, it } from "vitest";
import { highlightSegments } from "@/lib/search-highlight";

describe("highlightSegments", () => {
  it("marks every match case-insensitively and keeps the original casing", () => {
    expect(highlightSegments("React hooks and react", ["react"])).toEqual([
      { text: "React", match: true },
      { text: " hooks and ", match: false },
      { text: "react", match: true },
    ]);
  });

  it("marks matches for several words", () => {
    expect(highlightSegments("use hook", ["hook", "use"])).toEqual([
      { text: "use", match: true },
      { text: " ", match: false },
      { text: "hook", match: true },
    ]);
  });

  it("treats regex characters literally", () => {
    expect(highlightSegments("a.c abc (x)", [".", "(x)"])).toEqual([
      { text: "a", match: false },
      { text: ".", match: true },
      { text: "c abc ", match: false },
      { text: "(x)", match: true },
    ]);
  });

  it("returns the whole text unmarked when nothing matches", () => {
    expect(highlightSegments("hello", ["zzz"])).toEqual([
      { text: "hello", match: false },
    ]);
    expect(highlightSegments("hello", [])).toEqual([
      { text: "hello", match: false },
    ]);
  });

  it("prefers the longer word when words overlap", () => {
    expect(highlightSegments("reactive", ["re", "react"])).toEqual([
      { text: "react", match: true },
      { text: "ive", match: false },
    ]);
  });
});
