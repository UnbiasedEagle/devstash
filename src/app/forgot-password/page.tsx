import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Suspense>
        <SignedInRedirect>
          <ForgotPasswordForm />
        </SignedInRedirect>
      </Suspense>
    </AuthShell>
  );
}
