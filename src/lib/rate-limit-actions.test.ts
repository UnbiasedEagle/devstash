import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => {
  const chain = {
    incr: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn(),
  };
  chain.incr.mockReturnValue(chain);
  chain.expire.mockReturnValue(chain);
  return { chain, multi: vi.fn(() => chain) };
});

vi.mock("@/lib/redis", () => ({ redis: { multi: redisMock.multi } }));

import {
  consumeMutationQuota,
  consumeSearchQuota,
  consumeUploadQuota,
} from "@/lib/rate-limit-actions";

describe("consumeUploadQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.chain.incr.mockReturnValue(redisMock.chain);
    redisMock.chain.expire.mockReturnValue(redisMock.chain);
  });

  it("allows up to the 10th upload in the window and blocks the 11th", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([10, 0]);
    expect(await consumeUploadQuota("user-1")).toBe(true);

    redisMock.chain.exec.mockResolvedValueOnce([11, 0]);
    expect(await consumeUploadQuota("user-1")).toBe(false);
  });

  it("counts separately from the other quotas", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([1, 1]);
    await consumeUploadQuota("user-42");

    expect(redisMock.chain.incr).toHaveBeenCalledWith("upload-quota:user-42");
  });
});

describe("consumeSearchQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.chain.incr.mockReturnValue(redisMock.chain);
    redisMock.chain.expire.mockReturnValue(redisMock.chain);
  });

  it("allows up to the 300th search in the window and blocks the 301st", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([300, 0]);
    expect(await consumeSearchQuota("user-1")).toBe(true);

    redisMock.chain.exec.mockResolvedValueOnce([301, 0]);
    expect(await consumeSearchQuota("user-1")).toBe(false);
  });

  it("counts separately from the mutation quota", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([1, 1]);
    await consumeSearchQuota("user-42");

    expect(redisMock.chain.incr).toHaveBeenCalledWith("search-quota:user-42");
  });

  it("fails open when Redis is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    redisMock.chain.exec.mockRejectedValueOnce(new Error("redis down"));

    expect(await consumeSearchQuota("user-1")).toBe(true);
    consoleError.mockRestore();
  });

  it("logs a storage outage at most once a minute", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const clock = vi.spyOn(Date, "now");
    const start = Date.now() + 10 * 60_000;
    redisMock.chain.exec.mockRejectedValue(new Error("redis down"));

    clock.mockReturnValue(start);
    await consumeSearchQuota("user-1");
    await consumeSearchQuota("user-1");
    expect(consoleError).toHaveBeenCalledTimes(1);

    clock.mockReturnValue(start + 61_000);
    await consumeSearchQuota("user-1");
    expect(consoleError).toHaveBeenCalledTimes(2);

    clock.mockRestore();
    consoleError.mockRestore();
    redisMock.chain.exec.mockReset();
  });
});

describe("consumeMutationQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.chain.incr.mockReturnValue(redisMock.chain);
    redisMock.chain.expire.mockReturnValue(redisMock.chain);
  });

  it("allows changes up to and including the 30th in the window", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([1, 1]);
    expect(await consumeMutationQuota("user-1")).toBe(true);

    redisMock.chain.exec.mockResolvedValueOnce([30, 0]);
    expect(await consumeMutationQuota("user-1")).toBe(true);
  });

  it("blocks the 31st change", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([31, 0]);
    expect(await consumeMutationQuota("user-1")).toBe(false);
  });

  it("counts per user with a 60 second window set only once", async () => {
    redisMock.chain.exec.mockResolvedValueOnce([1, 1]);
    await consumeMutationQuota("user-42");

    expect(redisMock.chain.incr).toHaveBeenCalledWith("mutation-quota:user-42");
    expect(redisMock.chain.expire).toHaveBeenCalledWith(
      "mutation-quota:user-42",
      60,
      "NX",
    );
  });

  it("fails open when Redis is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    redisMock.chain.exec.mockRejectedValueOnce(new Error("redis down"));

    expect(await consumeMutationQuota("user-1")).toBe(true);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
