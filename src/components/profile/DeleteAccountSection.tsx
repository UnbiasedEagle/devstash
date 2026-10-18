"use client";

import { Check, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { deleteAccountSchema } from "@/lib/auth-schemas";
import { useSignOut } from "@/lib/use-sign-out";
import type { FieldErrors } from "@/types/auth";

interface DeleteAccountSectionProps {
  email: string;
  hasPassword: boolean;
  itemCount: number;
  collectionCount: number;
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function DeleteAccountSection({
  email,
  hasPassword,
  itemCount,
  collectionCount,
}: DeleteAccountSectionProps) {
  const router = useRouter();
  const { signOut, isPending: isSigningOut } = useSignOut();
  const confirmRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [needsFreshSignIn, setNeedsFreshSignIn] = useState(false);
  const [pending, setPending] = useState(false);

  const emailMatches =
    confirmation.trim().toLowerCase() === email.toLowerCase();
  const hasData = itemCount > 0 || collectionCount > 0;

  function handleOpenChange(nextOpen: boolean) {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setConfirmation("");
      setErrors({});
      setNeedsFreshSignIn(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailMatches) return;

    let password: string | undefined;
    if (hasPassword) {
      const parsed = deleteAccountSchema.safeParse(
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      if (!parsed.success) {
        setErrors(z.flattenError(parsed.error).fieldErrors);
        return;
      }
      password = parsed.data.password;
    }

    setErrors({});
    setNeedsFreshSignIn(false);
    setPending(true);
    try {
      const { error } = await authClient.deleteUser(
        password ? { password } : {},
      );
      if (error) {
        setPending(false);
        if (error.code === "INVALID_PASSWORD") {
          setErrors({ password: ["Password is incorrect"] });
          return;
        }
        if (error.code === "SESSION_EXPIRED") {
          setNeedsFreshSignIn(true);
          return;
        }
        toast.error(error.message ?? "Could not delete your account");
        return;
      }
      // Stays pending on success so the form can't be submitted again while navigating away
      toast.success("Your account was deleted");
      router.replace("/sign-in");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Permanently remove your account and everything you saved. This cannot
          be undone.
        </p>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={<Button variant="destructive" className="shrink-0" />}
          >
            Delete account
          </DialogTrigger>
          <DialogContent initialFocus={confirmRef}>
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" aria-hidden />
            </div>
            <DialogTitle className="mt-4">Delete your account?</DialogTitle>
            <DialogDescription>
              You will be signed out and nothing can be recovered.
            </DialogDescription>
            <ul className="mt-4 list-disc space-y-1 rounded-lg bg-muted/50 py-3 pr-3 pl-8 text-sm text-muted-foreground">
              <li>Your profile and sign-in methods</li>
              <li>
                {hasData
                  ? `${pluralize(itemCount, "item")} and ${pluralize(collectionCount, "collection")}`
                  : "Your items and collections"}
              </li>
              <li>Your tags and custom types</li>
            </ul>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-5 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="confirm-email"
                  className="block font-normal leading-6 text-muted-foreground"
                >
                  Type{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium break-all text-foreground">
                    {email}
                  </code>{" "}
                  to confirm
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-email"
                    ref={confirmRef}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="off"
                    className="h-9 pr-9"
                  />
                  {emailMatches && (
                    <Check
                      className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-destructive"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
              {hasPassword && (
                <AuthField
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  error={errors.password?.[0]}
                />
              )}
              {needsFreshSignIn && (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm"
                >
                  <p>
                    For your security, sign in again before deleting your
                    account.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    disabled={isSigningOut}
                    onClick={signOut}
                  >
                    Sign out
                  </Button>
                </div>
              )}
              <DialogFooter>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={pending}
                    />
                  }
                >
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={pending || !emailMatches}
                >
                  {pending && <Loader2 className="animate-spin" aria-hidden />}
                  {pending ? "Deleting..." : "Delete account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
