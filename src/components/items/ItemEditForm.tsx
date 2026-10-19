"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { updateItem } from "@/actions/items";
import { useItemDrawer } from "@/components/items/ItemDrawer";
import ItemFormFields, {
  isItemFormDirty,
  validateItemForm,
  type FormErrors,
  type FormValues,
} from "@/components/items/ItemFormFields";
import { Button } from "@/components/ui/button";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ITEM_LANGUAGES, type CreatableItemType } from "@/lib/item-schemas";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import type { DetailItem } from "@/types/items";

function toFormValues(item: DetailItem): FormValues {
  const language = ITEM_LANGUAGES.find((name) => name === item.language);
  return {
    type: item.itemType.name as CreatableItemType,
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: language && language !== "plaintext" ? language : "",
    url: item.url ?? "",
    tags: item.tags,
  };
}

interface ItemEditFormProps {
  item: DetailItem;
  onCancel: () => void;
  onSaved: () => void;
}

export default function ItemEditForm({
  item,
  onCancel,
  onSaved,
}: ItemEditFormProps) {
  const { setDirty, confirmDiscard } = useItemDrawer();
  const [initial] = useState(() => toFormValues(item));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const Icon = ITEM_TYPE_ICONS[item.itemType.icon];

  useEffect(() => {
    setDirty(isItemFormDirty(values, initial));
    return () => setDirty(false);
  }, [values, initial, setDirty]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateItemForm(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setPending(true);
    let saved = false;
    try {
      const result = await updateItem(item.id, validation.data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      saved = true;
      toast.success("Item updated");
      setDirty(false);
      onSaved();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      // After a save the form stays disabled until the shell swaps back to the view
      if (!saved) setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 pr-10">
        <SheetTitle>Edit item</SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          {Icon && (
            <Icon
              aria-hidden
              className="size-4"
              style={{ color: item.itemType.color }}
            />
          )}
          {item.itemType.name} · the type can&apos;t be changed
        </SheetDescription>
      </header>

      <ItemFormFields values={values} errors={errors} onChange={update} />

      <div className="flex gap-2 max-sm:*:flex-1 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => confirmDiscard(onCancel)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
