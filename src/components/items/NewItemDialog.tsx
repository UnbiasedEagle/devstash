"use client";

import { Loader2, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createItem } from "@/actions/items";
import { requestUpload } from "@/actions/uploads";
import ItemFormFields, {
  validateItemForm,
  validateUploadItemForm,
  type FormErrors,
  type FormValues,
} from "@/components/items/ItemFormFields";
import ItemTypeSelector from "@/components/items/ItemTypeSelector";
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
  CREATABLE_ITEM_TYPES,
  isNewItemType,
  isUploadItemType,
  UPLOAD_ITEM_TYPES,
  uploadKindFor,
} from "@/lib/item-schemas";
import { showActionError } from "@/lib/show-action-error";
import {
  titleFromFileName,
  UPLOAD_FAILED_MESSAGE,
  UploadAbortedError,
  UploadFailedError,
  uploadFile,
  validateChosenFile,
} from "@/lib/upload-client";
import type { ItemTypeSummary } from "@/types/dashboard";
import type { CollectionOption } from "@/types/items";

const EMPTY_VALUES: FormValues = {
  type: "Snippet",
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  file: null,
  tags: [],
  collectionId: "",
};

const NEW_ITEM_TYPES = [...CREATABLE_ITEM_TYPES, ...UPLOAD_ITEM_TYPES];

const DISMISS_REASONS = ["outside-press", "escape-key"];

export default function NewItemDialog({
  itemTypes,
  collections,
  isPro,
}: {
  itemTypes: ItemTypeSummary[];
  collections: CollectionOption[];
  isPro: boolean;
}) {
  const { type: slug } = useParams<{ type?: string }>();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  // 0 to 100 while the chosen file is being sent, null the rest of the time
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isDirty =
    [values.title, values.description, values.content, values.url].some(
      (text) => text.trim() !== "",
    ) ||
    values.tags.length > 0 ||
    values.file !== null;

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function selectType(type: string) {
    if (!isNewItemType(type)) return;
    setValues((current) => ({
      ...current,
      type,
      // A file chosen for one kind may not be allowed for another
      file: current.type === type ? current.file : null,
      language:
        type === "Command" && !current.language ? "bash" : current.language,
    }));
    setErrors({});
  }

  function changeFile(file: File | null) {
    if (!file) {
      update("file", null);
      return;
    }
    const kind = isUploadItemType(values.type)
      ? uploadKindFor(values.type)
      : null;
    const error = kind ? validateChosenFile(kind, file) : undefined;
    if (error) {
      // The rejected file replaces the earlier choice, so what is shown is always what would be uploaded and the error never sits next to a different file
      setValues((current) => ({ ...current, file: null }));
      setErrors((current) => ({ ...current, file: [error] }));
      return;
    }
    setValues((current) => {
      // A title the user typed stays, but one that was only filled in from the previous file follows the new file
      const titleIsAutomatic =
        !current.title.trim() ||
        (current.file !== null &&
          current.title === titleFromFileName(current.file.name));
      return {
        ...current,
        file,
        title: titleIsAutomatic ? titleFromFileName(file.name) : current.title,
      };
    });
    setErrors((current) => ({ ...current, file: undefined, title: undefined }));
  }

  function openDialog() {
    const preselected = NEW_ITEM_TYPES.find(
      (name) => name.toLowerCase() === slug?.toLowerCase(),
    );
    const type = preselected ?? EMPTY_VALUES.type;
    setValues({
      ...EMPTY_VALUES,
      type,
      language: type === "Command" ? "bash" : "",
    });
    setErrors({});
    setOpen(true);
  }

  function handleOpenChange(
    nextOpen: boolean,
    details: { reason: string; cancel: () => void },
  ) {
    if (pending) return;
    // A stray tap outside or Escape would silently discard up to 50,000 characters or a chosen file, so only Cancel closes a filled-in form
    if (!nextOpen && isDirty && DISMISS_REASONS.includes(details.reason)) {
      details.cancel();
      return;
    }
    setOpen(nextOpen);
  }

  async function submitUpload() {
    const validation = validateUploadItemForm(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }
    const { type, meta, file } = validation.data;
    const controller = new AbortController();
    abortRef.current = controller;

    setPending(true);
    try {
      const target = await requestUpload({
        kind: uploadKindFor(type),
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });
      if (!target.success) {
        showActionError(target);
        return;
      }

      setProgress(0);
      await uploadFile({
        url: target.data.uploadUrl,
        contentType: target.data.contentType,
        file,
        onProgress: setProgress,
        signal: controller.signal,
      });
      setProgress(null);

      const result = await createItem({
        type,
        ...meta,
        fileKey: target.data.key,
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: target.data.contentType,
      });
      if (!result.success) {
        showActionError(result);
        return;
      }
      toast.success(`${result.data.type} created`);
      setOpen(false);
    } catch (error) {
      if (error instanceof UploadAbortedError) {
        toast.info("Upload cancelled");
      } else if (error instanceof UploadFailedError) {
        toast.error(UPLOAD_FAILED_MESSAGE);
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } finally {
      abortRef.current = null;
      setProgress(null);
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploadItemType(values.type)) {
      await submitUpload();
      return;
    }

    const validation = validateItemForm(values);
    if (validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setPending(true);
    try {
      const result = await createItem(validation.data);
      if (!result.success) {
        showActionError(result);
        return;
      }
      toast.success(`${result.data.type} created`);
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  const uploading = progress !== null;

  return (
    <>
      <Button
        className="max-sm:size-8 max-sm:px-0"
        aria-label="New Item"
        onClick={openDialog}
      >
        <Plus />
        <span className="max-sm:hidden">New Item</span>
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex h-[min(46rem,calc(100dvh-2rem))] max-w-xl flex-col">
          <DialogTitle>New item</DialogTitle>
          <DialogDescription className="[@media(max-height:34rem)]:sr-only">
            Save a snippet, prompt, command, note, link, image or file to your
            stash.
          </DialogDescription>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-4 flex min-h-0 flex-1 flex-col"
          >
            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1">
              <ItemTypeSelector
                itemTypes={itemTypes}
                value={values.type}
                disabled={pending}
                isPro={isPro}
                onChange={selectType}
              />
              <ItemFormFields
                values={values}
                errors={errors}
                collections={collections}
                disabled={pending}
                uploadProgress={progress}
                onChange={update}
                onFileChange={changeFile}
              />
            </div>

            <DialogFooter className="mt-3 max-sm:flex-row max-sm:*:flex-1">
              {uploading ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => abortRef.current?.abort()}
                >
                  Cancel upload
                </Button>
              ) : (
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                  disabled={pending}
                >
                  Cancel
                </DialogClose>
              )}
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                {uploading
                  ? `Uploading ${progress}%`
                  : pending
                    ? "Creating..."
                    : "Create item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
