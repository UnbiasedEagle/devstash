"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { itemIdSchema } from "@/lib/item-schemas";
import { prisma } from "@/lib/prisma";
import {
  consumeDownloadQuota,
  DOWNLOAD_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { createDownloadUrl } from "@/lib/storage";
import type { ActionResult } from "@/types/actions";

const FILE_NOT_FOUND = "File not found";
const DOWNLOAD_ERROR = "Could not prepare the download. Try again.";

// A new link for one click: made here and not when the page is built, belongs to the signed-in owner of the item, and works for File and Image items only
export async function getDownloadLink(
  id: unknown,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to download files" };
  }
  const userId = session.user.id;

  if (!(await consumeDownloadQuota(userId))) {
    return { success: false, error: DOWNLOAD_LIMIT_MESSAGE };
  }

  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: FILE_NOT_FOUND };

  try {
    const item = await prisma.item.findFirst({
      where: { id: parsedId.data, userId },
      select: {
        contentType: true,
        fileKey: true,
        fileName: true,
        fileMimeType: true,
        itemType: { select: { name: true } },
      },
    });
    if (
      !item ||
      item.contentType !== "FILE" ||
      !item.fileKey ||
      !item.fileName ||
      !item.fileMimeType
    ) {
      return { success: false, error: FILE_NOT_FOUND };
    }

    const url = await createDownloadUrl({
      key: item.fileKey,
      kind: item.itemType.name === "Image" ? "image" : "file",
      fileName: item.fileName,
      mimeType: item.fileMimeType,
      asAttachment: true,
    });
    return { success: true, data: { url } };
  } catch (error) {
    console.error("getDownloadLink failed", error);
    return { success: false, error: DOWNLOAD_ERROR };
  }
}
