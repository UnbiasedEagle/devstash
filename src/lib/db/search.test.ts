import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findMany: mocks.findMany }, $queryRaw: mocks.queryRaw },
}));
vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray) => strings.join("?"),
    join: (values: unknown[]) => values,
  },
}));

import { pickSnippet, quickSearchItems } from "@/lib/db/search";

const type = { id: "t1", name: "Snippet", icon: "Code", color: "#3b82f6" };

describe("pickSnippet", () => {
  it("prefers the description when a word appears in it", () => {
    expect(pickSnippet("Toggle a boolean", "const x", true, ["toggle"])).toBe(
      "Toggle a boolean",
    );
  });

  it("uses the content around the match when only the content matched", () => {
    expect(
      pickSnippet("Unrelated", "…call useToggle()…", true, ["toggle"]),
    ).toBe("…call useToggle()…");
  });

  it("falls back to the description, then the content start, when the match was elsewhere", () => {
    expect(pickSnippet("About it", "body text", false, ["tag"])).toBe(
      "About it",
    );
    expect(pickSnippet(null, "body text", false, ["tag"])).toBe("body text");
    expect(pickSnippet(null, null, false, ["tag"])).toBeNull();
  });

  it("starts the description snippet near a match that is far from the start", () => {
    const description = `${"intro ".repeat(40)}the vercel step comes last`;

    const snippet = pickSnippet(description, null, false, ["vercel"]);

    expect(snippet).toContain("vercel");
    expect(snippet!.length).toBeLessThanOrEqual(120);
  });

  it("collapses whitespace so the snippet fits one line", () => {
    expect(pickSnippet(null, "a\n\n  b\tc", true, ["a"])).toBe("a b c");
  });
});

describe("quickSearchItems", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("does not query for a blank query", async () => {
    expect(await quickSearchItems("user-1", "   ", 8)).toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("scopes to the user, applies the limit and skips the snippet query when nothing matches", async () => {
    mocks.findMany.mockResolvedValue([]);

    expect(await quickSearchItems("user-1", "react", 8)).toEqual([]);

    const args = mocks.findMany.mock.calls[0][0];
    expect(args.where.userId).toBe("user-1");
    expect(args.where.AND).toHaveLength(1);
    expect(args.take).toBe(8);
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });

  it("returns flat tags and the picked snippet for each match", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "item-1",
        title: "useToggle",
        description: "Unrelated",
        itemType: type,
        tags: [{ tag: { name: "react" } }, { tag: { name: "hooks" } }],
      },
    ]);
    mocks.queryRaw.mockResolvedValue([
      { id: "item-1", snippet: "call useToggle() here", matched: true },
    ]);

    expect(await quickSearchItems("user-1", "toggle", 8)).toEqual([
      {
        id: "item-1",
        title: "useToggle",
        snippet: "call useToggle() here",
        tags: ["react", "hooks"],
        itemType: type,
      },
    ]);
  });
});
