"use client";

import { Loader2, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createItem } from "@/actions/items";
import ItemFormFields, {
  validateItemForm,
  type FormErrors,
  type FormValues,
} from "@/components/items/ItemFormFields";
import ItemTypeSelector from "@/components/items/ItemTypeSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { CREATABLE_ITEM_TYPES, isCreatableItemType } from "@/lib/item-schemas";
import type { ItemTypeSummary } from "@/types/dashboard";

const EMPTY_VALUES: FormValues = {
  type: "Snippet",
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: [],
};

const DISMISS_REASONS = ["outside-press", "escape-key"];

export default function NewItemDialog({
  itemTypes,
}: {
  itemTypes: ItemTypeSummary[];
}) {
  const { type: slug } = useParams<{ type?: string }>();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  const isDirty =
    [values.title, values.description, values.content, values.url].some(
      (text) => text.trim() !== "",
    ) || values.tags.length > 0;

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function selectType(type: string) {
    if (!isCreatableItemType(type)) return;
    setValues((current) => ({
      ...current,
      type,
      language:
        type === "Command" && !current.language ? "bash" : current.language,
    }));
    setErrors({});
  }

  function openDialog() {
    const preselected = CREATABLE_ITEM_TYPES.find(
      (name) => name.toLowerCase() === slug?.toLowerCase(),
    );
    const type = preselected ?? EMPTY_VALUES.type;
    setValues({
      ...EMPTY_VALUES,
      type,
      language: type === "Command" ? "bash" : "",
    });
    setErrors({});
    setOpen(true);
  }

  function handleOpenChange(
    nextOpen: boolean,
    details: { reason: string; cancel: () => void },
  ) {
    if (pending) return;
    // A stray tap outside or Escape would silently discard up to 50,000 characters, so only Cancel closes a filled-in form
    if (!nextOpen && isDirty && DISMISS_REASONS.includes(details.reason)) {
      details.cancel();
      return;
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateItemForm(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setPending(true);
    try {
      const result = await createItem(validation.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.type} created`);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        className="max-sm:size-8 max-sm:px-0"
        aria-label="New Item"
        onClick={openDialog}
      >
        <Plus />
        <span className="max-sm:hidden">New Item</span>
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex h-[min(46rem,calc(100dvh-2rem))] max-w-xl flex-col">
          <DialogTitle>New item</DialogTitle>
          <DialogDescription className="[@media(max-height:34rem)]:sr-only">
            Save a snippet, prompt, command, note or link to your stash.
          </DialogDescription>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-4 flex min-h-0 flex-1 flex-col"
          >
            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1">
              <ItemTypeSelector
                itemTypes={itemTypes}
                value={values.type}
                disabled={pending}
                onChange={selectType}
              />
              <ItemFormFields
                values={values}
                errors={errors}
                onChange={update}
              />
            </div>

            <DialogFooter className="mt-3 max-sm:flex-row max-sm:*:flex-1">
              <DialogClose
                render={<Button type="button" variant="outline" />}
                disabled={pending}
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                {pending ? "Creating..." : "Create item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
