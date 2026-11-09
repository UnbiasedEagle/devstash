import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getIsPro } from "@/lib/db/user";
import { exportChunks, exportFileName } from "@/lib/export";
import {
  consumeExportQuota,
  EXPORT_LIMIT_MESSAGE,
} from "@/lib/rate-limit-actions";

const NO_STORE = { "Cache-Control": "no-store" };
const EXPORT_ERROR = "Could not export your data. Try again.";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return errorResponse("Sign in to export your data", 401);
  const userId = session.user.id;

  if (!(await getIsPro(userId))) {
    return errorResponse("Export is a Pro feature", 403);
  }
  // Counted after the Pro check so a free user's requests don't use up anything
  if (!(await consumeExportQuota(userId))) {
    return errorResponse(EXPORT_LIMIT_MESSAGE, 429);
  }

  const now = new Date();
  const chunks = exportChunks(userId, now);
  // Headers go out with the first piece, so reading it first is the last point where a failure can still be a proper 500
  let first: IteratorResult<string>;
  try {
    first = await chunks.next();
  } catch (error) {
    console.error("Export failed", { userId, error });
    return errorResponse(EXPORT_ERROR, 500);
  }

  const encoder = new TextEncoder();
  let next: IteratorResult<string> | undefined = first;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = next ?? (await chunks.next());
        next = undefined;
        if (result.done) controller.close();
        else controller.enqueue(encoder.encode(result.value));
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
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(now)}"`,
    },
  });
}
