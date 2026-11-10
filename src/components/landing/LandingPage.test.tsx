// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KindsRow } from "@/components/landing/KindsRow";
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
    // The item drawer, the search, the dashboard, the files and the collection (icons hide themselves too, so they are left out)
    expect(
      container.querySelectorAll('main [aria-hidden="true"]:not(svg)'),
    ).toHaveLength(5);
    expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "React Patterns" }),
    ).toBeNull();
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
