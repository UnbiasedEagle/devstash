import { Suspense } from "react";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignedInRedirect>
        <SignUpForm />
      </SignedInRedirect>
    </Suspense>
  );
}
