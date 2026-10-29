import { Prisma } from "@/generated/prisma/client";

const MAX_TRANSACTION_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 50;
// P2034 is a Serializable write conflict. P2002 and P2003 come from item tags: two creates racing to insert the same new tag, and a tag deleted as unused between an edit finding it and linking it
const RETRYABLE_CODES = ["P2034", "P2002", "P2003"];

// Concurrent writers abort or collide on one another, so these are retried instead of reported
export async function withWriteConflictRetry<T>(
  run: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const isConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        RETRYABLE_CODES.includes(error.code);
      if (!isConflict || attempt === MAX_TRANSACTION_ATTEMPTS) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_BACKOFF_MS * attempt),
      );
    }
  }
}
