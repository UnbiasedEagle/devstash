"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema } from "@/lib/auth-schemas";
import type { FieldErrors } from "@/types/auth";

export function ChangePasswordForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = changePasswordSchema.safeParse(
      Object.fromEntries(new FormData(form)),
    );
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          setErrors({ currentPassword: ["Current password is incorrect"] });
          return;
        }
        toast.error(error.message ?? "Could not change your password");
        return;
      }
      toast.success("Password updated. Other devices were signed out.");
      form.reset();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ProfileSection
      title="Password"
      description="Changing your password signs you out on your other devices."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex max-w-sm flex-col gap-4"
      >
        <AuthField
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.[0]}
        />
        <AuthField
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.[0]}
        />
        <AuthField
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.[0]}
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </ProfileSection>
  );
}
