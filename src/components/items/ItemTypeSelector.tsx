"use client";

import { useRef, type KeyboardEvent } from "react";
import ProBadge from "@/components/dashboard/ProBadge";
import { CUSTOM_ITEM_TYPE, isNewItemType } from "@/lib/item-schemas";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { ItemTypeSummary } from "@/types/dashboard";

const ARROW_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

interface ItemTypeSelectorProps {
  itemTypes: ItemTypeSummary[];
  // The user's own types, listed after the built-in ones
  customTypes?: ItemTypeSummary[];
  value: string;
  customTypeId?: string;
  onChange: (typeName: string, customTypeId?: string) => void;
  disabled?: boolean;
  isPro: boolean;
}

export default function ItemTypeSelector({
  itemTypes,
  customTypes = [],
  value,
  customTypeId,
  onChange,
  disabled,
  isPro,
}: ItemTypeSelectorProps) {
  const entries = [
    ...itemTypes.map((type) => ({ type, isCustom: false })),
    ...customTypes.map((type) => ({ type, isCustom: true })),
  ];
  const groupRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ARROW_STEPS[event.key];
    if (!step || !groupRef.current) return;
    const radios = [
      ...groupRef.current.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not(:disabled)',
      ),
    ];
    const index = radios.findIndex((radio) => radio === document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const next = radios[(index + step + radios.length) % radios.length];
    next.focus();
    next.click();
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Item type"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      onKeyDown={handleKeyDown}
    >
      {entries.map(({ type, isCustom }) => {
        const Icon = ITEM_TYPE_ICONS[type.icon];
        const isCreatable = isCustom || isNewItemType(type.name);
        const isSelected = isCustom
          ? value === CUSTOM_ITEM_TYPE && customTypeId === type.id
          : value === type.name;
        // Files are Pro, so free users see the badge; images are free and have none
        const needsPro = type.name === "File" && !isPro;

        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled || !isCreatable}
            onClick={() =>
              isCustom
                ? onChange(CUSTOM_ITEM_TYPE, type.id)
                : onChange(type.name)
            }
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
              isSelected && "border-ring bg-accent",
            )}
          >
            {Icon && (
              <Icon
                aria-hidden
                className="size-4 shrink-0"
                style={{ color: type.color }}
              />
            )}
            <span className="min-w-0 flex-1 truncate">{type.name}</span>
            {needsPro && <ProBadge />}
          </button>
        );
      })}
    </div>
  );
}
