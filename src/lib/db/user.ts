import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id, name, email, image } = session.user;
  return { id, name, email, image };
});

export async function getCurrentUserId() {
  const { id } = await getCurrentUser();
  return id;
}
