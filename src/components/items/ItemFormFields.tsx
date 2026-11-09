"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { z } from "zod";
import FileField from "@/components/items/FileField";
import MarkdownEditor from "@/components/items/MarkdownEditor";
import TagInput from "@/components/items/TagInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createItemSchema,
  isUploadItemType,
  itemMetaSchema,
  ITEM_LANGUAGES,
  uploadKindFor,
  type CreateItemInput,
  type NewItemType,
  type UploadItemType,
} from "@/lib/item-schemas";
import { validateChosenFile } from "@/lib/upload-client";
import type { CollectionOption } from "@/types/items";

const CodeEditor = dynamic(() => import("@/components/items/CodeEditor"), {
  ssr: false,
  loading: () => <Skeleton className="h-56 rounded-lg" />,
});

export interface FormValues {
  type: NewItemType;
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  // The file chosen for a File or Image item, not yet uploaded
  file: File | null;
  tags: string[];
  collectionId: string;
}

export type FormErrors = Partial<Record<string, string[]>>;

const CODE_TYPES = ["Snippet", "Command"];
const FIELD_ORDER = [
  "file",
  "title",
  "description",
  "url",
  "content",
  "tags",
] as const;
const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:*:bg-popover";

function buildInput(values: FormValues) {
  const common = {
    type: values.type,
    title: values.title,
    description: values.description || undefined,
    tags: values.tags,
    collectionId: values.collectionId || undefined,
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

type FormValidation =
  | { data: CreateItemInput; errors?: undefined }
  | { errors: FormErrors; data?: undefined };

export function validateItemForm(values: FormValues): FormValidation {
  const parsed = createItemSchema.safeParse(buildInput(values));
  if (parsed.success) return { data: parsed.data };

  const errors: FormErrors = z.flattenError(parsed.error).fieldErrors;
  const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
  if (firstInvalid) document.getElementById(firstInvalid)?.focus();
  return { errors };
}

interface UploadFormData {
  type: UploadItemType;
  meta: z.infer<typeof itemMetaSchema>;
  file: File;
}

type UploadFormValidation =
  | { data: UploadFormData; errors?: undefined }
  | { errors: FormErrors; data?: undefined };

// A File or Image item is checked in two steps: the file against the shared rules here, and the item itself on the server once the file is uploaded
export function validateUploadItemForm(
  values: FormValues,
): UploadFormValidation {
  if (!isUploadItemType(values.type)) return { errors: {} };

  const parsed = itemMetaSchema.safeParse({
    title: values.title,
    description: values.description || undefined,
    tags: values.tags,
    collectionId: values.collectionId || undefined,
  });
  const errors: FormErrors = parsed.success
    ? {}
    : z.flattenError(parsed.error).fieldErrors;

  if (!values.file) {
    errors.file = ["Choose a file to upload"];
  } else {
    const fileError = validateChosenFile(
      uploadKindFor(values.type),
      values.file,
    );
    if (fileError) errors.file = [fileError];
  }

  const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
  if (firstInvalid) {
    document.getElementById(firstInvalid)?.focus();
    return { errors };
  }
  if (!parsed.success || !values.file) return { errors };
  return {
    data: { type: values.type, meta: parsed.data, file: values.file },
  };
}

export function isItemFormDirty(values: FormValues, initial: FormValues) {
  return (
    values.file !== initial.file ||
    values.title.trim() !== initial.title.trim() ||
    values.description.trim() !== initial.description.trim() ||
    values.content.trim() !== initial.content.trim() ||
    values.url.trim() !== initial.url.trim() ||
    values.language !== initial.language ||
    values.collectionId !== initial.collectionId ||
    values.tags.join("\n") !== initial.tags.join("\n")
  );
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

interface ItemFormFieldsProps {
  values: FormValues;
  errors: FormErrors;
  collections: CollectionOption[];
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  // Only the new item dialog creates File and Image items, so only it passes these
  onFileChange?: (file: File | null) => void;
  uploadProgress?: number | null;
  disabled?: boolean;
}

export default function ItemFormFields({
  values,
  errors,
  collections,
  onChange,
  onFileChange,
  uploadProgress = null,
  disabled,
}: ItemFormFieldsProps) {
  const uploadType = isUploadItemType(values.type) ? values.type : null;
  const isUrl = values.type === "URL";
  const isCode = CODE_TYPES.includes(values.type);

  function describe(name: keyof FormValues) {
    return errors[name]?.[0];
  }

  const editor = (
    <CodeEditor
      id="content"
      label="Content"
      value={values.content}
      language={isCode ? values.language : "markdown"}
      invalid={Boolean(describe("content"))}
      describedBy={describe("content") ? "content-error" : undefined}
      onChange={(content) => onChange("content", content)}
    />
  );

  return (
    <>
      {/* Only a form that can take the file shows the field, so the edit form can never end up with one that does nothing */}
      {uploadType && onFileChange && (
        <FileField
          id="file"
          kind={uploadKindFor(uploadType)}
          file={values.file}
          error={describe("file")}
          disabled={disabled}
          progress={uploadProgress}
          onChange={(file) => onFileChange?.(file)}
        />
      )}

      <Field id="title" label="Title" error={describe("title")}>
        <Input
          id="title"
          value={values.title}
          autoComplete="off"
          aria-invalid={describe("title") ? true : undefined}
          aria-describedby={describe("title") ? "title-error" : undefined}
          onChange={(event) => onChange("title", event.target.value)}
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
          onChange={(event) => onChange("description", event.target.value)}
        />
      </Field>

      {uploadType ? null : isUrl ? (
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
            onChange={(event) => onChange("url", event.target.value)}
          />
        </Field>
      ) : (
        <>
          {isCode && (
            <Field id="language" label="Language (optional)">
              <select
                id="language"
                value={values.language}
                className={SELECT_CLASS}
                onChange={(event) => onChange("language", event.target.value)}
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
          <Field id="content" label="Content" error={describe("content")}>
            {isCode ? (
              editor
            ) : (
              <MarkdownEditor
                id="content"
                value={values.content}
                error={errors.content}
              >
                {editor}
              </MarkdownEditor>
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
          onChange={(tags) => onChange("tags", tags)}
        />
      </Field>

      {collections.length > 0 && (
        <Field id="collection" label="Collection (optional)">
          <select
            id="collection"
            value={values.collectionId}
            className={SELECT_CLASS}
            onChange={(event) => onChange("collectionId", event.target.value)}
          >
            <option value="">None</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}
