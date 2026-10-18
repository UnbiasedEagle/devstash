"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const DEFAULT_MESSAGE = "GitHub sign-in was cancelled or failed. Try again.";

const INVALID_LINK_MESSAGE =
  "This verification link is invalid or has expired. Sign in with your email and password to get a new one.";

const ERROR_MESSAGES: Record<string, string> = {
  account_not_linked:
    "An account with this email already exists. Sign in with your email and password instead.",
  TOKEN_EXPIRED: INVALID_LINK_MESSAGE,
  INVALID_TOKEN: INVALID_LINK_MESSAGE,
  USER_NOT_FOUND: INVALID_LINK_MESSAGE,
  INVALID_USER: INVALID_LINK_MESSAGE,
};

export function OAuthErrorToast() {
  const router = useRouter();
  const pathname = usePathname();
  const error = useSearchParams().get("error");

  useEffect(() => {
    if (!error) return;
    toast.error(ERROR_MESSAGES[error] ?? DEFAULT_MESSAGE, {
      id: "oauth-error",
    });
    router.replace(pathname);
  }, [error, pathname, router]);

  return null;
}
