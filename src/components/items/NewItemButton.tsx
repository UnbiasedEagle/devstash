import { Plus } from "lucide-react";
import { connection } from "next/server";
import NewItemDialog from "@/components/items/NewItemDialog";
import { Button } from "@/components/ui/button";
import { getSystemItemTypes } from "@/lib/db/item-types";

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
  const itemTypes = await getSystemItemTypes();
  return <NewItemDialog itemTypes={itemTypes} />;
}
