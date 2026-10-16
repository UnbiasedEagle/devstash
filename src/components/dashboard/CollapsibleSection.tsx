"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 px-3 pb-1 pt-4 text-sm font-medium text-muted-foreground hover:text-foreground md:group-data-[collapsed=true]/sidebar:invisible"
      >
        {title}
        <ChevronDown
          className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open && children}
    </section>
  );
}
