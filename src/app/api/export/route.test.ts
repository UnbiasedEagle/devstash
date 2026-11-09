import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getIsPro: vi.fn(),
  consumeExportQuota: vi.fn(),
  exportChunks: vi.fn(),
  exportZipChunks: vi.fn(),
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
  exportFileName: (_now: Date, format: string) =>
    `devstash-export-2026-11-09.${format}`,
}));
vi.mock("@/lib/export-zip", () => ({
  exportZipChunks: mocks.exportZipChunks,
}));

import { GET } from "@/app/api/export/route";

async function* chunksOf(...pieces: (string | Uint8Array)[]) {
  for (const piece of pieces) yield piece;
}

function get(query = "") {
  return GET(new Request(`http://localhost/api/export${query}`));
}

describe("GET /api/export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getIsPro.mockResolvedValue(true);
    mocks.consumeExportQuota.mockResolvedValue(true);
    mocks.exportChunks.mockImplementation(() => chunksOf('{"items":[', "]}"));
    mocks.exportZipChunks.mockImplementation(() =>
      chunksOf(new Uint8Array([80, 75]), new Uint8Array([3, 4])),
    );
  });

  it("answers 401 without a session and reads nothing", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await get();

    expect(response.status).toBe(401);
    expect(mocks.getIsPro).not.toHaveBeenCalled();
    expect(mocks.exportChunks).not.toHaveBeenCalled();
  });

  it.each(["", "?format=zip"])(
    "answers 403 for a free user (%j) without using the limit or reading data",
    async (query) => {
      mocks.getIsPro.mockResolvedValue(false);

      const response = await get(query);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Export is a Pro feature",
      });
      expect(mocks.consumeExportQuota).not.toHaveBeenCalled();
      expect(mocks.exportChunks).not.toHaveBeenCalled();
      expect(mocks.exportZipChunks).not.toHaveBeenCalled();
    },
  );

  it("checks the Pro flag for the signed-in user in the database", async () => {
    await get();

    expect(mocks.getIsPro).toHaveBeenCalledWith("user-1");
  });

  it("answers 429 when the limit is used up", async () => {
    mocks.consumeExportQuota.mockResolvedValue(false);

    const response = await get("?format=zip");

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many exports, try again in a minute",
    });
    expect(mocks.consumeExportQuota).toHaveBeenCalledWith("user-1");
    expect(mocks.exportZipChunks).not.toHaveBeenCalled();
  });

  it("streams JSON by default, as a dated attachment that is never cached", async () => {
    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="devstash-export-2026-11-09.json"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.text()).toBe('{"items":[]}');
    expect(mocks.exportChunks.mock.calls[0][0]).toBe("user-1");
    expect(mocks.exportZipChunks).not.toHaveBeenCalled();
  });

  it("asks for JSON when the format says so", async () => {
    await (await get("?format=json")).text();

    expect(mocks.exportChunks).toHaveBeenCalledTimes(1);
  });

  it("streams a ZIP for format=zip, as a dated attachment that is never cached", async () => {
    const response = await get("?format=zip");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="devstash-export-2026-11-09.zip"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
      80, 75, 3, 4,
    ]);
    expect(mocks.exportZipChunks.mock.calls[0][0]).toBe("user-1");
    expect(mocks.exportChunks).not.toHaveBeenCalled();
  });

  it("gives the ZIP the request's abort signal, so a read in progress stops when the browser leaves", async () => {
    const leaving = new AbortController();

    await GET(
      new Request("http://localhost/api/export?format=zip", {
        signal: leaving.signal,
      }),
    );

    const options = mocks.exportZipChunks.mock.calls[0][2];
    expect(options.signal.aborted).toBe(false);
    leaving.abort();
    expect(options.signal.aborted).toBe(true);
  });

  it("answers 400 for an unknown format without using the limit", async () => {
    const response = await get("?format=pdf");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unknown export format" });
    expect(mocks.consumeExportQuota).not.toHaveBeenCalled();
  });

  it("sends no-store with the errors too", async () => {
    mocks.getIsPro.mockResolvedValue(false);

    const response = await get();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each(["json", "zip"])(
    "answers 500 with a friendly message when the first read of a %s export fails, before any headers are sent",
    async (format) => {
      const failing = async function* () {
        throw new Error("db down");
      };
      mocks.exportChunks.mockImplementation(failing);
      mocks.exportZipChunks.mockImplementation(failing);

      const response = await get(`?format=${format}`);

      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Disposition")).toBeNull();
      expect(await response.json()).toEqual({
        error: "Could not export your data. Try again.",
      });
    },
  );

  it("ends the download with an error when a later read fails", async () => {
    mocks.exportChunks.mockImplementation(async function* () {
      yield '{"items":[';
      throw new Error("db down");
    });

    const response = await get();

    expect(response.status).toBe(200);
    await expect(response.text()).rejects.toThrow("db down");
  });

  it("stops reading when the download is cancelled", async () => {
    const closed = vi.fn();
    mocks.exportZipChunks.mockImplementation(async function* () {
      try {
        yield new Uint8Array([1]);
        yield new Uint8Array([2]);
      } finally {
        closed();
      }
    });

    const response = await get("?format=zip");
    await response.body?.cancel();

    expect(closed).toHaveBeenCalled();
  });
});
