"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message ?? "Could not sign out");
        return;
      }
      router.replace("/sign-in");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setIsPending(false);
    }
  }

  return { signOut, isPending };
}
