"use client";

import { Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import DeleteItemButton from "@/components/items/DeleteItemButton";
import ItemEditForm from "@/components/items/ItemEditForm";
import ItemFlagToggles from "@/components/items/ItemFlagToggles";
import { Button } from "@/components/ui/button";
import type { DetailItem } from "@/types/items";

interface ItemDetailShellProps {
  item: DetailItem;
  editable: boolean;
  children: ReactNode;
}

export default function ItemDetailShell({
  item,
  editable,
  children,
}: ItemDetailShellProps) {
  const [editing, setEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // The form stays up until the revalidated item arrives, so the view never flashes the pre-edit values
  if (savedAt !== null && item.updatedAt.getTime() !== savedAt) {
    setSavedAt(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="p-6">
        <ItemEditForm
          item={item}
          onCancel={() => setEditing(false)}
          onSaved={() => setSavedAt(item.updatedAt.getTime())}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="-mb-2 flex items-center justify-end gap-1 pr-10">
        <ItemFlagToggles
          id={item.id}
          saved={{ isFavorite: item.isFavorite, isPinned: item.isPinned }}
        />
        {editable && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden />
            Edit
          </Button>
        )}
        <DeleteItemButton id={item.id} title={item.title} />
      </div>
      {children}
    </div>
  );
}
