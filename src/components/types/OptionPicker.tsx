"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PickerOption {
  value: string;
  label: string;
  content: ReactNode;
}

interface OptionPickerProps {
  label: string;
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}

const ARROW_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

// A radio group that is one tab stop and moves with the arrow keys, like the item type selector
export default function OptionPicker({
  label,
  options,
  value,
  onChange,
  invalid,
  describedBy,
  className,
}: OptionPickerProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const hasSelection = options.some((option) => option.value === value);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ARROW_STEPS[event.key];
    if (!step || !groupRef.current) return;
    const radios = [
      ...groupRef.current.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
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
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedBy}
      className={cn("flex flex-wrap gap-2", className)}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const isTabStop = checked || (!hasSelection && index === 0);
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            tabIndex={isTabStop ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "grid size-9 place-items-center rounded-md border border-border outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
              checked && "border-foreground bg-accent",
            )}
          >
            {option.content}
          </button>
        );
      })}
    </div>
  );
}
