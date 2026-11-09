// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ItemDrawerPicture } from "@/components/landing/ItemDrawerPicture";
import { SearchPicture } from "@/components/landing/SearchPicture";

afterEach(cleanup);

describe("SearchPicture", () => {
  it("groups the results under the kind of item they are, in order", () => {
    render(<SearchPicture />);

    const snippets = screen.getByText("Snippets");
    const notes = screen.getByText("Notes");
    const links = screen.getByText("Links");
    expect(snippets.compareDocumentPosition(notes)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(notes.compareDocumentPosition(links)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("underlines the word that matched in each result", () => {
    const { container } = render(<SearchPicture />);

    const matches = [...container.querySelectorAll("mark")].map(
      (mark) => mark.textContent,
    );
    expect(matches).toEqual(["Debounce", "throttle", "Debounc"]);
  });

  it("shows the query and where each result lives", () => {
    render(<SearchPicture />);

    expect(screen.getByText("debounce")).toBeVisible();
    expect(screen.getByText("React Patterns")).toBeVisible();
    expect(screen.getByText("Decisions")).toBeVisible();
  });

  it("hides itself and has no headings of its own, so it can't disturb the page's heading order", () => {
    const { container } = render(<SearchPicture />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("h1,h2,h3,h4,h5,h6")).toHaveLength(0);
  });
});

describe("ItemDrawerPicture", () => {
  it("shows the item's title, its code and a copy button", () => {
    const { container } = render(<ItemDrawerPicture />);

    expect(screen.getByText("useDebounce hook")).toBeVisible();
    expect(container.querySelector("pre")).toHaveTextContent(
      "useDebounce(value, ms)",
    );
    expect(container.querySelector("pre")).toHaveTextContent(
      "clearTimeout(id)",
    );
    expect(screen.getByText("Copy")).toBeVisible();
  });

  it("shows the tags and the collection the item is in", () => {
    render(<ItemDrawerPicture />);

    expect(screen.getByText("react")).toBeVisible();
    expect(screen.getByText("hooks")).toBeVisible();
    expect(screen.getByText("In React Patterns")).toBeVisible();
  });

  it("hides itself and has no headings of its own", () => {
    const { container } = render(<ItemDrawerPicture />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("h1,h2,h3,h4,h5,h6")).toHaveLength(0);
  });

  it("takes the position it is given, so the hero can layer it", () => {
    const { container } = render(<ItemDrawerPicture className="xl:absolute" />);

    expect(container.firstElementChild).toHaveClass("xl:absolute");
  });

  it("has a solid background, so a picture that overlaps it doesn't show through", () => {
    const { container } = render(<ItemDrawerPicture />);

    expect(container.firstElementChild).toHaveClass("bg-[#101216]");
  });
});
