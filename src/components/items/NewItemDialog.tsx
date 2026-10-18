"use client";

import { Loader2, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createItem } from "@/actions/items";
import ItemTypeSelector from "@/components/items/ItemTypeSelector";
import TagInput from "@/components/items/TagInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CREATABLE_ITEM_TYPES,
  isCreatableItemType,
  type CreatableItemType,
  createItemSchema,
  ITEM_LANGUAGES,
  MAX_CONTENT_LENGTH,
} from "@/lib/item-schemas";
import type { ItemTypeSummary } from "@/types/dashboard";

const CodeEditor = dynamic(() => import("@/components/items/CodeEditor"), {
  ssr: false,
  loading: () => <Skeleton className="h-56 rounded-lg" />,
});

interface FormValues {
  type: CreatableItemType;
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string[];
}

type FormErrors = Partial<Record<string, string[]>>;

const EMPTY_VALUES: FormValues = {
  type: "Snippet",
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: [],
};

const CODE_TYPES = ["Snippet", "Command"];
const DISMISS_REASONS = ["outside-press", "escape-key"];
const FIELD_ORDER = ["title", "description", "url", "content", "tags"] as const;

function buildInput(values: FormValues) {
  const common = {
    type: values.type,
    title: values.title,
    description: values.description || undefined,
    tags: values.tags,
  };
  if (values.type === "URL") return { ...common, url: values.url };
  if (CODE_TYPES.includes(values.type)) {
    return {
      ...common,
      content: values.content,
      language: values.language || undefined,
    };
  }
  return { ...common, content: values.content };
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function NewItemDialog({
  itemTypes,
}: {
  itemTypes: ItemTypeSummary[];
}) {
  const { type: slug } = useParams<{ type?: string }>();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);

  const isUrl = values.type === "URL";
  const isCode = CODE_TYPES.includes(values.type);
  const isDirty =
    [values.title, values.description, values.content, values.url].some(
      (text) => text.trim() !== "",
    ) || values.tags.length > 0;

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function selectType(type: string) {
    if (!isCreatableItemType(type)) return;
    setValues((current) => ({
      ...current,
      type,
      language:
        type === "Command" && !current.language ? "bash" : current.language,
    }));
    setErrors({});
  }

  function openDialog() {
    const preselected = CREATABLE_ITEM_TYPES.find(
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
    // A stray tap outside or Escape would silently discard up to 50,000 characters, so only Cancel closes a filled-in form
    if (!nextOpen && isDirty && DISMISS_REASONS.includes(details.reason)) {
      details.cancel();
      return;
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createItemSchema.safeParse(buildInput(values));
    if (!parsed.success) {
      const fieldErrors: FormErrors = z.flattenError(parsed.error).fieldErrors;
      setErrors(fieldErrors);
      const firstInvalid = FIELD_ORDER.find((name) => fieldErrors[name]);
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }

    setPending(true);
    try {
      const result = await createItem(parsed.data);
      if (!result.success) {
        toast.error(result.error);
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

  function describe(name: keyof FormValues) {
    return errors[name]?.[0];
  }

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
            Save a snippet, prompt, command, note or link to your stash.
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
                onChange={selectType}
              />

              <Field id="title" label="Title" error={describe("title")}>
                <Input
                  id="title"
                  value={values.title}
                  autoComplete="off"
                  aria-invalid={describe("title") ? true : undefined}
                  aria-describedby={
                    describe("title") ? "title-error" : undefined
                  }
                  onChange={(event) => update("title", event.target.value)}
                />
              </Field>

              <Field
                id="description"
                label="Description (optional)"
                error={describe("description")}
              >
                <Input
                  id="description"
                  value={values.description}
                  autoComplete="off"
                  aria-invalid={describe("description") ? true : undefined}
                  aria-describedby={
                    describe("description") ? "description-error" : undefined
                  }
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </Field>

              {isUrl ? (
                <Field id="url" label="URL" error={describe("url")}>
                  <Input
                    id="url"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={values.url}
                    autoComplete="off"
                    aria-invalid={describe("url") ? true : undefined}
                    aria-describedby={describe("url") ? "url-error" : undefined}
                    onChange={(event) => update("url", event.target.value)}
                  />
                </Field>
              ) : (
                <>
                  {isCode && (
                    <Field id="language" label="Language (optional)">
                      <select
                        id="language"
                        value={values.language}
                        className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:*:bg-popover"
                        onChange={(event) =>
                          update("language", event.target.value)
                        }
                      >
                        <option value="">Plain text</option>
                        {ITEM_LANGUAGES.filter(
                          (language) => language !== "plaintext",
                        ).map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field
                    id="content"
                    label="Content"
                    error={describe("content")}
                  >
                    {isCode ? (
                      <CodeEditor
                        id="content"
                        label="Content"
                        value={values.content}
                        language={values.language}
                        invalid={Boolean(describe("content"))}
                        describedBy={
                          describe("content") ? "content-error" : undefined
                        }
                        onChange={(content) => update("content", content)}
                      />
                    ) : (
                      <Textarea
                        id="content"
                        value={values.content}
                        className="h-56 resize-none"
                        // Slack above the schema limit so going over it shows the validation message instead of silently truncating
                        maxLength={MAX_CONTENT_LENGTH + 1000}
                        aria-invalid={describe("content") ? true : undefined}
                        aria-describedby={
                          describe("content") ? "content-error" : undefined
                        }
                        onChange={(event) =>
                          update("content", event.target.value)
                        }
                      />
                    )}
                  </Field>
                </>
              )}

              <Field id="tags" label="Tags (optional)" error={describe("tags")}>
                <TagInput
                  id="tags"
                  value={values.tags}
                  invalid={Boolean(describe("tags"))}
                  describedBy={describe("tags") ? "tags-error" : undefined}
                  onChange={(tags) => update("tags", tags)}
                />
              </Field>
            </div>

            <DialogFooter className="mt-3 max-sm:flex-row max-sm:*:flex-1">
              <DialogClose
                render={<Button type="button" variant="outline" />}
                disabled={pending}
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                {pending ? "Creating..." : "Create item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
