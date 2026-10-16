import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "demo@devstash.io";

// There is no auth yet, so every query is scoped to the seeded demo user.
export const getCurrentUserId = cache(async () => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user.id;
});
