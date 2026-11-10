"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getIsPro } from "@/lib/db/user";
import {
  CUSTOM_ITEM_TYPE,
  createItemSchema,
  isItemLanguage,
  isUploadItemType,
  itemIdSchema,
  updateItemSchema,
  uploadKindFor,
} from "@/lib/item-schemas";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { revalidateItemViews } from "@/lib/revalidate-item-views";
import {
  claimUploadedFile,
  discardStoredFile,
  type StoredFile,
} from "@/lib/uploaded-files";
import { withWriteConflictRetry } from "@/lib/write-conflict-retry";
import type { ActionResult } from "@/types/actions";

interface CreatedItem {
  id: string;
  type: string;
}

class FreeLimitError extends Error {}
class ProRequiredError extends Error {}
class CollectionNotFoundError extends Error {}
class TypeNotFoundError extends Error {}

const GENERIC_ERROR = "Could not create the item. Try again.";
const PRO_REQUIRED =
  "Uploads are part of Pro. Upgrade to upload images and files.";
const ITEM_NOT_FOUND = "Item not found";
const COLLECTION_NOT_FOUND = "Collection not found";
const TYPE_NOT_FOUND = "Type not found";

function freeLimitResult(): ActionResult<never> {
  return {
    success: false,
    error: `The free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro to add more.`,
    code: "free_limit",
  };
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
  const { type, title, description, tags, collectionId } = parsed.data;
  const customTypeId =
    parsed.data.type === CUSTOM_ITEM_TYPE ? parsed.data.customTypeId : null;

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  // Set once the file has been moved into place, so any later failure can take it out again
  let storedFile: StoredFile | undefined;

  try {
    const itemType = await prisma.itemType.findFirst({
      where: customTypeId
        ? { id: customTypeId, userId }
        : { name: type, userId: null },
      select: { id: true, name: true },
    });
    if (!itemType) {
      return {
        success: false,
        error: customTypeId ? TYPE_NOT_FOUND : GENERIC_ERROR,
      };
    }

    const upload = parsed.data;
    if (upload.type === "File" || upload.type === "Image") {
      const kind = uploadKindFor(upload.type);
      // Images and files are both Pro; requestUpload checks this too, but only the save is what counts
      if (!(await getIsPro(userId))) {
        return { success: false, error: PRO_REQUIRED, code: "pro_required" };
      }
      const claim = await claimUploadedFile({
        userId,
        kind,
        fileKey: upload.fileKey,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        fileMimeType: upload.fileMimeType,
      });
      if (!claim.ok) return { success: false, error: claim.error };
      storedFile = claim.file;
    }

    const item = await withWriteConflictRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { isPro: true },
          });
          if (storedFile && !user?.isPro) throw new ProRequiredError();
          const itemCount = await tx.item.count({ where: { userId } });
          if (!user?.isPro && itemCount >= FREE_ITEM_LIMIT) {
            throw new FreeLimitError();
          }
          if (collectionId) {
            const collection = await tx.collection.findFirst({
              where: { id: collectionId, userId },
              select: { id: true },
            });
            if (!collection) throw new CollectionNotFoundError();
          }
          if (customTypeId) {
            const stillThere = await tx.itemType.findFirst({
              where: { id: customTypeId, userId },
              select: { id: true },
            });
            if (!stillThere) throw new TypeNotFoundError();
          }

          return tx.item.create({
            data: {
              title,
              description: description || null,
              contentType: storedFile
                ? "FILE"
                : type === "URL"
                  ? "URL"
                  : "TEXT",
              content: "content" in parsed.data ? parsed.data.content : null,
              url: "url" in parsed.data ? parsed.data.url : null,
              language: "language" in parsed.data ? parsed.data.language : null,
              fileKey: storedFile?.key ?? null,
              fileName: storedFile?.fileName ?? null,
              fileSize: storedFile?.size ?? null,
              fileMimeType: storedFile?.mimeType ?? null,
              userId,
              itemTypeId: itemType.id,
              collectionId: collectionId ?? null,
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
    revalidatePath(`/items/${itemType.name.toLowerCase()}`);
    revalidatePath("/types");
    revalidatePath("/search");
    revalidatePath("/tags");
    revalidatePath("/tags/[name]", "page");
    if (collectionId) {
      revalidatePath("/collections");
      revalidatePath("/collections/[id]", "page");
    }
    return { success: true, data: { id: item.id, type: itemType.name } };
  } catch (error) {
    if (storedFile) await discardStoredFile(storedFile.key);
    if (error instanceof FreeLimitError) return freeLimitResult();
    if (error instanceof ProRequiredError) {
      return { success: false, error: PRO_REQUIRED, code: "pro_required" };
    }
    if (error instanceof TypeNotFoundError) {
      return { success: false, error: TYPE_NOT_FOUND };
    }
    if (
      error instanceof CollectionNotFoundError ||
      (await isCollectionGone(error, userId, collectionId))
    ) {
      return { success: false, error: COLLECTION_NOT_FOUND };
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

// P2003 is also what a vanished tag causes, so it only means the collection was deleted after the ownership check when the collection really is gone
async function isCollectionGone(
  error: unknown,
  userId: string,
  collectionId: string | undefined,
) {
  if (
    !collectionId ||
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2003"
  ) {
    return false;
  }
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  return collection === null;
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
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the form and try again" };
  }
  const { type, title, description, tags, collectionId } = parsed.data;

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const existing = await prisma.item.findFirst({
      where: { id: parsedId.data, userId },
      select: {
        language: true,
        itemType: { select: { id: true, name: true, userId: true } },
        tags: { select: { tagId: true } },
      },
    });
    // The type can't change, so a submitted type that differs from the stored one is treated as a bad id. A custom type is matched by its id and must be the user's own, because built-in type ids are public
    const sameType =
      existing &&
      (parsed.data.type === CUSTOM_ITEM_TYPE
        ? existing.itemType.userId === userId &&
          existing.itemType.id === parsed.data.customTypeId
        : existing.itemType.name === type);
    if (!existing || !sameType) {
      return { success: false, error: ITEM_NOT_FOUND };
    }
    if (collectionId) {
      const collection = await prisma.collection.findFirst({
        where: { id: collectionId, userId },
        select: { id: true },
      });
      if (!collection) return { success: false, error: COLLECTION_NOT_FOUND };
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
            ...(isUploadItemType(type)
              ? {}
              : {
                  content:
                    "content" in parsed.data ? parsed.data.content : null,
                  url: "url" in parsed.data ? parsed.data.url : null,
                  language,
                }),
            // The edit form always sends the collection, so leaving it out means "None" rather than "unchanged"
            collectionId: collectionId ?? null,
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
    if (await isCollectionGone(error, userId, collectionId)) {
      return { success: false, error: COLLECTION_NOT_FOUND };
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
            select: { fileKey: true, tags: { select: { tagId: true } } },
          });
          if (!item) return null;

          await tx.item.delete({ where: { id: parsedId.data, userId } });
          await tx.tag.deleteMany({
            where: {
              userId,
              id: { in: item.tags.map(({ tagId }) => tagId) },
              items: { none: {} },
            },
          });
          return { fileKey: item.fileKey };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
    if (!deleted) return { success: false, error: ITEM_NOT_FOUND };

    // Only once the item is really gone, so a failed delete never leaves an item whose file has vanished. A failure here is logged with the key and leaves nothing but an unused object
    if (deleted.fileKey) await discardStoredFile(deleted.fileKey);

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
