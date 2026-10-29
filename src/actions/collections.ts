"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { createCollectionSchema } from "@/lib/collection-schemas";
import { FREE_COLLECTION_LIMIT } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { withWriteConflictRetry } from "@/lib/write-conflict-retry";
import type { ActionResult } from "@/types/actions";

interface CreatedCollection {
  id: string;
  name: string;
}

class FreeLimitError extends Error {}

const GENERIC_ERROR = "Could not create the collection. Try again.";

export async function createCollection(
  input: unknown,
): Promise<ActionResult<CreatedCollection>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to create collections" };
  }
  const userId = session.user.id;

  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }
  const { name, description } = parsed.data;

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const collection = await withWriteConflictRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { isPro: true },
          });
          const collectionCount = await tx.collection.count({
            where: { userId },
          });
          if (!user?.isPro && collectionCount >= FREE_COLLECTION_LIMIT) {
            throw new FreeLimitError();
          }

          return tx.collection.create({
            data: { name, description: description || null, userId },
            select: { id: true, name: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );

    revalidatePath("/dashboard");
    revalidatePath("/collections");
    revalidatePath("/profile");
    return { success: true, data: collection };
  } catch (error) {
    if (error instanceof FreeLimitError) {
      return {
        success: false,
        error: `The free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro to add more.`,
      };
    }
    console.error("Failed to create collection", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
