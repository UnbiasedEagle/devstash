import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  consumeSearchQuota: vi.fn(),
  quickSearchItems: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/db/search", () => ({
  quickSearchItems: mocks.quickSearchItems,
}));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeSearchQuota: mocks.consumeSearchQuota,
  SEARCH_LIMIT_MESSAGE: "Too many searches, try again in a minute",
}));

import { quickSearch } from "@/actions/search";
import { QUICK_SEARCH_LIMIT } from "@/lib/search-schemas";

describe("quickSearch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.consumeSearchQuota.mockResolvedValue(true);
    mocks.quickSearchItems.mockResolvedValue([]);
  });

  it("rejects a signed-out call without searching", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await quickSearch("react");

    expect(result.success).toBe(false);
    expect(mocks.quickSearchItems).not.toHaveBeenCalled();
  });

  it("searches as the session user with the trimmed query and the result limit", async () => {
    await quickSearch("  react hooks ");

    expect(mocks.quickSearchItems).toHaveBeenCalledWith(
      "user-1",
      "react hooks",
      QUICK_SEARCH_LIMIT,
    );
    expect(QUICK_SEARCH_LIMIT).toBe(8);
  });

  it("returns no results for a blank or non-string query without touching the quota or database", async () => {
    for (const input of ["  ", undefined, 42, { q: "x" }]) {
      expect(await quickSearch(input)).toEqual({ success: true, data: [] });
    }
    expect(mocks.consumeSearchQuota).not.toHaveBeenCalled();
    expect(mocks.quickSearchItems).not.toHaveBeenCalled();
  });

  it("rejects a query over the length limit", async () => {
    const result = await quickSearch("a".repeat(101));

    expect(result.success).toBe(false);
    expect(mocks.quickSearchItems).not.toHaveBeenCalled();
  });

  it("stops when the search quota is used up", async () => {
    mocks.consumeSearchQuota.mockResolvedValue(false);

    expect(await quickSearch("react")).toEqual({
      success: false,
      error: "Too many searches, try again in a minute",
    });
    expect(mocks.consumeSearchQuota).toHaveBeenCalledWith("user-1");
    expect(mocks.quickSearchItems).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the query fails", async () => {
    mocks.quickSearchItems.mockRejectedValue(new Error("db down"));

    expect(await quickSearch("react")).toEqual({
      success: false,
      error: "Could not search. Try again.",
    });
  });
});
