import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getIsPro } from "@/lib/db/user";
import { exportChunks, exportFileName } from "@/lib/export";
import { exportZipChunks } from "@/lib/export-zip";
import {
  consumeExportQuota,
  EXPORT_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";
import type { ExportFormat } from "@/types/export";

// A ZIP reads its files one after another, which can take longer than the platform's default limit for a function
export const maxDuration = 300;

const NO_STORE = { "Cache-Control": "no-store" };
const EXPORT_ERROR = "Could not export your data. Try again.";
const CONTENT_TYPES: Record<ExportFormat, string> = {
  json: "application/json; charset=utf-8",
  zip: "application/zip",
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

function parseFormat(request: Request): ExportFormat | null {
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  return format === "json" || format === "zip" ? format : null;
}

function chunksFor(
  format: ExportFormat,
  userId: string,
  now: Date,
  signal: AbortSignal,
): AsyncGenerator<string | Uint8Array> {
  return format === "zip"
    ? exportZipChunks(userId, now, { signal })
    : exportChunks(userId, now);
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return errorResponse("Sign in to export your data", 401);
  const userId = session.user.id;

  if (!(await getIsPro(userId))) {
    return errorResponse("Export is a Pro feature", 403);
  }
  const format = parseFormat(request);
  if (!format) return errorResponse("Unknown export format", 400);
  // Counted after the checks above so a request that was refused doesn't use up anything
  if (!(await consumeExportQuota(userId))) {
    return errorResponse(EXPORT_LIMIT_MESSAGE, 429);
  }

  const now = new Date();
  const chunks = chunksFor(format, userId, now, request.signal);
  // Headers go out with the first piece, so reading it first is the last point where a failure can still be a proper 500
  let first: IteratorResult<string | Uint8Array>;
  try {
    first = await chunks.next();
  } catch (error) {
    console.error("Export failed", { userId, error });
    return errorResponse(EXPORT_ERROR, 500);
  }

  const encoder = new TextEncoder();
  let next: IteratorResult<string | Uint8Array> | undefined = first;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = next ?? (await chunks.next());
        next = undefined;
        if (result.done) controller.close();
        else {
          const { value } = result;
          controller.enqueue(
            typeof value === "string" ? encoder.encode(value) : value,
          );
        }
      } catch (error) {
        console.error("Export failed while streaming", { userId, error });
        controller.error(error);
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });

  return new Response(body, {
    headers: {
      ...NO_STORE,
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${exportFileName(now, format)}"`,
    },
  });
}
