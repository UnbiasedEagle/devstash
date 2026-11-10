// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "@/app/page";
import { HEADLINE } from "@/lib/site-copy";

afterEach(cleanup);

describe("the home page", () => {
  it("shows the landing page", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: HEADLINE,
      }),
    ).toBeVisible();
  });
});
