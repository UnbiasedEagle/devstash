import "server-only";
import { redis } from "@/lib/redis";

interface RateLimitRule {
  window: number;
  max: number;
}

// Better Auth keys look like `ip|path`. These endpoints are destructive or accept password guesses, so a Redis outage blocks them instead of leaving them unlimited
const FAIL_CLOSED_PATHS = ["/delete-user"];

// One atomic MULTI/EXEC: NX sets the expiry only on the first hit, so the window can't slide or be left without an expiry
export const redisRateLimitStorage = {
  async consume(key: string, rule: RateLimitRule) {
    const redisKey = `rate-limit:${key}`;
    try {
      const [count] = await redis
        .multi()
        .incr(redisKey)
        .expire(redisKey, rule.window, "NX")
        .exec<[number, number]>();
      if (count <= rule.max) return { allowed: true, retryAfter: null };

      const ttl = await redis.ttl(redisKey);
      return { allowed: false, retryAfter: ttl > 0 ? ttl : rule.window };
    } catch (error) {
      console.error("Rate limit storage unavailable", error);
      // A Redis outage must not lock everyone out of signing in, except on the paths above
      const failClosed = FAIL_CLOSED_PATHS.some((path) =>
        key.endsWith(`|${path}`),
      );
      return failClosed
        ? { allowed: false, retryAfter: rule.window }
        : { allowed: true, retryAfter: null };
    }
  },
};
