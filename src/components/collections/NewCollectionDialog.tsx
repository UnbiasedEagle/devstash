"use client";

import { FolderPlus, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createCollection } from "@/actions/collections";
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
import { createCollectionSchema } from "@/lib/collection-schemas";

type FormErrors = Partial<Record<"name" | "description", string[]>>;

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {error}
    </p>
  );
}

export default function NewCollectionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  function openDialog() {
    setName("");
    setDescription("");
    setErrors({});
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) setOpen(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createCollectionSchema.safeParse({
      name,
      description: description || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: FormErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors(fieldErrors);
      const firstInvalid = fieldErrors.name ? "name" : "description";
      document.getElementById(`collection-${firstInvalid}`)?.focus();
      return;
    }

    setPending(true);
    try {
      const result = await createCollection(parsed.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Collection created");
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
      <Button
        variant="outline"
        className="max-sm:size-8 max-sm:px-0"
        aria-label="New Collection"
        onClick={openDialog}
      >
        <FolderPlus />
        <span className="max-sm:hidden">New Collection</span>
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group related items together, whatever their type.
          </DialogDescription>
          <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="collection-name">Name</Label>
              <Input
                id="collection-name"
                value={name}
                autoComplete="off"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={
                  nameError ? "collection-name-error" : undefined
                }
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
              />
              <FieldError id="collection-name-error" error={nameError} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="collection-description">
                Description (optional)
              </Label>
              <Input
                id="collection-description"
                value={description}
                autoComplete="off"
                aria-invalid={descriptionError ? true : undefined}
                aria-describedby={
                  descriptionError ? "collection-description-error" : undefined
                }
                onChange={(event) => {
                  setDescription(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    description: undefined,
                  }));
                }}
              />
              <FieldError
                id="collection-description-error"
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
                {pending ? "Creating..." : "Create collection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
