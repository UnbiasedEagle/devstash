// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import UsageCard from "@/components/profile/UsageCard";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import type { Profile } from "@/types/profile";

afterEach(cleanup);

const profile: Profile = {
  isPro: false,
  memberSince: new Date("2026-01-01T00:00:00Z"),
  emailVerified: true,
  signInMethods: ["credential"],
  itemCount: 12,
  collectionCount: 2,
};

describe("UsageCard", () => {
  it("shows the free plan limits next to the counts", () => {
    render(<UsageCard profile={profile} />);

    expect(screen.getByText("Your free plan limits.")).toBeInTheDocument();
    expect(screen.getByText(`of ${FREE_ITEM_LIMIT}`)).toBeInTheDocument();
    expect(screen.getByText(`of ${FREE_COLLECTION_LIMIT}`)).toBeInTheDocument();
  });

  it("shows unlimited usage and no limits for a Pro user", () => {
    render(<UsageCard profile={{ ...profile, isPro: true }} />);

    expect(
      screen.getByText("Unlimited items and collections on Pro."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^of \d+$/)).not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
