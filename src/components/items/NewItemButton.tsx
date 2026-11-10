import { Plus } from "lucide-react";
import { connection } from "next/server";
import NewItemDialog from "@/components/items/NewItemDialog";
import { Button } from "@/components/ui/button";
import { getCollectionOptions } from "@/lib/db/collections";
import { getCustomItemTypes, getSystemItemTypes } from "@/lib/db/item-types";
import { getCurrentUserId, getIsPro } from "@/lib/db/user";

export function NewItemButtonFallback() {
  return (
    <Button
      className="max-sm:size-8 max-sm:px-0"
      aria-label="New Item"
      disabled
    >
      <Plus />
      <span className="max-sm:hidden">New Item</span>
    </Button>
  );
}

export default async function NewItemButton() {
  await connection();
  const userId = await getCurrentUserId();
  const [itemTypes, customTypes, collections, isPro] = await Promise.all([
    getSystemItemTypes(),
    getCustomItemTypes(userId),
    getCollectionOptions(userId),
    getIsPro(userId),
  ]);
  return (
    <NewItemDialog
      itemTypes={itemTypes}
      customTypes={customTypes}
      collections={collections}
      isPro={isPro}
    />
  );
}
