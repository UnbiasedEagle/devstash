// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KindsRow } from "@/components/landing/KindsRow";
import { PICTURE_BG } from "@/components/landing/classes";
import { LandingPage } from "@/components/landing/LandingPage";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { HEADLINE } from "@/lib/site-copy";

afterEach(cleanup);

describe("LandingPage", () => {
  it("has one main heading that says what the product does", () => {
    render(<LandingPage />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(HEADLINE);
  });

  it("sends every call to start to the sign-up page", () => {
    render(<LandingPage />);

    for (const name of ["Get started", "Start for free", "Start with Pro"]) {
      const links = screen.getAllByRole("link", { name });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links)
        expect(link).toHaveAttribute("href", "/sign-up");
    }
  });

  it("links sign in to the sign-in page and pricing to the plans on the page", () => {
    const { container } = render(<LandingPage />);

    const signIn = screen.getAllByRole("link", { name: "Sign in" });
    for (const link of signIn) expect(link).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "#pricing",
    );
    expect(container.querySelector("#pricing")).not.toBeNull();
  });

  it("tells visitors how many items the free plan holds, using the real limit", () => {
    render(<LandingPage />);

    expect(
      screen.getByText(
        `Free for up to ${FREE_ITEM_LIMIT} items. No card needed.`,
      ),
    ).toBeVisible();
  });

  it("describes the hero pictures for people who can't see them and hides the pictures themselves", () => {
    const { container } = render(<LandingPage />);

    expect(screen.getByText(/Example of DevStash/)).toHaveClass("sr-only");
    expect(screen.getByText(/The DevStash dashboard/)).toHaveClass("sr-only");
    // The item drawer, the search, the dashboard, the files, the Markdown editor, the collection, the pins and stars and the export (icons hide themselves too, so they are left out)
    expect(
      container.querySelectorAll('main [aria-hidden="true"]:not(svg)'),
    ).toHaveLength(8);
    expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "React Patterns" }),
    ).toBeNull();
  });

  it("gives each new picture a solid background and no headings of its own", () => {
    render(<LandingPage />);

    for (const name of [
      "Write notes and prompts in Markdown.",
      "Keep the daily ones close.",
      "Take it with you.",
    ]) {
      const section = screen
        .getByRole("heading", { name })
        .closest("section") as HTMLElement;
      const picture = section.querySelector(
        '[aria-hidden="true"]:not(svg)',
      ) as HTMLElement;
      expect(picture.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
      expect(picture.className).toContain(PICTURE_BG);
    }
  });

  it("shows the Markdown, favorites and export sections in order after the files and before the plans", () => {
    render(<LandingPage />);

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(
      headings.slice(headings.indexOf("Files and images, kept with the rest.")),
    ).toEqual([
      "Files and images, kept with the rest.",
      "Write notes and prompts in Markdown.",
      "Group it the way you work.",
      "Keep the daily ones close.",
      "Take it with you.",
      "Free until you outgrow it.",
      expect.any(String),
    ]);
  });

  it("keeps only tags in the collections list, since favorites and export have their own sections", () => {
    render(<LandingPage />);

    const collections = screen
      .getByRole("heading", { name: "Group it the way you work." })
      .closest("section") as HTMLElement;
    expect(collections).toHaveTextContent("Tags link every item");
    expect(collections).not.toHaveTextContent(/favorites|pins|export/i);
  });

  it("draws the pin and the star in the favorites picture", () => {
    const { container } = render(<LandingPage />);

    expect(container.querySelector("svg.lucide-pin")).not.toBeNull();
    expect(container.querySelector("svg.lucide-star")).not.toBeNull();
  });

  it("marks export as Pro and shows both the JSON and the ZIP choice", () => {
    render(<LandingPage />);

    expect(screen.getByText("Download JSON")).toBeInTheDocument();
    expect(screen.getByText("Download with files (ZIP)")).toBeInTheDocument();
    expect(
      screen.getByText("Export your data").parentElement,
    ).toHaveTextContent("Pro");
  });

  it("has a header, a main area and a footer", () => {
    render(<LandingPage />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});

describe("KindsRow", () => {
  it("lists all seven kinds of item", () => {
    render(<KindsRow />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Snippets",
      "Prompts",
      "Commands",
      "Notes",
      "Files",
      "Images",
      "Links",
    ]);
  });
});
