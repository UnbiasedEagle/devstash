"use client";

import { authClient } from "@/lib/auth-client";
import { useResend } from "@/lib/use-resend";

export function useResendPasswordReset() {
  return useResend(
    (email) =>
      authClient.requestPasswordReset({ email, redirectTo: "/reset-password" }),
    "Reset email sent",
  );
}
