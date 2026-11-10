import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSessionCookie: vi.fn() }));

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: mocks.getSessionCookie,
}));

import { config, proxy } from "@/proxy";

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function redirectedTo(response: Response) {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

describe("proxy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("the landing page", () => {
    it("sends a signed-in visitor to the dashboard before any page is sent", () => {
      mocks.getSessionCookie.mockReturnValue("token");

      const response = proxy(request("/"));

      expect(response.status).toBe(307);
      expect(redirectedTo(response)).toBe("/dashboard");
    });

    it("lets a visitor without a session cookie see it", () => {
      mocks.getSessionCookie.mockReturnValue(null);

      const response = proxy(request("/"));

      expect(redirectedTo(response)).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  describe("the pages behind sign-in", () => {
    it("sends a visitor without a session cookie to sign in", () => {
      mocks.getSessionCookie.mockReturnValue(null);

      expect(redirectedTo(proxy(request("/dashboard")))).toBe("/sign-in");
      expect(redirectedTo(proxy(request("/items/snippet")))).toBe("/sign-in");
    });

    it("lets a visitor with a session cookie through", () => {
      mocks.getSessionCookie.mockReturnValue("token");

      const response = proxy(request("/dashboard"));

      expect(redirectedTo(response)).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    });
  });

  it("runs for the landing page and every page behind sign-in, and for nothing else", () => {
    expect(config.matcher).toEqual([
      "/",
      "/dashboard/:path*",
      "/profile/:path*",
      "/items/:path*",
      "/collections/:path*",
      "/search/:path*",
      "/tags/:path*",
      "/types/:path*",
    ]);
  });
});
