"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { createItemSchema } from "@/lib/item-schemas";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import type { ActionResult } from "@/types/actions";

interface CreatedItem {
  id: string;
  type: string;
}

class FreeLimitError extends Error {}

const GENERIC_ERROR = "Could not create the item. Try again.";
const MAX_TRANSACTION_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 50;
// P2034 is a Serializable write conflict, P2002 is two creates racing to insert the same new tag
const RETRYABLE_CODES = ["P2034", "P2002"];

// Concurrent writers abort or collide on one another, so these are retried instead of reported
async function withWriteConflictRetry<T>(run: () => Promise<T>): Promise<T> {
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

export async function createItem(
  input: unknown,
): Promise<ActionResult<CreatedItem>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to create items" };
  }
  const userId = session.user.id;

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }
  const { type, title, description, tags } = parsed.data;

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const itemType = await prisma.itemType.findFirst({
      where: { name: type, userId: null },
      select: { id: true },
    });
    if (!itemType) return { success: false, error: GENERIC_ERROR };

    const item = await withWriteConflictRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { isPro: true },
          });
          const itemCount = await tx.item.count({ where: { userId } });
          if (!user?.isPro && itemCount >= FREE_ITEM_LIMIT) {
            throw new FreeLimitError();
          }

          return tx.item.create({
            data: {
              title,
              description: description || null,
              contentType: type === "URL" ? "URL" : "TEXT",
              content: "content" in parsed.data ? parsed.data.content : null,
              url: "url" in parsed.data ? parsed.data.url : null,
              language: "language" in parsed.data ? parsed.data.language : null,
              userId,
              itemTypeId: itemType.id,
              tags: {
                create: tags.map((name) => ({
                  tag: {
                    connectOrCreate: {
                      where: { userId_name: { userId, name } },
                      create: { name, userId },
                    },
                  },
                })),
              },
            },
            select: { id: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );

    revalidatePath("/dashboard");
    revalidatePath(`/items/${type.toLowerCase()}`);
    return { success: true, data: { id: item.id, type } };
  } catch (error) {
    if (error instanceof FreeLimitError) {
      return {
        success: false,
        error: `The free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro to add more.`,
      };
    }
    console.error("Failed to create item", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
