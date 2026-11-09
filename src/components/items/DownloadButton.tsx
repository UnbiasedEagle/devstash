"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getDownloadLink } from "@/actions/downloads";
import { Button } from "@/components/ui/button";

// The link is asked for when the button is pressed, never put in the page, so a link left sitting in a tab can't outlive its expiry
export default function DownloadButton({ itemId }: { itemId: string }) {
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const result = await getDownloadLink(itemId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      // The link asks for an attachment, so the browser saves the file and this page stays where it is
      window.location.assign(result.data.url);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={download}
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden />
      ) : (
        <Download aria-hidden />
      )}
      {pending ? "Preparing..." : "Download"}
    </Button>
  );
}
