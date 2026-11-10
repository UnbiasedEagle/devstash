"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { MAX_CUSTOM_TYPES } from "@/lib/custom-type-options";
import { itemTypeIdSchema, itemTypeSchema } from "@/lib/item-type-schemas";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { withWriteConflictRetry } from "@/lib/write-conflict-retry";
import type { ActionResult } from "@/types/actions";

class ProRequiredError extends Error {}
class TypeLimitError extends Error {}
class DuplicateNameError extends Error {}
class TypeNotFoundError extends Error {}
class TypeInUseError extends Error {
  constructor(readonly itemCount: number) {
    super();
  }
}

const PRO_REQUIRED = "Custom types are part of Pro. Upgrade to add your own.";
const TYPE_NOT_FOUND = "Type not found";
const DUPLICATE_NAME = "You already have a type with that name";
const CREATE_ERROR = "Could not create the type. Try again.";
const UPDATE_ERROR = "Could not update the type. Try again.";
const DELETE_ERROR = "Could not delete the type. Try again.";

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

function revalidateTypeViews() {
  // The sidebar lists types and lives in the workspace layout, so every page behind sign-in shows a changed name, icon or color
  revalidatePath("/", "layout");
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function requirePro(tx: Prisma.TransactionClient, userId: string) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  if (!user?.isPro) throw new ProRequiredError();
}

async function assertNameFree(
  tx: Prisma.TransactionClient,
  userId: string,
  name: string,
  ignoreId?: string,
) {
  const taken = await tx.itemType.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  });
  if (taken) throw new DuplicateNameError();
}

function failure(error: unknown, fallback: string, log: string) {
  if (error instanceof ProRequiredError) {
    return {
      success: false,
      error: PRO_REQUIRED,
      code: "pro_required",
    } as const;
  }
  if (error instanceof TypeLimitError) {
    return {
      success: false,
      error: `You can have up to ${MAX_CUSTOM_TYPES} custom types. Delete one to add another.`,
    } as const;
  }
  if (error instanceof DuplicateNameError || isUniqueViolation(error)) {
    return { success: false, error: DUPLICATE_NAME } as const;
  }
  if (error instanceof TypeNotFoundError) {
    return { success: false, error: TYPE_NOT_FOUND } as const;
  }
  if (error instanceof TypeInUseError) {
    const noun = error.itemCount === 1 ? "item" : "items";
    return {
      success: false,
      error: `Move or delete its ${error.itemCount} ${noun} first`,
    } as const;
  }
  console.error(log, error);
  return { success: false, error: fallback } as const;
}

export async function createItemType(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to create types" };
  }
  const userId = session.user.id;

  const parsed = itemTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const itemType = await withWriteConflictRetry(() =>
      prisma.$transaction(async (tx) => {
        await requirePro(tx, userId);
        const typeCount = await tx.itemType.count({ where: { userId } });
        if (typeCount >= MAX_CUSTOM_TYPES) throw new TypeLimitError();
        await assertNameFree(tx, userId, parsed.data.name);

        return tx.itemType.create({
          data: { ...parsed.data, userId },
          select: { id: true, name: true },
        });
      }, SERIALIZABLE),
    );

    revalidateTypeViews();
    return { success: true, data: itemType };
  } catch (error) {
    return failure(error, CREATE_ERROR, "Failed to create item type");
  }
}

export async function updateItemType(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to edit types" };
  }
  const userId = session.user.id;

  const parsedId = itemTypeIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: TYPE_NOT_FOUND };
  const parsed = itemTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    await withWriteConflictRetry(() =>
      prisma.$transaction(async (tx) => {
        await requirePro(tx, userId);
        await assertNameFree(tx, userId, parsed.data.name, parsedId.data);

        const { count } = await tx.itemType.updateMany({
          where: { id: parsedId.data, userId },
          data: parsed.data,
        });
        if (count === 0) throw new TypeNotFoundError();
      }, SERIALIZABLE),
    );

    revalidateTypeViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    return failure(error, UPDATE_ERROR, "Failed to update item type");
  }
}

// Not gated on Pro: a former Pro user can still remove the types they made
export async function deleteItemType(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to delete types" };
  }
  const userId = session.user.id;

  const parsedId = itemTypeIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: TYPE_NOT_FOUND };

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    await withWriteConflictRetry(() =>
      prisma.$transaction(async (tx) => {
        const owned = await tx.itemType.findFirst({
          where: { id: parsedId.data, userId },
          select: { id: true },
        });
        if (!owned) throw new TypeNotFoundError();

        const itemCount = await tx.item.count({
          where: { itemTypeId: owned.id },
        });
        if (itemCount > 0) throw new TypeInUseError(itemCount);

        await tx.itemType.delete({ where: { id: owned.id } });
      }, SERIALIZABLE),
    );

    revalidateTypeViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    return failure(error, DELETE_ERROR, "Failed to delete item type");
  }
}
