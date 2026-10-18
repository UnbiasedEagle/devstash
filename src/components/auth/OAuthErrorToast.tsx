"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function OAuthErrorToast() {
  const error = useSearchParams().get("error");

  useEffect(() => {
    if (error) {
      toast.error("GitHub sign-in was cancelled or failed. Try again.");
    }
  }, [error]);

  return null;
}
