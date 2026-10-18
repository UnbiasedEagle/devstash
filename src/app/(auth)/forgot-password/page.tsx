import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <SignedInRedirect>
        <ForgotPasswordForm />
      </SignedInRedirect>
    </Suspense>
  );
}
