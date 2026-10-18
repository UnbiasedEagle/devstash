"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { CheckEmailNotice } from "@/components/auth/CheckEmailNotice";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/auth-schemas";
import { useResendPasswordReset } from "@/lib/use-resend-password-reset";
import type { FieldErrors } from "@/types/auth";

const signInLinkClass = "text-foreground underline underline-offset-4";

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { resend, startCooldown, secondsLeft, isPending } =
    useResendPasswordReset();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);
    const { email } = parsed.data;
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) {
        toast.error(error.message ?? "Could not send the reset email");
        return;
      }
      setSentTo(email);
      startCooldown();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <CheckEmailNotice
        description={
          <>
            If an account exists for{" "}
            <span className="break-all text-foreground">{sentTo}</span>, we sent
            a link to reset your password. It expires in 1 hour.
          </>
        }
        footer={
          <>
            Remembered it?{" "}
            <Link href="/sign-in" className={signInLinkClass}>
              Sign in
            </Link>
          </>
        }
        secondsLeft={secondsLeft}
        isPending={isPending}
        onResend={() => resend(sentTo)}
        onChangeEmail={() => setSentTo(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <AuthField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.[0]}
        />
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={pending}
        >
          {pending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className={signInLinkClass}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
