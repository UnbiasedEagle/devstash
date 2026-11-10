"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import {
  checkImportFile,
  MAX_IMPORT_FILE_NAME_LENGTH,
  MAX_IMPORT_FILES,
  MAX_IMPORT_RAW_LENGTH,
} from "@/lib/import-rules";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import {
  consumeMutationQuota,
  MUTATION_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import { revalidateItemViews } from "@/lib/revalidate-item-views";
import { withWriteConflictRetry } from "@/lib/write-conflict-retry";
import type { ActionResult } from "@/types/actions";

const importSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z
          .string()
          .min(1)
          .max(MAX_IMPORT_FILE_NAME_LENGTH + 1),
        content: z.string().max(MAX_IMPORT_RAW_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_IMPORT_FILES),
});

class FreeLimitError extends Error {
  constructor(readonly remaining: number) {
    super("free limit");
  }
}

const GENERIC_ERROR = "Could not import the files. Try again.";

function freeLimitResult(remaining: number): ActionResult<never> {
  const room =
    remaining === 0
      ? "You have no room left"
      : `You can add ${remaining} more ${remaining === 1 ? "item" : "items"}`;
  return {
    success: false,
    error: `${room} on the free plan. Upgrade to Pro to add more.`,
    code: "free_limit",
  };
}

export async function importItems(
  input: unknown,
): Promise<ActionResult<{ imported: number }>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Sign in again to import files" };
  }
  const userId = session.user.id;

  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Check the files and try again" };
  }

  const checked = [];
  for (const file of parsed.data.files) {
    const result = checkImportFile(file);
    if (!result.ok) {
      return { success: false, error: `${file.fileName}: ${result.error}` };
    }
    checked.push(result);
  }

  if (!(await consumeMutationQuota(userId))) {
    return { success: false, error: MUTATION_LIMIT_MESSAGE };
  }

  try {
    const types = await prisma.itemType.findMany({
      where: { userId: null, name: { in: ["Note", "Snippet"] } },
      select: { id: true, name: true },
    });
    const typeIds = new Map(types.map((type) => [type.name, type.id]));
    const noteId = typeIds.get("Note");
    const snippetId = typeIds.get("Snippet");
    if (!noteId || !snippetId) {
      console.error(
        "Failed to import files: the Note and Snippet types are missing",
      );
      return { success: false, error: GENERIC_ERROR };
    }

    const data = checked.map(({ target, title, content }) => ({
      title,
      content,
      contentType: "TEXT" as const,
      language: target.type === "Snippet" ? target.language : null,
      userId,
      itemTypeId: target.type === "Snippet" ? snippetId : noteId,
    }));

    await withWriteConflictRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { isPro: true },
          });
          if (!user?.isPro) {
            const itemCount = await tx.item.count({ where: { userId } });
            if (itemCount + data.length > FREE_ITEM_LIMIT) {
              throw new FreeLimitError(
                Math.max(0, FREE_ITEM_LIMIT - itemCount),
              );
            }
          }
          await tx.item.createMany({ data });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );

    revalidateItemViews();
    return { success: true, data: { imported: data.length } };
  } catch (error) {
    if (error instanceof FreeLimitError) {
      return freeLimitResult(error.remaining);
    }
    console.error("Failed to import files", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
