// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  isItemFormDirty,
  validateItemForm,
  validateUploadItemForm,
  type FormValues,
} from "@/components/items/ItemFormFields";

const base: FormValues = {
  type: "Image",
  title: "Screenshot",
  description: "",
  content: "",
  language: "",
  url: "",
  file: null,
  tags: [],
  collectionId: "",
};

function fileOf(name: string, type: string, size?: number) {
  const file = new File(["x"], name, { type });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateItemForm for File and Image items", () => {
  it.each(["File", "Image"] as const)(
    "checks only the common fields of a %s item, since the file can't be edited",
    (type) => {
      const result = validateItemForm({
        ...base,
        type,
        title: "Renamed",
        description: "About it",
        tags: ["docs"],
        collectionId: "col-1",
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        type,
        title: "Renamed",
        description: "About it",
        tags: ["docs"],
        collectionId: "col-1",
      });
    },
  );

  it("asks for a title", () => {
    const result = validateItemForm({ ...base, title: "  " });

    expect(result.errors?.title?.[0]).toBe("Enter a title");
  });

  it("doesn't ask for content, which these items don't have", () => {
    const result = validateItemForm({ ...base, content: "" });

    expect(result.errors).toBeUndefined();
  });

  it("still asks for content from a note", () => {
    const result = validateItemForm({ ...base, type: "Note", content: "" });

    expect(result.errors?.content).toBeDefined();
  });
});

describe("validateUploadItemForm", () => {
  const png = fileOf("shot.png", "image/png");

  it("accepts a title and an allowed file", () => {
    const result = validateUploadItemForm({ ...base, file: png });

    expect(result.errors).toBeUndefined();
    expect(result.data).toMatchObject({
      type: "Image",
      file: png,
      meta: { title: "Screenshot", tags: [] },
    });
  });

  it("asks for a file", () => {
    const result = validateUploadItemForm(base);

    expect(result.errors?.file).toEqual(["Choose a file to upload"]);
  });

  it("reports a file the rules refuse, before anything is uploaded", () => {
    const result = validateUploadItemForm({
      ...base,
      file: fileOf("logo.svg", "image/svg+xml"),
    });

    expect(result.errors?.file?.[0]).toBe(
      "Choose a PNG, JPEG, GIF or WebP image",
    );
  });

  it("reports an oversize file with the limit", () => {
    const result = validateUploadItemForm({
      ...base,
      file: fileOf("big.png", "image/png", 6 * 1024 * 1024),
    });

    expect(result.errors?.file).toEqual(["Images can be at most 5 MB"]);
  });

  it("holds a file to the limit of its own kind", () => {
    const result = validateUploadItemForm({
      ...base,
      type: "File",
      file: fileOf("report.pdf", "application/pdf", 8 * 1024 * 1024),
    });

    expect(result.errors).toBeUndefined();
  });

  it("reports the file and the title together", () => {
    const result = validateUploadItemForm({ ...base, title: " " });

    expect(result.errors?.file).toBeDefined();
    expect(result.errors?.title).toBeDefined();
  });

  it("checks the title even when the file is fine", () => {
    const result = validateUploadItemForm({ ...base, title: " ", file: png });

    expect(result.errors?.title?.[0]).toBe("Enter a title");
    expect(result.errors?.file).toBeUndefined();
  });

  it("has nothing to check for a type that isn't an upload", () => {
    const result = validateUploadItemForm({ ...base, type: "Snippet" });

    expect(result).toEqual({ errors: {} });
  });
});

describe("isItemFormDirty", () => {
  it("counts a chosen file as a change", () => {
    expect(
      isItemFormDirty({ ...base, file: fileOf("a.png", "image/png") }, base),
    ).toBe(true);
  });

  it("is clean when nothing differs", () => {
    expect(isItemFormDirty(base, base)).toBe(false);
  });
});
