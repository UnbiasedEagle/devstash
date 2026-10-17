import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense>
        <SignedInRedirect>
          <SignInForm />
        </SignedInRedirect>
      </Suspense>
    </AuthShell>
  );
}
