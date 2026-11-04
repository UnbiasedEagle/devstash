import { Plus } from "lucide-react";
import { connection } from "next/server";
import NewItemDialog from "@/components/items/NewItemDialog";
import { Button } from "@/components/ui/button";
import { getCollectionOptions } from "@/lib/db/collections";
import { getSystemItemTypes } from "@/lib/db/item-types";
import { getCurrentUserId } from "@/lib/db/user";

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
  const [itemTypes, collections] = await Promise.all([
    getSystemItemTypes(),
    getCurrentUserId().then(getCollectionOptions),
  ]);
  return <NewItemDialog itemTypes={itemTypes} collections={collections} />;
}
