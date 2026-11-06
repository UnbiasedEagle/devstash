// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ quickSearch: vi.fn() }));
vi.mock("@/actions/search", () => ({ quickSearch: mocks.quickSearch }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

import SearchPalette from "@/components/search/SearchPalette";

describe("SearchPalette shortcuts", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mocks.quickSearch.mockResolvedValue({ success: true, data: [] });
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("opens on / when no field is focused", async () => {
    render(<SearchPalette />);

    fireEvent.keyDown(document.body, { key: "/" });

    expect(await screen.findByRole("combobox")).toBeInTheDocument();
  });

  it("ignores / typed into a text field", () => {
    render(
      <>
        <SearchPalette />
        <input aria-label="Name" />
      </>,
    );

    fireEvent.keyDown(screen.getByLabelText("Name"), { key: "/" });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("ignores / while another dialog is open so modals do not stack", () => {
    render(
      <>
        <SearchPalette />
        <div role="dialog" aria-label="Item drawer" />
      </>,
    );

    fireEvent.keyDown(document.body, { key: "/" });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("toggles once for Ctrl+K and ignores the repeats from holding the keys", async () => {
    render(<SearchPalette />);

    fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("combobox")).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "k", ctrlKey: true, repeat: true });
    fireEvent.keyDown(document.body, { key: "k", ctrlKey: true, repeat: true });

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
