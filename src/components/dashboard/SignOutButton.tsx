"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/lib/use-sign-out";

interface SignOutButtonProps {
  showLabel?: boolean;
  className?: string;
}

export default function SignOutButton({
  showLabel = false,
  className,
}: SignOutButtonProps) {
  const { signOut, isPending } = useSignOut();

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      aria-label="Sign out"
      title="Sign out"
      className={className}
      disabled={isPending}
      onClick={signOut}
    >
      <LogOut />
      {showLabel && (isPending ? "Signing out..." : "Sign out")}
    </Button>
  );
}
