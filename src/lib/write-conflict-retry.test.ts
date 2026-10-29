import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }
  return { PrismaClientKnownRequestError };
});

vi.mock("@/generated/prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: mocks.PrismaClientKnownRequestError,
  },
}));

import { withWriteConflictRetry } from "@/lib/write-conflict-retry";

function prismaError(code: string) {
  return new mocks.PrismaClientKnownRequestError("conflict", { code });
}

describe("withWriteConflictRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it.each(["P2034", "P2002", "P2003"])(
    "retries after a %s conflict and returns the next result",
    async (code) => {
      const run = vi
        .fn()
        .mockRejectedValueOnce(prismaError(code))
        .mockResolvedValue("done");

      const result = withWriteConflictRetry(run);
      await vi.runAllTimersAsync();

      await expect(result).resolves.toBe("done");
      expect(run).toHaveBeenCalledTimes(2);
    },
  );

  it("does not retry other database errors", async () => {
    const run = vi.fn().mockRejectedValue(prismaError("P2025"));

    await expect(withWriteConflictRetry(run)).rejects.toMatchObject({
      code: "P2025",
    });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not retry errors that are not database errors", async () => {
    const run = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(withWriteConflictRetry(run)).rejects.toThrow("boom");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("gives up and throws after 3 attempts", async () => {
    const run = vi.fn().mockRejectedValue(prismaError("P2034"));

    const result = withWriteConflictRetry(run);
    const assertion = expect(result).rejects.toMatchObject({ code: "P2034" });
    await vi.runAllTimersAsync();

    await assertion;
    expect(run).toHaveBeenCalledTimes(3);
  });
});
