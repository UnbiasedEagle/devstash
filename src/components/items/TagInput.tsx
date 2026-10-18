"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { MAX_TAG_LENGTH, MAX_TAGS } from "@/lib/item-schemas";
import { getTagColor } from "@/lib/tag-colors";

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
}

export default function TagInput({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const isFull = value.length >= MAX_TAGS;

  function addTags(raw: string) {
    let next = value;
    for (const part of raw.split(",")) {
      const tag = part.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
      if (tag && next.length < MAX_TAGS && !next.includes(tag)) {
        next = [...next, tag];
      }
    }
    setDraft("");
    if (next !== value) onChange(next);
  }

  function handleDraftChange(text: string) {
    if (text.includes(",")) addTags(text);
    else setDraft(text);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags(draft);
    } else if (event.key === "Backspace" && draft === "") {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      aria-invalid={invalid || undefined}
      className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 py-0.5 pr-1 pl-2 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/60"
        >
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: getTagColor(tag) }}
          />
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            className="flex size-4 items-center justify-center rounded-sm outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onChange(value.filter((item) => item !== tag))}
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        readOnly={isFull}
        placeholder={
          isFull ? `Maximum of ${MAX_TAGS} tags` : "Type a tag, press Enter"
        }
        aria-describedby={describedBy}
        className="min-w-32 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground read-only:cursor-not-allowed"
        onChange={(event) => handleDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTags(draft)}
      />
    </div>
  );
}
