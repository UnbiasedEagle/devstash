import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell>
      <Suspense>
        <SignedInRedirect>{children}</SignedInRedirect>
      </Suspense>
    </AuthShell>
  );
}
