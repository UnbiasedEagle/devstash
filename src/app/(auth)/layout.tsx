import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { NO_INDEX } from "@/lib/no-index";

export const metadata: Metadata = NO_INDEX;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
