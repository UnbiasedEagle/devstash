// @vitest-environment jsdom
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { contentLengthLimit } from "@/components/items/CodeEditor";
import { MAX_CONTENT_LENGTH } from "@/lib/item-schemas";

const SLACK = 1000;

function editorWith(doc: string) {
  return EditorState.create({ doc, extensions: [contentLengthLimit] });
}

describe("contentLengthLimit", () => {
  it("lets content go past the schema limit so the validation message can show", () => {
    const state = editorWith("a".repeat(MAX_CONTENT_LENGTH));

    const next = state.update({
      changes: { from: state.doc.length, insert: "b".repeat(SLACK) },
    }).state;

    expect(next.doc.length).toBe(MAX_CONTENT_LENGTH + SLACK);
  });

  it("refuses an edit that would go past the limit with slack", () => {
    const state = editorWith("a".repeat(MAX_CONTENT_LENGTH + SLACK));

    const next = state.update({
      changes: { from: state.doc.length, insert: "b" },
    }).state;

    expect(next.doc.length).toBe(MAX_CONTENT_LENGTH + SLACK);
  });

  it("still allows deleting once over the limit", () => {
    const state = editorWith("a".repeat(MAX_CONTENT_LENGTH + SLACK));

    const next = state.update({ changes: { from: 0, to: 10 } }).state;

    expect(next.doc.length).toBe(MAX_CONTENT_LENGTH + SLACK - 10);
  });
});
