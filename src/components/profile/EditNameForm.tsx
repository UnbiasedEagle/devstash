"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { updateNameSchema } from "@/lib/auth-schemas";
import type { FieldErrors } from "@/types/auth";

interface EditNameFormProps {
  initialName: string;
}

export function EditNameForm({ initialName }: EditNameFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateNameSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setErrors({});
    if (parsed.data.name === initialName) return;
    setPending(true);
    try {
      const { error } = await authClient.updateUser({ name: parsed.data.name });
      if (error) {
        toast.error(error.message ?? "Could not update your name");
        return;
      }
      toast.success("Name updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ProfileSection
      title="Name"
      description="This is how you appear in DevStash."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex max-w-sm flex-col gap-4"
      >
        <AuthField
          name="name"
          label="Name"
          autoComplete="name"
          defaultValue={initialName}
          error={errors.name?.[0]}
        />
        <Button type="submit" className="self-start" disabled={pending}>
          {pending ? "Saving..." : "Save name"}
        </Button>
      </form>
    </ProfileSection>
  );
}
