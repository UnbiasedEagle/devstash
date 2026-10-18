"use client";

import { authClient } from "@/lib/auth-client";
import { useResend } from "@/lib/use-resend";

export function useResendVerification() {
  return useResend(
    (email) => authClient.sendVerificationEmail({ email }),
    "Verification email sent",
  );
}
