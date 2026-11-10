// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuthShell } from "@/components/auth/AuthShell";

afterEach(cleanup);

describe("AuthShell", () => {
  it("sends the logo, on both the wide and the narrow layout, to the landing page", () => {
    render(
      <AuthShell>
        <p>Sign in form</p>
      </AuthShell>,
    );

    const logos = screen.getAllByRole("link", { name: "DevStash home" });
    expect(logos).toHaveLength(2);
    for (const logo of logos) {
      expect(logo).toHaveAttribute("href", "/");
    }
    expect(screen.getByText("Sign in form")).toBeInTheDocument();
  });
});
