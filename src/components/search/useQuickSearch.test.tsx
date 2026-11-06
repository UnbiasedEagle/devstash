// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuickSearchResult } from "@/types/search";

const mocks = vi.hoisted(() => ({ quickSearch: vi.fn() }));
vi.mock("@/actions/search", () => ({ quickSearch: mocks.quickSearch }));

import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_FAILED_MESSAGE,
  useQuickSearch,
} from "@/components/search/useQuickSearch";

function result(id: string): QuickSearchResult {
  return {
    id,
    title: id,
    snippet: null,
    tags: [],
    itemType: { id: "t", name: "Snippet", icon: "Code", color: "#fff" },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useQuickSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.quickSearch.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not search for a blank query", () => {
    const { result: hook } = renderHook(() => useQuickSearch("   "));

    expect(hook.current).toMatchObject({ status: "idle", results: [] });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    expect(mocks.quickSearch).not.toHaveBeenCalled();
  });

  it("waits for typing to pause before searching once", async () => {
    mocks.quickSearch.mockResolvedValue({ success: true, data: [] });
    const { rerender } = renderHook(({ q }) => useQuickSearch(q), {
      initialProps: { q: "r" },
    });

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50));
    rerender({ q: "re" });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50));
    expect(mocks.quickSearch).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(50));
    expect(mocks.quickSearch).toHaveBeenCalledTimes(1);
    expect(mocks.quickSearch).toHaveBeenCalledWith("re");
  });

  it("ignores a slow response that arrives after a newer query", async () => {
    const slow = deferred<{ success: true; data: QuickSearchResult[] }>();
    mocks.quickSearch.mockImplementation((query: string) =>
      query === "re"
        ? slow.promise
        : Promise.resolve({ success: true, data: [result("react-hooks")] }),
    );
    const { result: hook, rerender } = renderHook(
      ({ q }) => useQuickSearch(q),
      {
        initialProps: { q: "re" },
      },
    );

    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));
    rerender({ q: "react" });
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));
    expect(hook.current.results.map(({ id }) => id)).toEqual(["react-hooks"]);

    await act(async () =>
      slow.resolve({ success: true, data: [result("old")] }),
    );
    expect(hook.current.status).toBe("ready");
    expect(hook.current.results.map(({ id }) => id)).toEqual(["react-hooks"]);
  });

  it("keeps the previous results while the next query loads", async () => {
    mocks.quickSearch.mockResolvedValue({
      success: true,
      data: [result("first")],
    });
    const { result: hook, rerender } = renderHook(
      ({ q }) => useQuickSearch(q),
      {
        initialProps: { q: "fi" },
      },
    );
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));

    rerender({ q: "fir" });

    expect(hook.current.status).toBe("loading");
    expect(hook.current.results.map(({ id }) => id)).toEqual(["first"]);
  });

  it("reports an error from the action", async () => {
    mocks.quickSearch.mockResolvedValue({
      success: false,
      error: "Too many searches, try again in a minute",
    });
    const { result: hook } = renderHook(() => useQuickSearch("react"));

    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));

    expect(hook.current).toMatchObject({
      status: "error",
      error: "Too many searches, try again in a minute",
      results: [],
    });
  });

  it("shows an error instead of searching forever when the action throws", async () => {
    mocks.quickSearch.mockRejectedValue(new Error("network down"));
    const { result: hook } = renderHook(() => useQuickSearch("react"));

    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));

    expect(hook.current).toMatchObject({
      status: "error",
      error: SEARCH_FAILED_MESSAGE,
    });
  });

  it("searches again when the same query is retyped after clearing the box", async () => {
    mocks.quickSearch.mockResolvedValue({
      success: false,
      error: "Too many searches, try again in a minute",
    });
    const { result: hook, rerender } = renderHook(
      ({ q }) => useQuickSearch(q),
      { initialProps: { q: "react" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));
    expect(hook.current.status).toBe("error");

    rerender({ q: "" });
    mocks.quickSearch.mockResolvedValue({
      success: true,
      data: [result("react-hooks")],
    });
    rerender({ q: "react" });

    expect(hook.current.status).toBe("loading");
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));
    expect(hook.current.status).toBe("ready");
    expect(hook.current.results.map(({ id }) => id)).toEqual(["react-hooks"]);
  });
});
