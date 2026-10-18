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

import { consumeMutationQuota } from "@/lib/rate-limit-actions";

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
