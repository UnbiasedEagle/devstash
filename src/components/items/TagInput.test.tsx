// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import TagInput from "@/components/items/TagInput";
import { MAX_TAGS } from "@/lib/item-schemas";

function Harness({ initial = [] }: { initial?: string[] }) {
  const [tags, setTags] = useState(initial);
  return <TagInput id="tags" value={tags} onChange={setTags} />;
}

function chips() {
  return screen
    .queryAllByRole("button", { name: /^Remove tag / })
    .map((button) =>
      button.getAttribute("aria-label")?.replace("Remove tag ", ""),
    );
}

function input() {
  return screen.getByRole("textbox");
}

afterEach(cleanup);

describe("TagInput", () => {
  it("adds a lowercased tag on Enter", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), "React{Enter}");

    expect(chips()).toEqual(["react"]);
    expect(input()).toHaveValue("");
  });

  it("adds a tag when a comma is typed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), "hooks,");

    expect(chips()).toEqual(["hooks"]);
  });

  it("ignores duplicates and empty input", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), "react{Enter}React{Enter}   {Enter}");

    expect(chips()).toEqual(["react"]);
  });

  it("removes the last tag with Backspace on an empty draft", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a", "b"]} />);

    await user.click(input());
    await user.keyboard("{Backspace}");

    expect(chips()).toEqual(["a"]);
  });

  it("does not remove a tag while the draft has text", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a"]} />);

    await user.type(input(), "x{Backspace}");

    expect(chips()).toEqual(["a"]);
  });

  it("removes a tag with its remove button", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a", "b", "c"]} />);

    await user.click(screen.getByRole("button", { name: "Remove tag b" }));

    expect(chips()).toEqual(["a", "c"]);
  });

  it("splits pasted comma-separated tags and skips duplicates", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a"]} />);

    await user.click(input());
    await user.paste("A, b ,c,,b");

    expect(chips()).toEqual(["a", "b", "c"]);
  });

  it("becomes read-only at the maximum and keeps focus so Backspace still works", async () => {
    const user = userEvent.setup();
    const initial = Array.from(
      { length: MAX_TAGS - 1 },
      (_, index) => `t${index}`,
    );
    render(<Harness initial={initial} />);

    await user.type(input(), "last{Enter}");

    expect(chips()).toHaveLength(MAX_TAGS);
    expect(input()).toHaveAttribute("readonly");
    expect(input()).toHaveAttribute(
      "placeholder",
      `Maximum of ${MAX_TAGS} tags`,
    );

    await user.type(input(), "more{Enter}");
    expect(chips()).toHaveLength(MAX_TAGS);

    input().focus();
    await user.keyboard("{Backspace}");
    expect(chips()).toHaveLength(MAX_TAGS - 1);
    expect(input()).not.toHaveAttribute("readonly");
  });

  it("commits the draft when the field loses focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), "draft");
    await user.tab();

    expect(chips()).toEqual(["draft"]);
  });
});
