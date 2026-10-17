import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface SignedInRedirectProps {
  children: React.ReactNode;
}

// Validates the session instead of trusting the cookie, so a stale cookie can't loop between the proxy and /sign-in.
export async function SignedInRedirect({ children }: SignedInRedirectProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  return children;
}
