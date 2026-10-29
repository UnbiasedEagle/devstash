"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { createItemSchema, isItemLanguage } from "@/lib/item-schemas";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { withWriteConflictRetry } from "@/lib/write-conflict-retry";
import type { ActionResult } from "@/types/actions";

interface CreatedItem {
  id: string;
  type: string;
}

class FreeLimitError extends Error {}

const GENERIC_ERROR = "Could not create the item. Try again.";
const ITEM_NOT_FOUND = "Item not found";
const itemIdSchema = z.string().min(1).max(64);

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

// P2025: the item was deleted between the ownership lookup and the write
function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function revalidateItemViews() {
  revalidatePath("/dashboard");
  revalidatePath("/items/[type]", "page");
  revalidatePath("/collections");
  revalidatePath("/collections/[id]", "page");
  revalidatePath("/profile");
}

export async function updateItem(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to edit items" };
  }
  const userId = session.user.id;

  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: ITEM_NOT_FOUND };
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }
  const { type, title, description, tags } = parsed.data;

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const existing = await prisma.item.findFirst({
      where: { id: parsedId.data, userId },
      select: {
        language: true,
        itemType: { select: { name: true } },
        tags: { select: { tagId: true } },
      },
    });
    // The type can't change, so a submitted type that differs from the stored one is treated as a bad id
    if (!existing || existing.itemType.name !== type) {
      return { success: false, error: ITEM_NOT_FOUND };
    }
    const submittedLanguage =
      "language" in parsed.data ? parsed.data.language : undefined;
    // The form can only offer the listed languages, so an unlisted one (e.g. from an import) is kept instead of wiped by an unrelated edit
    const storedLanguage = existing.language;
    const language =
      submittedLanguage === undefined &&
      storedLanguage &&
      !isItemLanguage(storedLanguage)
        ? storedLanguage
        : (submittedLanguage ?? null);

    // Tags the edit drops are removed once no item uses them, so the tag list stays clean
    const previousTagIds = existing.tags.map(({ tagId }) => tagId);

    await withWriteConflictRetry(() =>
      prisma.$transaction([
        prisma.item.update({
          where: { id: parsedId.data, userId },
          data: {
            title,
            description: description || null,
            content: "content" in parsed.data ? parsed.data.content : null,
            url: "url" in parsed.data ? parsed.data.url : null,
            language,
            tags: {
              deleteMany: {},
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
        }),
        prisma.tag.deleteMany({
          where: { userId, id: { in: previousTagIds }, items: { none: {} } },
        }),
      ]),
    );

    revalidateItemViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    if (isRecordNotFound(error)) {
      return { success: false, error: ITEM_NOT_FOUND };
    }
    console.error("Failed to update item", error);
    return { success: false, error: "Could not update the item. Try again." };
  }
}

async function setItemFlag(
  id: string,
  flag: "isFavorite" | "isPinned",
  value: boolean,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to edit items" };
  }
  const userId = session.user.id;

  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success || typeof value !== "boolean") {
    return { success: false, error: ITEM_NOT_FOUND };
  }

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const { count } = await prisma.item.updateMany({
      where: { id: parsedId.data, userId },
      data: { [flag]: value },
    });
    if (count === 0) return { success: false, error: ITEM_NOT_FOUND };

    revalidateItemViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    console.error(`Failed to set ${flag}`, error);
    return { success: false, error: "Could not update the item. Try again." };
  }
}

export async function deleteItem(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to delete items" };
  }
  const userId = session.user.id;

  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: ITEM_NOT_FOUND };

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const deleted = await withWriteConflictRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const item = await tx.item.findFirst({
            where: { id: parsedId.data, userId },
            select: { tags: { select: { tagId: true } } },
          });
          if (!item) return false;

          await tx.item.delete({ where: { id: parsedId.data, userId } });
          await tx.tag.deleteMany({
            where: {
              userId,
              id: { in: item.tags.map(({ tagId }) => tagId) },
              items: { none: {} },
            },
          });
          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
    if (!deleted) return { success: false, error: ITEM_NOT_FOUND };

    revalidateItemViews();
    return { success: true, data: { id: parsedId.data } };
  } catch (error) {
    if (isRecordNotFound(error)) {
      return { success: false, error: ITEM_NOT_FOUND };
    }
    console.error("Failed to delete item", error);
    return { success: false, error: "Could not delete the item. Try again." };
  }
}

export async function setItemFavorite(id: string, value: boolean) {
  return setItemFlag(id, "isFavorite", value);
}

export async function setItemPinned(id: string, value: boolean) {
  return setItemFlag(id, "isPinned", value);
}
