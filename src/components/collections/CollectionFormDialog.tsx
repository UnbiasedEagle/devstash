"use client";

import { Loader2 } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  collectionSchema,
  type CollectionInput,
} from "@/lib/collection-schemas";
import type { ActionResult } from "@/types/actions";

interface CollectionFormValues {
  name: string;
  description: string;
}

type FormErrors = Partial<Record<keyof CollectionFormValues, string[]>>;

interface CollectionFormDialogProps {
  title: string;
  description: string;
  initialValues: CollectionFormValues;
  submitLabel: string;
  pendingLabel: string;
  successMessage: string;
  onSubmit: (data: CollectionInput) => Promise<ActionResult<unknown>>;
  renderTrigger: (open: () => void) => ReactNode;
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {error}
    </p>
  );
}

export default function CollectionFormDialog({
  title,
  description,
  initialValues,
  submitLabel,
  pendingLabel,
  successMessage,
  onSubmit,
  renderTrigger,
}: CollectionFormDialogProps) {
  const nameId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [baseline, setBaseline] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  // The saved collection can change under an open form (another tab, a refresh). Untouched fields follow it, typed input is kept
  if (
    baseline.name !== initialValues.name ||
    baseline.description !== initialValues.description
  ) {
    setBaseline(initialValues);
    setValues((current) => ({
      name: current.name === baseline.name ? initialValues.name : current.name,
      description:
        current.description === baseline.description
          ? initialValues.description
          : current.description,
    }));
  }

  function openDialog() {
    setValues(initialValues);
    setBaseline(initialValues);
    setErrors({});
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) setOpen(nextOpen);
  }

  function update(key: keyof CollectionFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = collectionSchema.safeParse({
      name: values.name,
      description: values.description || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: FormErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors(fieldErrors);
      const firstInvalidId = fieldErrors.name ? nameId : descriptionId;
      document.getElementById(firstInvalidId)?.focus();
      return;
    }

    setPending(true);
    try {
      const result = await onSubmit(parsed.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  const nameError = errors.name?.[0];
  const descriptionError = errors.description?.[0];

  return (
    <>
      {renderTrigger(openDialog)}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={nameId}>Name</Label>
              <Input
                id={nameId}
                value={values.name}
                autoComplete="off"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? `${nameId}-error` : undefined}
                onChange={(event) => update("name", event.target.value)}
              />
              <FieldError id={`${nameId}-error`} error={nameError} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={descriptionId}>Description (optional)</Label>
              <Input
                id={descriptionId}
                value={values.description}
                autoComplete="off"
                aria-invalid={descriptionError ? true : undefined}
                aria-describedby={
                  descriptionError ? `${descriptionId}-error` : undefined
                }
                onChange={(event) => update("description", event.target.value)}
              />
              <FieldError
                id={`${descriptionId}-error`}
                error={descriptionError}
              />
            </div>
            <DialogFooter className="max-sm:flex-row max-sm:*:flex-1">
              <DialogClose
                render={<Button type="button" variant="outline" />}
                disabled={pending}
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                {pending ? pendingLabel : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
