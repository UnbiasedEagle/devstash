"use client";

import { FolderPlus } from "lucide-react";
import { createCollection } from "@/actions/collections";
import CollectionFormDialog from "@/components/collections/CollectionFormDialog";
import { Button } from "@/components/ui/button";

const EMPTY_VALUES = { name: "", description: "" };

export default function NewCollectionDialog() {
  return (
    <CollectionFormDialog
      title="New collection"
      description="Group related items together, whatever their type."
      initialValues={EMPTY_VALUES}
      submitLabel="Create collection"
      pendingLabel="Creating..."
      successMessage="Collection created"
      onSubmit={createCollection}
      renderTrigger={(open) => (
        <Button
          variant="outline"
          className="max-sm:size-8 max-sm:px-0"
          aria-label="New Collection"
          onClick={open}
        >
          <FolderPlus />
          <span className="max-sm:hidden">New Collection</span>
        </Button>
      )}
    />
  );
}
