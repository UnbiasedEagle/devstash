import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense>
        <SignedInRedirect>
          <ResetPasswordForm />
        </SignedInRedirect>
      </Suspense>
    </AuthShell>
  );
}
