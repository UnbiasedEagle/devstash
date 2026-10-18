"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import ItemDrawerSkeleton from "@/components/items/ItemDrawerSkeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { DrawerPreview } from "@/types/items";

interface ItemDrawerProviderProps {
  openItemId: string | undefined;
  closeHref: string;
  drawer: ReactNode;
  children: ReactNode;
}

interface ItemDrawerContextValue {
  openDrawer: (preview: DrawerPreview) => void;
  preview: DrawerPreview | null;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useOpenItemDrawer() {
  return useContext(ItemDrawerContext)?.openDrawer;
}

export function ItemDrawerPending() {
  return (
    <ItemDrawerSkeleton preview={useContext(ItemDrawerContext)?.preview} />
  );
}

export function ItemDrawerProvider({
  openItemId,
  closeHref,
  drawer,
  children,
}: ItemDrawerProviderProps) {
  const router = useRouter();
  const [itemId, setItemId] = useState(openItemId ?? null);
  const [preview, setPreview] = useState<DrawerPreview | null>(null);
  const [open, setOpen] = useState(openItemId !== undefined);
  const [syncedOpenItemId, setSyncedOpenItemId] = useState(openItemId);

  // Follows the URL for back/forward and shared links; a click opens the drawer before the URL catches up
  if (openItemId !== syncedOpenItemId) {
    setSyncedOpenItemId(openItemId);
    if (openItemId === undefined) {
      setOpen(false);
    } else {
      setItemId(openItemId);
      setOpen(true);
      if (preview?.id !== openItemId) setPreview(null);
    }
  }

  function openDrawer(nextPreview: DrawerPreview) {
    setItemId(nextPreview.id);
    setPreview(nextPreview);
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) router.replace(closeHref, { scroll: false });
  }

  return (
    <ItemDrawerContext value={{ openDrawer, preview }}>
      {children}
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          finalFocus={() => document.getElementById(`item-${itemId}`)}
        >
          {itemId !== null && itemId === openItemId ? (
            drawer
          ) : (
            <ItemDrawerSkeleton
              preview={preview?.id === itemId ? preview : null}
            />
          )}
        </SheetContent>
      </Sheet>
    </ItemDrawerContext>
  );
}
