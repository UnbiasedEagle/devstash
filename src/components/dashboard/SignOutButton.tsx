"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/lib/use-sign-out";

export default function SignOutButton({ className }: { className?: string }) {
  const { signOut, isPending } = useSignOut();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Sign out"
      title="Sign out"
      className={className}
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut />
    </Button>
  );
}
