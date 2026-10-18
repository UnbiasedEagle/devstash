"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { OAuthSection } from "@/components/auth/OAuthSection";
import { VerifyEmailNotice } from "@/components/auth/VerifyEmailNotice";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/auth-schemas";
import { useResendVerification } from "@/lib/use-resend-verification";
import type { FieldErrors } from "@/types/auth";

export function SignUpForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { resend, startCooldown, secondsLeft, isPending } =
    useResendVerification();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);
    const { name, email, password } = parsed.data;
    try {
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (error) {
        toast.error(error.message ?? "Could not create your account");
        return;
      }
      // A session token only comes back when no email verification is required
      if (data?.token) {
        router.push("/dashboard");
        router.refresh();
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
      <VerifyEmailNotice
        email={sentTo}
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
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start your stash. It takes a minute.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <AuthField
          name="name"
          label="Name"
          autoComplete="name"
          error={errors.name?.[0]}
        />
        <AuthField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.[0]}
        />
        <AuthField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.[0]}
        />
        <AuthField
          name="confirmPassword"
          label="Confirm password"
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
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <OAuthSection />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
