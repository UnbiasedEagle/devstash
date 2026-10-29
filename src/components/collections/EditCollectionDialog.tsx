"use client";

import { Pencil } from "lucide-react";
import { updateCollection } from "@/actions/collections";
import CollectionFormDialog from "@/components/collections/CollectionFormDialog";
import { Button } from "@/components/ui/button";
import type { CollectionSummary } from "@/types/dashboard";

export default function EditCollectionDialog({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <CollectionFormDialog
      title="Edit collection"
      description="Change the name or description. Items stay where they are."
      initialValues={{
        name: collection.name,
        description: collection.description ?? "",
      }}
      submitLabel="Save changes"
      pendingLabel="Saving..."
      successMessage="Collection updated"
      onSubmit={(data) => updateCollection(collection.id, data)}
      renderTrigger={(open) => (
        <Button type="button" variant="outline" size="sm" onClick={open}>
          <Pencil aria-hidden />
          Edit
        </Button>
      )}
    />
  );
}
