import "server-only";
import { redis } from "@/lib/redis";

const MUTATION_LIMIT = 30;
const MUTATION_WINDOW_SECONDS = 60;

export const MUTATION_LIMIT_MESSAGE = "Too many changes, try again in a minute";

// Shared by every item create, update and delete so one user can't write in a tight loop
export async function consumeMutationQuota(userId: string): Promise<boolean> {
  const key = `mutation-quota:${userId}`;
  try {
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, MUTATION_WINDOW_SECONDS, "NX")
      .exec<[number, number]>();
    return count <= MUTATION_LIMIT;
  } catch (error) {
    // The plan limit is enforced in the database transaction, so a Redis outage must not block saving
    console.error("Mutation quota storage unavailable, allowing change", error);
    return true;
  }
}
