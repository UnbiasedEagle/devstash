"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/auth-schemas";
import type { FieldErrors } from "@/types/auth";

export function SignInForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signInSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.signIn.email(parsed.data);
      if (error) {
        toast.error(error.message ?? "Could not sign in");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to open your stash.
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
        <AuthField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.[0]}
        />
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={pending}
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        New to DevStash?{" "}
        <Link
          href="/sign-up"
          className="text-foreground underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
