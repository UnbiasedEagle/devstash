"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/auth-schemas";
import type { FieldErrors } from "@/types/auth";

function InvalidLinkNotice() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          This link is invalid or expired
        </h1>
        <p className="text-sm text-muted-foreground">
          The reset link is invalid or has already been used. Request a new one
          to continue.
        </p>
      </div>
      <Link
        href="/forgot-password"
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Request a new link
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [tokenRejected, setTokenRejected] = useState(false);

  if (!token || searchParams.get("error") || tokenRejected) {
    return <InvalidLinkNotice />;
  }
  const resetToken: string = token;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token: resetToken,
      });
      if (error) {
        if (error.code === "INVALID_TOKEN") {
          setTokenRejected(true);
          return;
        }
        toast.error(error.message ?? "Could not reset your password");
        setPending(false);
        return;
      }
      toast.success("Password updated. Sign in with your new password.");
      router.push("/sign-in");
    } catch {
      toast.error("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a password you haven&apos;t used before.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <AuthField
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.[0]}
        />
        <AuthField
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.[0]}
        />
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={pending}
        >
          {pending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
