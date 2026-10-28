"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { z } from "zod";
import MarkdownEditor from "@/components/items/MarkdownEditor";
import TagInput from "@/components/items/TagInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createItemSchema,
  ITEM_LANGUAGES,
  type CreatableItemType,
  type CreateItemInput,
} from "@/lib/item-schemas";

const CodeEditor = dynamic(() => import("@/components/items/CodeEditor"), {
  ssr: false,
  loading: () => <Skeleton className="h-56 rounded-lg" />,
});

export interface FormValues {
  type: CreatableItemType;
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string[];
}

export type FormErrors = Partial<Record<string, string[]>>;

const CODE_TYPES = ["Snippet", "Command"];
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

export function isItemFormDirty(values: FormValues, initial: FormValues) {
  return (
    values.title.trim() !== initial.title.trim() ||
    values.description.trim() !== initial.description.trim() ||
    values.content.trim() !== initial.content.trim() ||
    values.url.trim() !== initial.url.trim() ||
    values.language !== initial.language ||
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
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
}

export default function ItemFormFields({
  values,
  errors,
  onChange,
}: ItemFormFieldsProps) {
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
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:*:bg-popover"
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
    </>
  );
}
