// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TagChip from "@/components/items/TagChip";

afterEach(cleanup);

function renderChip(tag: string, linked?: boolean) {
  render(
    <ul>
      <TagChip tag={tag} linked={linked} />
    </ul>,
  );
}

describe("TagChip", () => {
  it("is plain text unless linked", () => {
    renderChip("react");
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links to the encoded tag page with an accessible label", () => {
    renderChip("c++/c#", true);
    const link = screen.getByRole("link", { name: "Tag: c++/c#" });
    expect(link).toHaveAttribute("href", "/tags/c%2B%2B%2Fc%23");
  });

  it("keeps the visible text inside the accessible name", () => {
    renderChip("react", true);
    const link = screen.getByRole("link", { name: "Tag: react" });
    expect(link).toHaveTextContent("react");
  });
});
