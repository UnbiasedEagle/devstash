import { describe, expect, it } from "vitest";
import { resolveItemHref, searchResultsHref } from "@/lib/search-navigation";

const snippet = { id: "item-1", typeName: "Snippet" };

describe("resolveItemHref", () => {
  it.each(["/dashboard", "/search", "/collections/col-1", "/items/snippet"])(
    "opens the drawer on %s",
    (pathname) => {
      expect(resolveItemHref(pathname, new URLSearchParams(), snippet)).toBe(
        `${pathname}?item=item-1`,
      );
    },
  );

  it("keeps the current query and page and replaces an open item", () => {
    const params = new URLSearchParams("q=react&page=2&item=old");

    expect(resolveItemHref("/search", params, snippet)).toBe(
      "/search?q=react&page=2&item=item-1",
    );
  });

  it("goes to the dashboard from a type page of another type", () => {
    expect(
      resolveItemHref("/items/note", new URLSearchParams("page=2"), snippet),
    ).toBe("/dashboard?item=item-1");
  });

  it.each(["/profile", "/collections"])(
    "goes to the dashboard from %s, which has no drawer",
    (pathname) => {
      expect(resolveItemHref(pathname, new URLSearchParams(), snippet)).toBe(
        "/dashboard?item=item-1",
      );
    },
  );
});

describe("searchResultsHref", () => {
  it("encodes the query", () => {
    expect(searchResultsHref("100% done & more")).toBe(
      "/search?q=100%25+done+%26+more",
    );
  });
});
