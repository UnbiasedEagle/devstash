"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { collectionSchema } from "@/lib/collection-schemas";
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

const CREATE_ERROR = "Could not create the collection. Try again.";
const UPDATE_ERROR = "Could not update the collection. Try again.";
const DELETE_ERROR = "Could not delete the collection. Try again.";
const COLLECTION_NOT_FOUND = "Collection not found";
const collectionIdSchema = z.string().min(1).max(64);

function revalidateListViews() {
  revalidatePath("/dashboard");
  revalidatePath("/collections");
  revalidatePath("/profile");
}

function revalidateCollectionViews() {
  revalidateListViews();
  revalidatePath("/collections/[id]", "page");
}

export async function createCollection(
  input: unknown,
): Promise<ActionResult<CreatedCollection>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to create collections" };
  }
  const userId = session.user.id;

  const parsed = collectionSchema.safeParse(input);
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

    revalidateListViews();
    return { success: true, data: collection };
  } catch (error) {
    if (error instanceof FreeLimitError) {
      return {
        success: false,
        error: `The free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro to add more.`,
      };
    }
    console.error("Failed to create collection", error);
    return { success: false, error: CREATE_ERROR };
  }
}

export async function updateCollection(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to edit collections" };
  }
  const userId = session.user.id;

  const parsedId = collectionIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: COLLECTION_NOT_FOUND };
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }
  const { name, description } = parsed.data;

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const { count } = await prisma.collection.updateMany({
      where: { id: parsedId.data, userId },
      data: { name, description: description || null },
    });
    if (count === 0) return { success: false, error: COLLECTION_NOT_FOUND };

    revalidateCollectionViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    console.error("Failed to update collection", error);
    return { success: false, error: UPDATE_ERROR };
  }
}

export async function setCollectionFavorite(
  id: string,
  value: boolean,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to edit collections" };
  }
  const userId = session.user.id;

  const parsedId = collectionIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: COLLECTION_NOT_FOUND };
  const parsedValue = z.boolean().safeParse(value);
  if (!parsedValue.success) return { success: false, error: UPDATE_ERROR };

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const { count } = await prisma.collection.updateMany({
      where: { id: parsedId.data, userId },
      data: { isFavorite: parsedValue.data },
    });
    if (count === 0) return { success: false, error: COLLECTION_NOT_FOUND };

    revalidateCollectionViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    console.error("Failed to set collection favorite", error);
    return { success: false, error: UPDATE_ERROR };
  }
}

export async function deleteCollection(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to delete collections" };
  }
  const userId = session.user.id;

  const parsedId = collectionIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: COLLECTION_NOT_FOUND };

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    // Items reference the collection with onDelete: SetNull, so they stay and become uncollected
    const { count } = await prisma.collection.deleteMany({
      where: { id: parsedId.data, userId },
    });
    if (count === 0) return { success: false, error: COLLECTION_NOT_FOUND };

    // The deleted collection's own page is not revalidated: it would re-render as not found while the redirect to the list is still in flight
    revalidateListViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    console.error("Failed to delete collection", error);
    return { success: false, error: DELETE_ERROR };
  }
}
