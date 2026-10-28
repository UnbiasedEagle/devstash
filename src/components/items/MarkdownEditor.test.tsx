// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import MarkdownEditor from "@/components/items/MarkdownEditor";

function Editor({ value, error }: { value: string; error?: string[] }) {
  return (
    <MarkdownEditor id="content" value={value} error={error}>
      <textarea id="content" aria-label="Content" defaultValue={value} />
    </MarkdownEditor>
  );
}

function renderEditor(value: string, error?: string[]) {
  return render(<Editor value={value} error={error} />);
}

async function openPreview() {
  await userEvent.click(screen.getByRole("tab", { name: "Preview" }));
}

describe("MarkdownEditor", () => {
  afterEach(cleanup);

  it("renders the Markdown in the preview tab", async () => {
    renderEditor("# Heading\n\n**bold** text");

    await openPreview();

    expect(
      await screen.findByRole("heading", { name: "Heading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("keeps the editor mounted while previewing so unsaved text isn't lost", async () => {
    renderEditor("draft");
    await userEvent.type(screen.getByLabelText("Content"), " more");

    await openPreview();
    await userEvent.click(screen.getByRole("tab", { name: "Write" }));

    expect(screen.getByLabelText("Content")).toHaveValue("draft more");
  });

  it("applies the same sanitizing as the drawer", async () => {
    renderEditor(
      "[bad](javascript:alert(1)) [good](https://example.com)\n\n![x](https://example.com/x.png)\n\n<script>alert(1)</script>",
    );

    await openPreview();

    expect(await screen.findByRole("link", { name: "good" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });

  it("shows a placeholder instead of an empty preview", async () => {
    renderEditor("   ");

    await openPreview();

    expect(screen.getByText("Nothing to preview")).toBeInTheDocument();
  });

  it("shows only the active panel and marks the active tab selected", async () => {
    renderEditor("text");
    const write = screen.getByRole("tab", { name: "Write" });
    const preview = screen.getByRole("tab", { name: "Preview" });
    expect(write).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Content")).toBeVisible();

    await userEvent.click(preview);

    expect(preview).toHaveAttribute("aria-selected", "true");
    expect(write).toHaveAttribute("aria-selected", "false");
    expect(screen.getByLabelText("Content")).not.toBeVisible();
  });

  it("puts only the active tab in the tab order and moves with the arrow keys", async () => {
    renderEditor("text");
    const write = screen.getByRole("tab", { name: "Write" });
    const preview = screen.getByRole("tab", { name: "Preview" });
    expect(write).toHaveAttribute("tabindex", "0");
    expect(preview).toHaveAttribute("tabindex", "-1");

    write.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(preview).toHaveFocus();
    expect(preview).toHaveAttribute("aria-selected", "true");
    expect(preview).toHaveAttribute("tabindex", "0");
    expect(write).toHaveAttribute("tabindex", "-1");

    await userEvent.keyboard("{Home}");
    expect(write).toHaveFocus();
    expect(write).toHaveAttribute("aria-selected", "true");
  });

  it("returns to the editor and focuses it when validation fails during a preview", async () => {
    const { rerender } = renderEditor("");
    await openPreview();
    expect(screen.getByLabelText("Content")).not.toBeVisible();

    rerender(<Editor value="" error={["Content is required"]} />);

    expect(screen.getByLabelText("Content")).toBeVisible();
    expect(screen.getByLabelText("Content")).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("returns to the editor again when the same error is reported twice", async () => {
    const { rerender } = renderEditor("", ["Content is required"]);
    await openPreview();

    rerender(<Editor value="" error={["Content is required"]} />);

    expect(screen.getByLabelText("Content")).toBeVisible();
  });
});
