import "server-only";
import { redis } from "@/lib/redis";

const MUTATION_LIMIT = 30;
const MUTATION_WINDOW_SECONDS = 60;
const SEARCH_LIMIT = 300;
const SEARCH_WINDOW_SECONDS = 60;
const UPLOAD_LIMIT = 10;
const UPLOAD_WINDOW_SECONDS = 60;
const DOWNLOAD_LIMIT = 60;
const DOWNLOAD_WINDOW_SECONDS = 60;

export const MUTATION_LIMIT_MESSAGE = "Too many changes, try again in a minute";
export const UPLOAD_LIMIT_MESSAGE = "Too many uploads, try again in a minute";
export const DOWNLOAD_LIMIT_MESSAGE =
  "Too many downloads, try again in a minute";
export const SEARCH_LIMIT_MESSAGE = "Too many searches, try again in a minute";

const OUTAGE_LOG_INTERVAL_MS = 60_000;
const lastOutageLogAt = new Map<string, number>();

// Search checks the quota on every keystroke, so an outage would otherwise flood the logs
function logStorageOutage(prefix: string, error: unknown) {
  const now = Date.now();
  const last = lastOutageLogAt.get(prefix);
  if (last !== undefined && now - last < OUTAGE_LOG_INTERVAL_MS) return;
  lastOutageLogAt.set(prefix, now);
  console.error(`${prefix} storage unavailable, allowing request`, error);
}

async function consumeQuota(
  prefix: string,
  userId: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `${prefix}:${userId}`;
  try {
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, windowSeconds, "NX")
      .exec<[number, number]>();
    return count <= limit;
  } catch (error) {
    // The plan limit and data scoping live in the database, so a Redis outage must not block the user
    logStorageOutage(prefix, error);
    return true;
  }
}

// Shared by every item create, update and delete so one user can't write in a tight loop
export function consumeMutationQuota(userId: string): Promise<boolean> {
  return consumeQuota(
    "mutation-quota",
    userId,
    MUTATION_LIMIT,
    MUTATION_WINDOW_SECONDS,
  );
}

// Each click makes a link to a file that can be 10 MB, so downloads are counted apart from searching and changing things
export function consumeDownloadQuota(userId: string): Promise<boolean> {
  return consumeQuota(
    "download-quota",
    userId,
    DOWNLOAD_LIMIT,
    DOWNLOAD_WINDOW_SECONDS,
  );
}

// Much tighter than the mutation quota: every upload link lets someone store up to 10 MB that stays until it is claimed or expires
export function consumeUploadQuota(userId: string): Promise<boolean> {
  return consumeQuota(
    "upload-quota",
    userId,
    UPLOAD_LIMIT,
    UPLOAD_WINDOW_SECONDS,
  );
}

// Separate from the mutation quota: typing in the search popup sends many reads in a row
export function consumeSearchQuota(userId: string): Promise<boolean> {
  return consumeQuota(
    "search-quota",
    userId,
    SEARCH_LIMIT,
    SEARCH_WINDOW_SECONDS,
  );
}
