"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { importItems } from "@/actions/import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkImportFile,
  IMPORT_ACCEPT,
  IMPORT_ERRORS,
  importTargetLabel,
  MAX_IMPORT_FILES,
  type ImportCheck,
} from "@/lib/import-rules";
import { MAX_CONTENT_LENGTH } from "@/lib/item-schemas";
import { showActionError } from "@/lib/show-action-error";
import { cn } from "@/lib/utils";

// A character takes at most 4 bytes in UTF-8, so a bigger file can't fit and isn't read at all
const MAX_FILE_BYTES = MAX_CONTENT_LENGTH * 4;
const TOO_MANY = `Only ${MAX_IMPORT_FILES} files can be imported at once`;
// Room for some files that will be left out, but not for hundreds to be read into memory
const MAX_LISTED_FILES = MAX_IMPORT_FILES * 2;

interface ChosenFile {
  id: number;
  fileName: string;
  content: string;
  check: ImportCheck;
}

async function readFile(file: File, id: number): Promise<ChosenFile> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      id,
      fileName: file.name,
      content: "",
      check: { ok: false, error: IMPORT_ERRORS.tooLong },
    };
  }
  const content = await file.text();
  return {
    id,
    fileName: file.name,
    content,
    check: checkImportFile({ fileName: file.name, content }),
  };
}

// Files beyond the limit are listed with a reason, in the order they were chosen
function withLimit(files: ChosenFile[]) {
  let accepted = 0;
  return files.map((file) => {
    if (!file.check.ok) return { file, error: file.check.error };
    accepted += 1;
    return accepted > MAX_IMPORT_FILES
      ? { file, error: TOO_MANY }
      : { file, error: null };
  });
}

export default function ImportDialog() {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  // Bumped when the dialog closes, so files that were still being read for the old session are dropped
  const session = useRef(0);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<ChosenFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pending, setPending] = useState(false);

  const rows = withLimit(files);
  const importable = rows.filter((row) => row.error === null);

  function handleOpenChange(nextOpen: boolean) {
    if (pending) return;
    if (!nextOpen) {
      session.current += 1;
      setFiles([]);
    }
    setOpen(nextOpen);
  }

  async function choose(list: FileList | null) {
    const chosen = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (chosen.length === 0) return;
    const room = Math.max(0, MAX_LISTED_FILES - files.length);
    if (chosen.length > room) {
      toast.info(`Only ${MAX_LISTED_FILES} files can be listed at a time`);
    }
    const started = session.current;
    const read = await Promise.all(
      chosen.slice(0, room).map((file) => readFile(file, nextId.current++)),
    );
    if (started === session.current) {
      setFiles((current) => [...current, ...read]);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!pending) void choose(event.dataTransfer.files);
  }

  async function handleImport() {
    setPending(true);
    try {
      const result = await importItems({
        files: importable.map(({ file }) => ({
          fileName: file.fileName,
          content: file.content,
        })),
      });
      if (!result.success) {
        showActionError(result);
        return;
      }
      const count = result.data.imported;
      toast.success(`Imported ${count} ${count === 1 ? "item" : "items"}`);
      setFiles([]);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  const hintId = `${fieldId}-hint`;
  const count = importable.length;
  const leftOut = rows.length - count;
  const summary =
    rows.length === 0
      ? ""
      : `${count} ${count === 1 ? "file" : "files"} can be imported` +
        (leftOut > 0 ? `, ${leftOut} left out` : "");

  return (
    <>
      <Button
        variant="outline"
        className="max-sm:size-8 max-sm:px-0"
        aria-label="Import"
        onClick={() => setOpen(true)}
      >
        <Upload />
        <span className="max-sm:hidden">Import</span>
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Import files</DialogTitle>
          <DialogDescription>
            Turn text and code files into Notes and Snippets.
          </DialogDescription>

          <div
            role="group"
            aria-labelledby={`${fieldId}-label`}
            aria-describedby={hintId}
            className="mt-4 flex flex-col gap-1.5"
          >
            <span
              id={`${fieldId}-label`}
              className="text-sm leading-none font-medium"
            >
              Files
            </span>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                if (!pending) setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-input p-4 transition-colors",
                isDragging && "border-ring bg-accent/40",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                tabIndex={-1}
                aria-hidden
                accept={IMPORT_ACCEPT}
                disabled={pending}
                className="hidden"
                onChange={(event) => void choose(event.target.files)}
              />
              <Upload aria-hidden className="size-5 text-muted-foreground" />
              <p className="flex-1 text-sm text-muted-foreground">
                Drag files here or
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                Choose files
              </Button>
            </div>
            <p id={hintId} className="text-xs text-muted-foreground">
              Markdown, text and code files, up to {MAX_IMPORT_FILES} at a time
            </p>
          </div>

          <p role="status" className="sr-only">
            {summary}
          </p>

          {rows.length > 0 && (
            <ul
              aria-label="Chosen files"
              className="mt-4 flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border"
            >
              {rows.map(({ file, error }) => (
                <li key={file.id} className="flex items-center gap-3 p-3">
                  <FileText
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {file.fileName}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        error ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {error ??
                        (file.check.ok
                          ? importTargetLabel(file.check.target)
                          : "")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${file.fileName}`}
                    disabled={pending}
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((item) => item.id !== file.id),
                      )
                    }
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter className="mt-4 max-sm:flex-row max-sm:*:flex-1">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={pending}
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              disabled={pending || count === 0}
              onClick={handleImport}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {pending
                ? "Importing..."
                : `Import ${count} ${count === 1 ? "file" : "files"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
