// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PricingSection } from "@/components/landing/PricingSection";
import {
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  PRO_MONTHLY_PRICE,
  PRO_YEARLY_PRICE,
  PRO_YEARLY_SAVINGS,
} from "@/lib/plan-limits";
import { formatSizeLimit, MAX_UPLOAD_BYTES } from "@/lib/upload-rules";

afterEach(cleanup);

function plan(name: string) {
  return within(screen.getByRole("region", { name }));
}

describe("PricingSection", () => {
  it("states the free plan's limits from the same numbers the app enforces", () => {
    render(<PricingSection />);

    expect(plan("Free").getByText(`${FREE_ITEM_LIMIT} items`)).toBeVisible();
    expect(
      plan("Free").getByText(`${FREE_COLLECTION_LIMIT} collections`),
    ).toBeVisible();
    expect(plan("Free").getByText("$0")).toBeVisible();
  });

  it("states the Pro prices from the same numbers as the plan card", () => {
    render(<PricingSection />);

    expect(
      plan("Pro").getByText(`$${PRO_MONTHLY_PRICE}`, { exact: false }),
    ).toBeVisible();
    expect(
      plan("Pro").getByText(
        `Or $${PRO_YEARLY_PRICE} a year, which saves $${PRO_YEARLY_SAVINGS}.`,
      ),
    ).toBeVisible();
  });

  it("works out the yearly saving instead of stating a number that could be wrong", () => {
    expect(PRO_YEARLY_SAVINGS).toBe(PRO_MONTHLY_PRICE * 12 - PRO_YEARLY_PRICE);
    expect(PRO_YEARLY_SAVINGS).toBeGreaterThan(0);
  });

  it("lists only features that exist today, with the real upload limit", () => {
    render(<PricingSection />);

    const pro = plan("Pro");
    expect(pro.getByText("Unlimited items and collections")).toBeVisible();
    expect(
      pro.getByText(
        `File uploads up to ${formatSizeLimit(MAX_UPLOAD_BYTES.file)}`,
      ),
    ).toBeVisible();
    expect(
      pro.getByText(
        `Image uploads up to ${formatSizeLimit(MAX_UPLOAD_BYTES.image)}`,
      ),
    ).toBeVisible();
    expect(plan("Free").queryByText(/uploads/i)).toBeNull();
    expect(pro.getByText("Custom item types")).toBeVisible();
    expect(
      pro.getByText("Export as JSON or ZIP with your files"),
    ).toBeVisible();
    expect(screen.queryByText(/\bAI\b/)).toBeNull();
    expect(screen.queryByText(/import/i)).toBeNull();
  });

  it("sends both plans to sign-up, the free one as a plain start and the Pro one as Pro", () => {
    render(<PricingSection />);

    expect(
      plan("Free").getByRole("link", { name: "Start for free" }),
    ).toHaveAttribute("href", "/sign-up");
    expect(
      plan("Pro").getByRole("link", { name: "Start with Pro" }),
    ).toHaveAttribute("href", "/sign-up");
  });

  it("can be jumped to from the header and keeps room above it", () => {
    const { container } = render(<PricingSection />);

    const section = container.querySelector("#pricing");
    expect(section).not.toBeNull();
    expect(section).toHaveClass("scroll-mt-6");
  });
});
