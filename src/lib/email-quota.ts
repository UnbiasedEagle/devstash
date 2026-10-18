import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_QUOTA_MAX = 3;
const EMAIL_QUOTA_WINDOW_MS = 60 * 60 * 1000;

// Browser cooldowns are bypassable, so every email type is also capped per recipient on the server.
// Reuses the rate limit table, which is shared across serverless instances.
export async function consumeEmailQuota(key: string): Promise<boolean> {
  const now = Date.now();
  const row = await prisma.rateLimit.findUnique({ where: { key } });

  if (!row || now - Number(row.lastRequest) >= EMAIL_QUOTA_WINDOW_MS) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { id: randomUUID(), key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return true;
  }

  if (row.count >= EMAIL_QUOTA_MAX) return false;
  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return true;
}
