"use client";

import { Pencil } from "lucide-react";
import { updateItemType } from "@/actions/item-types";
import TypeFormDialog from "@/components/types/TypeFormDialog";
import { Button } from "@/components/ui/button";
import type { ItemTypeInput } from "@/lib/item-type-schemas";

interface EditTypeDialogProps {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function EditTypeDialog({
  id,
  name,
  icon,
  color,
}: EditTypeDialogProps) {
  return (
    <TypeFormDialog
      title="Edit type"
      description="Its items keep their type when you change it."
      initialValues={{ name, icon, color }}
      submitLabel="Save changes"
      pendingLabel="Saving..."
      successMessage="Type updated"
      onSubmit={(data: ItemTypeInput) => updateItemType(id, data)}
      renderTrigger={(open) => (
        <Button
          variant="outline"
          size="icon"
          aria-label={`Edit ${name}`}
          onClick={open}
        >
          <Pencil />
        </Button>
      )}
    />
  );
}
