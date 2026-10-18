"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useOpenItemDrawer } from "@/components/items/ItemDrawer";
import type { DrawerPreview } from "@/types/items";

interface ItemLinkProps extends Omit<ComponentProps<typeof Link>, "onClick"> {
  preview: DrawerPreview;
}

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function ItemLink({ preview, ...props }: ItemLinkProps) {
  const openDrawer = useOpenItemDrawer();

  return (
    <Link
      {...props}
      onClick={(event) => {
        if (isPlainLeftClick(event)) openDrawer?.(preview);
      }}
    />
  );
}
