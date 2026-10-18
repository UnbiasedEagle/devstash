import "server-only";
import { redis } from "@/lib/redis";

const EMAIL_QUOTA_MAX = 3;
const EMAIL_QUOTA_WINDOW_SECONDS = 60 * 60;

const EMAIL_KINDS = ["verification", "reset-password", "existing-account"] as const;

type EmailKind = (typeof EMAIL_KINDS)[number];

function quotaKey(kind: EmailKind, userId: string) {
  return `email-quota:${kind}:${userId}`;
}

// Browser cooldowns are bypassable, so every email type is also capped per recipient on the server
export async function consumeEmailQuota(
  kind: EmailKind,
  userId: string,
): Promise<boolean> {
  const key = quotaKey(kind, userId);
  try {
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, EMAIL_QUOTA_WINDOW_SECONDS, "NX")
      .exec<[number, number]>();
    return count <= EMAIL_QUOTA_MAX;
  } catch (error) {
    // Losing the cap is better than losing the email, and the per-IP limits still apply
    console.error("Email quota storage unavailable, allowing email", error);
    return true;
  }
}

export async function clearEmailQuota(userId: string) {
  await redis.del(...EMAIL_KINDS.map((kind) => quotaKey(kind, userId)));
}
