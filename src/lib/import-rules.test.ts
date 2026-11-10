import { describe, expect, it } from "vitest";
import {
  checkImportFile,
  IMPORT_ERRORS,
  importTargetFor,
  importTitle,
  MAX_IMPORT_FILE_NAME_LENGTH,
} from "@/lib/import-rules";
import {
  ITEM_LANGUAGES,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/item-schemas";

describe("importTargetFor", () => {
  it.each(["a.md", "a.markdown", "a.txt"])("makes %s a Note", (name) => {
    expect(importTargetFor(name)).toEqual({ type: "Note" });
  });

  it.each([
    ["a.ts", "typescript"],
    ["a.tsx", "typescript"],
    ["a.js", "javascript"],
    ["a.jsx", "javascript"],
    ["a.mjs", "javascript"],
    ["a.cjs", "javascript"],
    ["a.py", "python"],
    ["a.sh", "bash"],
    ["a.bash", "bash"],
    ["a.json", "json"],
    ["a.html", "html"],
    ["a.htm", "html"],
    ["a.css", "css"],
    ["a.sql", "sql"],
    ["a.go", "go"],
    ["a.rs", "rust"],
    ["a.java", "java"],
  ])("makes %s a Snippet in %s", (name, language) => {
    expect(importTargetFor(name)).toEqual({ type: "Snippet", language });
  });

  it("ignores the letter case of the extension", () => {
    expect(importTargetFor("README.MD")).toEqual({ type: "Note" });
    expect(importTargetFor("Main.PY")).toEqual({
      type: "Snippet",
      language: "python",
    });
  });

  it("only looks at the last extension", () => {
    expect(importTargetFor("archive.md.zip")).toBeNull();
    expect(importTargetFor("notes.v2.md")).toEqual({ type: "Note" });
  });

  it.each(["photo.png", "archive.zip", "Makefile", "noextension", "trailing."])(
    "refuses %s",
    (name) => {
      expect(importTargetFor(name)).toBeNull();
    },
  );

  it("only uses languages the item form knows", () => {
    for (const name of ["a.ts", "a.py", "a.sh", "a.rs", "a.htm"]) {
      const target = importTargetFor(name);
      expect(target?.type).toBe("Snippet");
      if (target?.type === "Snippet") {
        expect(ITEM_LANGUAGES).toContain(target.language);
      }
    }
  });
});

describe("importTitle", () => {
  it("drops only the last extension", () => {
    expect(importTitle("notes.v2.md")).toBe("notes.v2");
    expect(importTitle("deploy.sh")).toBe("deploy");
  });

  it("falls back to the whole name when nothing is left", () => {
    expect(importTitle(".md")).toBe(".md");
    expect(importTitle("  .txt")).toBe(".txt");
  });

  it("cuts a long title to the title limit", () => {
    expect(importTitle(`${"a".repeat(300)}.md`)).toHaveLength(MAX_TITLE_LENGTH);
  });
});

describe("checkImportFile", () => {
  it("accepts a file and returns its target, title and trimmed text", () => {
    expect(
      checkImportFile({ fileName: "setup.sh", content: "\n  npm i  \n" }),
    ).toEqual({
      ok: true,
      target: { type: "Snippet", language: "bash" },
      title: "setup",
      content: "npm i",
    });
  });

  it("refuses an unsupported type before looking at the text", () => {
    expect(checkImportFile({ fileName: "a.png", content: "" })).toEqual({
      ok: false,
      error: IMPORT_ERRORS.unsupported,
    });
  });

  it("refuses text with a null character as binary", () => {
    expect(checkImportFile({ fileName: "a.txt", content: "ab\0cd" })).toEqual({
      ok: false,
      error: IMPORT_ERRORS.binary,
    });
  });

  it("refuses a file with nothing but whitespace", () => {
    expect(checkImportFile({ fileName: "a.md", content: " \n\t " })).toEqual({
      ok: false,
      error: IMPORT_ERRORS.empty,
    });
  });

  it("allows the longest text and refuses one character more", () => {
    const longest = "a".repeat(MAX_CONTENT_LENGTH);

    expect(checkImportFile({ fileName: "a.md", content: longest }).ok).toBe(
      true,
    );
    expect(
      checkImportFile({ fileName: "a.md", content: `${longest}a` }),
    ).toEqual({ ok: false, error: IMPORT_ERRORS.tooLong });
  });

  it("measures the length after trimming", () => {
    const padded = ` ${"a".repeat(MAX_CONTENT_LENGTH)} `;

    expect(checkImportFile({ fileName: "a.md", content: padded }).ok).toBe(
      true,
    );
  });

  it("refuses a file name with a null character, which would become the title", () => {
    expect(checkImportFile({ fileName: "a\0b.md", content: "x" })).toEqual({
      ok: false,
      error: IMPORT_ERRORS.badName,
    });
  });

  it("refuses a file name over the limit", () => {
    const fileName = `${"a".repeat(MAX_IMPORT_FILE_NAME_LENGTH)}.md`;

    expect(checkImportFile({ fileName, content: "x" })).toEqual({
      ok: false,
      error: IMPORT_ERRORS.nameTooLong,
    });
  });
});
