"use client";

import { Loader2 } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import OptionPicker from "@/components/types/OptionPicker";
import TypeTile from "@/components/types/TypeTile";
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
  CUSTOM_TYPE_COLOR_NAMES,
  CUSTOM_TYPE_COLORS,
  CUSTOM_TYPE_ICON_LABELS,
  CUSTOM_TYPE_ICON_NAMES,
} from "@/lib/custom-type-options";
import { CUSTOM_TYPE_ICONS } from "@/lib/item-type-icons";
import { itemTypeSchema, type ItemTypeInput } from "@/lib/item-type-schemas";
import { showActionError } from "@/lib/show-action-error";
import type { ActionResult } from "@/types/actions";

interface TypeFormValues {
  name: string;
  icon: string;
  color: string;
}

type FormErrors = Partial<Record<keyof TypeFormValues, string[]>>;

interface TypeFormDialogProps {
  title: string;
  description: string;
  initialValues: TypeFormValues;
  submitLabel: string;
  pendingLabel: string;
  successMessage: string;
  onSubmit: (data: ItemTypeInput) => Promise<ActionResult<unknown>>;
  renderTrigger: (open: () => void) => ReactNode;
}

const ICON_OPTIONS = CUSTOM_TYPE_ICON_NAMES.map((name) => {
  const Icon = CUSTOM_TYPE_ICONS[name];
  return {
    value: name,
    label: CUSTOM_TYPE_ICON_LABELS[name],
    content: <Icon className="size-4" aria-hidden />,
  };
});

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {error}
    </p>
  );
}

export default function TypeFormDialog({
  title,
  description,
  initialValues,
  submitLabel,
  pendingLabel,
  successMessage,
  onSubmit,
  renderTrigger,
}: TypeFormDialogProps) {
  const nameId = useId();
  const iconErrorId = useId();
  const colorErrorId = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  function openDialog() {
    setValues(initialValues);
    setErrors({});
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) setOpen(nextOpen);
  }

  function update(key: keyof TypeFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = itemTypeSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FormErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors(fieldErrors);
      if (fieldErrors.name) document.getElementById(nameId)?.focus();
      return;
    }

    setPending(true);
    try {
      const result = await onSubmit(parsed.data);
      if (!result.success) {
        showActionError(result);
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
  const iconError = errors.icon?.[0];
  const colorError = errors.color?.[0];
  const colorOptions = CUSTOM_TYPE_COLORS.map((color) => ({
    value: color,
    label: CUSTOM_TYPE_COLOR_NAMES[color],
    content: (
      <span
        aria-hidden
        className="size-4 rounded-full"
        style={{ backgroundColor: color }}
      />
    ),
  }));

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
              <span className="text-sm font-medium">Icon</span>
              <OptionPicker
                label="Icon"
                options={ICON_OPTIONS}
                value={values.icon}
                onChange={(value) => update("icon", value)}
                invalid={Boolean(iconError)}
                describedBy={iconError ? iconErrorId : undefined}
              />
              <FieldError id={iconErrorId} error={iconError} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Color</span>
              <OptionPicker
                label="Color"
                options={colorOptions}
                value={values.color}
                onChange={(value) => update("color", value)}
                invalid={Boolean(colorError)}
                describedBy={colorError ? colorErrorId : undefined}
              />
              <FieldError id={colorErrorId} error={colorError} />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <TypeTile icon={values.icon} color={values.color} />
              <span className="min-w-0 truncate font-medium">
                {values.name.trim() || "Preview"}
              </span>
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
