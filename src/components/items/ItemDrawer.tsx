"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface ItemDrawerProps {
  closeHref: string;
  returnFocusId: string;
  children: ReactNode;
}

export function ItemDrawer({
  closeHref,
  returnFocusId,
  children,
}: ItemDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) router.replace(closeHref, { scroll: false });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        finalFocus={() => document.getElementById(returnFocusId)}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
