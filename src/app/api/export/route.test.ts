import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getIsPro: vi.fn(),
  consumeExportQuota: vi.fn(),
  exportChunks: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/db/user", () => ({ getIsPro: mocks.getIsPro }));
vi.mock("@/lib/rate-limit-actions", () => ({
  consumeExportQuota: mocks.consumeExportQuota,
  EXPORT_LIMIT_MESSAGE: "Too many exports, try again in a minute",
}));
vi.mock("@/lib/export", () => ({
  exportChunks: mocks.exportChunks,
  exportFileName: () => "devstash-export-2026-11-09.json",
}));

import { GET } from "@/app/api/export/route";

async function* chunksOf(...pieces: string[]) {
  for (const piece of pieces) yield piece;
}

describe("GET /api/export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getIsPro.mockResolvedValue(true);
    mocks.consumeExportQuota.mockResolvedValue(true);
    mocks.exportChunks.mockImplementation(() => chunksOf('{"items":[', "]}"));
  });

  it("answers 401 without a session and reads nothing", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getIsPro).not.toHaveBeenCalled();
    expect(mocks.exportChunks).not.toHaveBeenCalled();
  });

  it("answers 403 for a free user without using the limit or reading data", async () => {
    mocks.getIsPro.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Export is a Pro feature" });
    expect(mocks.consumeExportQuota).not.toHaveBeenCalled();
    expect(mocks.exportChunks).not.toHaveBeenCalled();
  });

  it("checks the Pro flag for the signed-in user in the database", async () => {
    await GET();

    expect(mocks.getIsPro).toHaveBeenCalledWith("user-1");
  });

  it("answers 429 when the limit is used up", async () => {
    mocks.consumeExportQuota.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many exports, try again in a minute",
    });
    expect(mocks.consumeExportQuota).toHaveBeenCalledWith("user-1");
    expect(mocks.exportChunks).not.toHaveBeenCalled();
  });

  it("streams the user's export as a dated attachment that is never cached", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="devstash-export-2026-11-09.json"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.text()).toBe('{"items":[]}');
    expect(mocks.exportChunks.mock.calls[0][0]).toBe("user-1");
  });

  it("sends no-store with the errors too", async () => {
    mocks.getIsPro.mockResolvedValue(false);

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("answers 500 with a friendly message when the first read fails, before any headers are sent", async () => {
    mocks.exportChunks.mockImplementation(async function* () {
      throw new Error("db down");
    });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Disposition")).toBeNull();
    expect(await response.json()).toEqual({
      error: "Could not export your data. Try again.",
    });
  });

  it("ends the download with an error when a later read fails", async () => {
    mocks.exportChunks.mockImplementation(async function* () {
      yield '{"items":[';
      throw new Error("db down");
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.text()).rejects.toThrow("db down");
  });

  it("stops reading when the download is cancelled", async () => {
    const closed = vi.fn();
    mocks.exportChunks.mockImplementation(async function* () {
      try {
        yield "a";
        yield "b";
      } finally {
        closed();
      }
    });

    const response = await GET();
    await response.body?.cancel();

    expect(closed).toHaveBeenCalled();
  });
});
