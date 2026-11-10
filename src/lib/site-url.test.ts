import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// If this module reached for the full env file, a missing Stripe or R2 key would stop the landing page, the robots file and the sitemap
vi.mock("@/lib/env", () => {
  throw new Error("site-url must not load the full env file");
});

async function load() {
  vi.resetModules();
  return import("@/lib/site-url");
}

describe("SITE_ORIGIN", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is the origin of the auth address, without its path or trailing slash", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://getdevstash.com/some/path/");

    expect((await load()).SITE_ORIGIN).toBe("https://getdevstash.com");
  });

  it("keeps a port, as in development", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");

    expect((await load()).SITE_ORIGIN).toBe("http://localhost:3000");
  });

  it("works with only the auth address set, none of the other services' settings", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://getdevstash.com");
    for (const name of ["STRIPE_SECRET_KEY", "R2_BUCKET", "RESEND_API_KEY"]) {
      vi.stubEnv(name, "");
    }

    await expect(load()).resolves.toMatchObject({
      SITE_ORIGIN: "https://getdevstash.com",
    });
  });

  it("fails when the address is missing or isn't a URL", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "not a url");

    await expect(load()).rejects.toThrow();
  });
});
