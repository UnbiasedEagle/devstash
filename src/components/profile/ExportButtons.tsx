"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ExportFormat } from "@/types/export";

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

const LABELS: Record<ExportFormat, string> = {
  json: "Download JSON",
  zip: "Download with files (ZIP)",
};

const FORMATS: ExportFormat[] = ["json", "zip"];

// One pending state for both, so the two can't run at once and use two slots of the export limit
export function ExportButtons() {
  const [pending, setPending] = useState<ExportFormat | null>(null);

  async function download(format: ExportFormat) {
    setPending(format);
    try {
      const response = await fetch(`/api/export?format=${format}`);
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
      setPending(null);
    }
  }

  return (
    <div aria-busy={pending !== null} className="flex flex-wrap gap-3">
      {FORMATS.map((format) => (
        <Button
          key={format}
          variant={format === "zip" ? "outline" : "default"}
          disabled={pending !== null}
          onClick={() => download(format)}
        >
          {pending === format ? "Preparing..." : LABELS[format]}
        </Button>
      ))}
    </div>
  );
}
