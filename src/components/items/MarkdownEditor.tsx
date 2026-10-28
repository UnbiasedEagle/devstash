"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Loaded on first preview so the Markdown renderer stays out of every page that only opens the form
const MarkdownContent = dynamic(
  () => import("@/components/items/MarkdownContent"),
  { ssr: false, loading: () => <Skeleton className="h-full rounded-lg" /> },
);

type Mode = "write" | "preview";

const TABS: { mode: Mode; label: string }[] = [
  { mode: "write", label: "Write" },
  { mode: "preview", label: "Preview" },
];

interface MarkdownEditorProps {
  id: string;
  value: string;
  // A new array on every failed validation, so a repeat of the same error still pulls the user back to the editor
  error?: string[];
  children: ReactNode;
}

function nextMode(mode: Mode, key: string): Mode | null {
  const index = TABS.findIndex((tab) => tab.mode === mode);
  switch (key) {
    case "ArrowRight":
      return TABS[(index + 1) % TABS.length].mode;
    case "ArrowLeft":
      return TABS[(index - 1 + TABS.length) % TABS.length].mode;
    case "Home":
      return TABS[0].mode;
    case "End":
      return TABS[TABS.length - 1].mode;
    default:
      return null;
  }
}

export default function MarkdownEditor({
  id,
  value,
  error,
  children,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<Mode>("write");
  const [seenError, setSeenError] = useState(error);

  // The invalid field can't be focused while its panel is hidden, so a validation error brings the editor back
  if (error !== seenError) {
    setSeenError(error);
    if (error) setMode("write");
  }

  useEffect(() => {
    if (error && mode === "write") document.getElementById(id)?.focus();
  }, [error, mode, id]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextMode(mode, event.key);
    if (!next) return;
    event.preventDefault();
    setMode(next);
    document.getElementById(`${id}-${next}-tab`)?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="tablist"
        aria-label="Content mode"
        className="flex gap-1 self-end"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            id={`${id}-${tab.mode}-tab`}
            aria-selected={mode === tab.mode}
            aria-controls={`${id}-${tab.mode}-panel`}
            tabIndex={mode === tab.mode ? 0 : -1}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
              mode === tab.mode && "bg-muted text-foreground",
            )}
            onClick={() => setMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Kept mounted while previewing so the editor doesn't reload its language or lose its cursor */}
      <div
        role="tabpanel"
        id={`${id}-write-panel`}
        aria-labelledby={`${id}-write-tab`}
        hidden={mode !== "write"}
      >
        {children}
      </div>
      <div
        role="tabpanel"
        id={`${id}-preview-panel`}
        aria-labelledby={`${id}-preview-tab`}
        hidden={mode !== "preview"}
        className="h-56 overflow-y-auto rounded-lg border border-input p-3"
      >
        {mode === "preview" &&
          (value.trim() === "" ? (
            <p className="text-sm text-muted-foreground">Nothing to preview</p>
          ) : (
            <MarkdownContent>{value}</MarkdownContent>
          ))}
      </div>
    </div>
  );
}
