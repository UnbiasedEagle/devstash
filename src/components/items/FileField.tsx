"use client";

import { FileText, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  acceptedExtensions,
  formatFileSize,
  UPLOAD_HINTS,
  type UploadKind,
} from "@/lib/upload-rules";

interface FileFieldProps {
  id: string;
  kind: UploadKind;
  file: File | null;
  error?: string;
  disabled?: boolean;
  // 0 to 100 while the file is being sent, null otherwise
  progress: number | null;
  onChange: (file: File | null) => void;
}

// Progress is read out in quarters so a screen reader isn't talked over on every percent
const ANNOUNCE_STEP = 25;

export default function FileField({
  id,
  kind,
  file,
  error,
  disabled,
  progress,
  onChange,
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  // Which button takes focus once the file changes. The one that was pressed is replaced by the other, so without this focus would fall back to the page
  const focusAfterChange = useRef<"choose" | "remove" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const noun = kind === "image" ? "image" : "file";

  useEffect(() => {
    const target = focusAfterChange.current;
    focusAfterChange.current = null;
    if (target === "remove") removeRef.current?.focus();
    if (target === "choose") chooseRef.current?.focus();
  }, [file]);

  function choose(next: File | undefined) {
    if (next) {
      focusAfterChange.current = "remove";
      onChange(next);
    }
    // The same file can be chosen again after it was removed or rejected
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) choose(event.dataTransfer.files[0]);
  }

  return (
    <div
      id={id}
      role="group"
      tabIndex={-1}
      aria-labelledby={labelId}
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      className="flex flex-col gap-1.5 outline-none"
    >
      <span id={labelId} className="text-sm leading-none font-medium">
        {kind === "image" ? "Image" : "File"}
      </span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          // Moving over a child fires a leave on the zone too, which would make the highlight flicker
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-dashed border-input p-4 transition-colors",
          isDragging && "border-ring bg-accent/40",
          error && "border-destructive",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          tabIndex={-1}
          aria-hidden
          accept={acceptedExtensions(kind).join(",")}
          disabled={disabled}
          className="hidden"
          onChange={(event) => choose(event.target.files?.[0])}
        />

        {file ? (
          <div className="flex items-center gap-3">
            <FileText
              aria-hidden
              className="size-5 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              ref={removeRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove file"
              disabled={disabled}
              onClick={() => {
                focusAfterChange.current = "choose";
                onChange(null);
              }}
            >
              <X />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Upload aria-hidden className="size-5 text-muted-foreground" />
            <p className="flex-1 text-sm text-muted-foreground">
              Drag a {noun} here or
            </p>
            <Button
              ref={chooseRef}
              id={`${id}-choose`}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Choose {noun}
            </Button>
          </div>
        )}

        {progress !== null && (
          <progress
            value={progress}
            max={100}
            aria-label="Upload progress"
            className="h-2 w-full accent-primary"
          />
        )}
        <p role="status" className="sr-only">
          {progress === null
            ? ""
            : `Uploading ${Math.floor(progress / ANNOUNCE_STEP) * ANNOUNCE_STEP}%`}
        </p>
      </div>

      <p id={hintId} className="text-xs text-muted-foreground">
        {UPLOAD_HINTS[kind]}
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
