import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/dashboard/DashboardShell", () => ({
  default: () => null,
}));
vi.mock("@/components/dashboard/Sidebar", () => ({ default: () => null }));
vi.mock("@/components/dashboard/TopBar", () => ({ default: () => null }));
vi.mock("@/components/auth/AuthShell", () => ({ AuthShell: () => null }));

import { metadata as authMetadata } from "@/app/(auth)/layout";
import { metadata as workspaceMetadata } from "@/app/(workspace)/layout";
import { NO_INDEX } from "@/lib/no-index";

describe("keeping private pages out of search results", () => {
  it("asks search engines not to index", () => {
    expect(NO_INDEX).toEqual({ robots: { index: false } });
  });

  it("applies to every page behind sign-in", () => {
    expect(workspaceMetadata).toBe(NO_INDEX);
  });

  it("applies to the sign-in and sign-up pages and the rest of the account pages", () => {
    expect(authMetadata).toBe(NO_INDEX);
  });
});
