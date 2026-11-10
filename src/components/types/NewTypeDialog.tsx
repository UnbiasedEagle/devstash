"use client";

import { Plus } from "lucide-react";
import { createItemType } from "@/actions/item-types";
import TypeFormDialog from "@/components/types/TypeFormDialog";
import { Button } from "@/components/ui/button";
import {
  CUSTOM_TYPE_COLORS,
  CUSTOM_TYPE_ICON_NAMES,
} from "@/lib/custom-type-options";

const EMPTY_VALUES = {
  name: "",
  icon: CUSTOM_TYPE_ICON_NAMES[0],
  color: CUSTOM_TYPE_COLORS[0],
};

export default function NewTypeDialog() {
  return (
    <TypeFormDialog
      title="New type"
      description="Add your own kind of item next to the built-in ones."
      initialValues={EMPTY_VALUES}
      submitLabel="Create type"
      pendingLabel="Creating..."
      successMessage="Type created"
      onSubmit={createItemType}
      renderTrigger={(open) => (
        <Button variant="outline" onClick={open}>
          <Plus />
          New type
        </Button>
      )}
    />
  );
}
