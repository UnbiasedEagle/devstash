"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface OAuthButtonProps {
  provider: "github";
  label: string;
  icon: ReactNode;
}

export function OAuthButton({ provider, label, icon }: OAuthButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-in",
      });
      if (error) {
        toast.error(error.message ?? "Could not continue with GitHub");
        setPending(false);
      }
    } catch {
      toast.error("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={handleClick}
    >
      {icon}
      {pending ? "Redirecting..." : label}
    </Button>
  );
}
