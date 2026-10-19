"use client";

import { Pin, Star } from "lucide-react";
import { useItemDrawer } from "@/components/items/ItemDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ItemFlags } from "@/types/items";

export default function ItemFlagToggles({
  id,
  saved,
}: {
  id: string;
  saved: ItemFlags;
}) {
  const { getFlags, toggleFlag } = useItemDrawer();
  const { isFavorite, isPinned } = getFlags(id, saved);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Favorite"
        aria-pressed={isFavorite}
        onClick={() => toggleFlag(id, "isFavorite", !isFavorite)}
      >
        <Star
          aria-hidden
          className={cn(isFavorite && "fill-yellow-500 text-yellow-500")}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Pin"
        aria-pressed={isPinned}
        onClick={() => toggleFlag(id, "isPinned", !isPinned)}
      >
        <Pin aria-hidden className={cn(isPinned && "fill-current")} />
      </Button>
    </>
  );
}
