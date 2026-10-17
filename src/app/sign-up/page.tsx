import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense>
        <SignedInRedirect>
          <SignUpForm />
        </SignedInRedirect>
      </Suspense>
    </AuthShell>
  );
}
