// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ItemTypeSelector from "@/components/items/ItemTypeSelector";
import type { ItemTypeSummary } from "@/types/dashboard";

afterEach(cleanup);

const itemTypes: ItemTypeSummary[] = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "File",
  "Image",
  "URL",
].map((name) => ({ id: name, name, icon: "Code", color: "#3b82f6" }));

function setup(isPro: boolean, onChange = vi.fn()) {
  render(
    <ItemTypeSelector
      itemTypes={itemTypes}
      value="Snippet"
      isPro={isPro}
      onChange={onChange}
    />,
  );
  return onChange;
}

function radio(name: string) {
  return screen.getByRole("radio", { name: new RegExp(`^${name}`) });
}

describe("ItemTypeSelector", () => {
  it("lets every type be picked, files and images included", () => {
    setup(false);

    for (const { name } of itemTypes) {
      expect(radio(name)).toBeEnabled();
    }
  });

  it("marks File as Pro for a free user and leaves Image unmarked", () => {
    setup(false);

    expect(within(radio("File")).getByText("Pro")).toBeInTheDocument();
    expect(within(radio("Image")).queryByText("Pro")).not.toBeInTheDocument();
  });

  it("shows no Pro badge to a Pro user", () => {
    setup(true);

    expect(screen.queryByText("Pro")).not.toBeInTheDocument();
  });

  it("reports the type that was picked", async () => {
    const onChange = setup(false);

    await userEvent.click(radio("Image"));

    expect(onChange).toHaveBeenCalledWith("Image");
  });
});
