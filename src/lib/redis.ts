import "server-only";
import { Redis } from "@upstash/redis";
import { redisEnv } from "@/lib/env";

const REDIS_TIMEOUT_MS = 1500;

export const redis = new Redis({
  url: redisEnv.UPSTASH_REDIS_REST_URL,
  token: redisEnv.UPSTASH_REDIS_REST_TOKEN,
  // The default retries with backoff, which would stall every auth request for seconds during an outage
  retry: { retries: 1, backoff: () => 100 },
  signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
});
