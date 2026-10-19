"use client";

import { Pin, Star } from "lucide-react";
import { useItemFlags } from "@/components/items/ItemDrawer";
import type { ItemFlags } from "@/types/items";

export default function ItemFlagIcons({
  id,
  saved,
}: {
  id: string;
  saved: ItemFlags;
}) {
  const { isFavorite, isPinned } = useItemFlags(id, saved);

  return (
    <>
      {isPinned && (
        <Pin
          role="img"
          aria-label="Pinned"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      )}
      {isFavorite && (
        <Star
          role="img"
          aria-label="Favorite"
          className="size-3.5 shrink-0 fill-yellow-500 text-yellow-500"
        />
      )}
    </>
  );
}
