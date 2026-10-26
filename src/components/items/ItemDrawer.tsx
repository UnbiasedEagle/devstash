"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useOptimistic,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { setItemFavorite, setItemPinned } from "@/actions/items";
import ItemDrawerSkeleton from "@/components/items/ItemDrawerSkeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { DrawerPreview, ItemFlags } from "@/types/items";

interface ItemDrawerProviderProps {
  openItemId: string | undefined;
  closeHref: string;
  drawer: ReactNode;
  children: ReactNode;
}

interface ItemDrawerContextValue {
  openDrawer: (preview: DrawerPreview) => void;
  preview: DrawerPreview | null;
  getFlags: (id: string, saved: ItemFlags) => ItemFlags;
  toggleFlag: (id: string, flag: keyof ItemFlags, value: boolean) => void;
  setDirty: (dirty: boolean) => void;
  confirmDiscard: (onConfirm: () => void) => void;
  closeDrawer: () => void;
}

interface FlagChange {
  id: string;
  flag: keyof ItemFlags;
  value: boolean;
}

type FlagOverrides = Record<string, Partial<ItemFlags>>;

const FLAG_ACTIONS = {
  isFavorite: setItemFavorite,
  isPinned: setItemPinned,
};

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useOpenItemDrawer() {
  return useContext(ItemDrawerContext)?.openDrawer;
}

export function useItemDrawer() {
  const context = useContext(ItemDrawerContext);
  if (!context) throw new Error("Missing ItemDrawerProvider");
  return context;
}

export function useItemFlags(id: string, saved: ItemFlags) {
  const context = useContext(ItemDrawerContext);
  return context ? context.getFlags(id, saved) : saved;
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
  const [pendingDiscard, setPendingDiscard] = useState<(() => void) | null>(
    null,
  );
  const dirtyRef = useRef(false);
  // The base state is always empty: once the action settles, the revalidated server data takes over, and a failed action drops the override so the flag reverts
  const [overrides, applyOverride] = useOptimistic<FlagOverrides, FlagChange>(
    {},
    (current, { id, flag, value }) => ({
      ...current,
      [id]: { ...current[id], [flag]: value },
    }),
  );

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

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  function confirmDiscard(onConfirm: () => void) {
    if (dirtyRef.current) {
      setPendingDiscard(() => onConfirm);
    } else {
      onConfirm();
    }
  }

  function closeDrawer() {
    setOpen(false);
    router.replace(closeHref, { scroll: false });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    confirmDiscard(closeDrawer);
  }

  function toggleFlag(id: string, flag: keyof ItemFlags, value: boolean) {
    startTransition(async () => {
      applyOverride({ id, flag, value });
      try {
        const result = await FLAG_ACTIONS[flag](id, value);
        if (!result.success) toast.error(result.error);
      } catch {
        toast.error("Something went wrong. Try again.");
      }
    });
  }

  function getFlags(id: string, saved: ItemFlags): ItemFlags {
    return { ...saved, ...overrides[id] };
  }

  function handleDiscard() {
    const onConfirm = pendingDiscard;
    setPendingDiscard(null);
    dirtyRef.current = false;
    onConfirm?.();
  }

  return (
    <ItemDrawerContext
      value={{
        openDrawer,
        preview,
        getFlags,
        toggleFlag,
        setDirty,
        confirmDiscard,
        closeDrawer,
      }}
    >
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
      <Dialog
        open={pendingDiscard !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDiscard(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Discard changes?</DialogTitle>
          <DialogDescription>
            Your edits to this item haven&apos;t been saved.
          </DialogDescription>
          <DialogFooter className="max-sm:flex-row max-sm:*:flex-1">
            <Button
              variant="outline"
              onClick={() => setPendingDiscard(null)}
              autoFocus
            >
              Keep editing
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ItemDrawerContext>
  );
}
