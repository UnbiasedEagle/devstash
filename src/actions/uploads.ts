"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  consumeUploadQuota,
  UPLOAD_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { createUploadUrl } from "@/lib/storage";
import {
  pendingKey,
  uploadRequestSchema,
  validateUpload,
} from "@/lib/upload-rules";
import type { ActionResult } from "@/types/actions";

interface UploadTarget {
  uploadUrl: string;
  key: string;
  // The browser must send exactly this `Content-Type`, because the link signs it
  contentType: string;
}

const UPLOAD_ERROR = "Could not start the upload. Try again.";
const PRO_REQUIRED = "File uploads are part of Pro. Upgrade to upload files.";

export async function requestUpload(
  input: unknown,
): Promise<ActionResult<UploadTarget>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to upload files" };
  }
  const userId = session.user.id;

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the file and try again" };
  }
  const request = parsed.data;

  const validation = validateUpload(request);
  if (!validation.ok) return { success: false, error: validation.error };

  if (!(await consumeUploadQuota(userId))) {
    return { success: false, error: UPLOAD_LIMIT_MESSAGE };
  }

  try {
    // Images are free; every other file is part of Pro, which is checked here and again when the item is saved
    if (request.kind === "file") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      });
      if (!user?.isPro) {
        return { success: false, error: PRO_REQUIRED, code: "pro_required" };
      }
    }

    const key = pendingKey(userId, randomUUID());
    const contentType = validation.mimeType;
    const uploadUrl = await createUploadUrl({
      key,
      contentType,
      size: request.size,
    });
    return { success: true, data: { uploadUrl, key, contentType } };
  } catch (error) {
    console.error("requestUpload failed", error);
    return { success: false, error: UPLOAD_ERROR };
  }
}
