"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const GENERIC_ERROR = "Something went wrong. Try again.";
const FALLBACK_FILE_NAME = "devstash-export.json";

// A plain link would save the route's JSON error (too many exports, not Pro) as if it were the export, so the response is checked first
async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Not JSON, so the generic message is all there is to show
  }
  return GENERIC_ERROR;
}

function fileNameOf(response: Response): string {
  const match = /filename="([^"]+)"/.exec(
    response.headers.get("Content-Disposition") ?? "",
  );
  return match?.[1] ?? FALLBACK_FILE_NAME;
}

export function ExportDownloadButton() {
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const response = await fetch("/api/export");
      if (!response.ok) {
        toast.error(await errorMessage(response));
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameOf(response);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button disabled={pending} onClick={download}>
      {pending ? "Preparing..." : "Download JSON"}
    </Button>
  );
}
