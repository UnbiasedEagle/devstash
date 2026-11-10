import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.BETTER_AUTH_URL = "https://getdevstash.com/some/path";
});
vi.mock("@/components/landing/LandingPage", () => ({
  LandingPage: () => null,
}));

import { metadata } from "@/app/page";
import robots, { PRIVATE_PATHS } from "@/app/robots";
import sitemap from "@/app/sitemap";
import { config } from "@/proxy";
import { FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { HEADLINE, PAGE_TITLE } from "@/lib/site-copy";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the landing page's words", () => {
  it("make a page title from the headline, so the two can't drift apart", () => {
    const fromHeadline = `${HEADLINE.charAt(0).toLowerCase()}${HEADLINE.slice(1, -1)}`;

    expect(PAGE_TITLE).toBe(`DevStash: ${fromHeadline}`);
  });
});

describe("the landing page's metadata", () => {
  it("has the shared title and a description that fits in a search result", () => {
    expect(metadata.title).toBe(PAGE_TITLE);
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).length).toBeLessThanOrEqual(160);
  });

  it("states the free plan's limit from the same number as the page", () => {
    expect(metadata.description).toContain(`${FREE_ITEM_LIMIT} items`);
  });

  it("has the Open Graph fields a link preview needs", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "DevStash",
      url: "/",
      title: metadata.title,
      description: metadata.description,
    });
  });

  it("asks for a large image card and repeats the title and description", () => {
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
    });
  });

  it("names the page itself as its address, so a copy under another address isn't a duplicate", () => {
    expect(metadata.alternates).toEqual({ canonical: "/" });
  });
});

describe("robots", () => {
  it("lets crawlers read the landing page and keeps the private pages and the API out", () => {
    const { rules } = robots();

    expect(rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    });
    expect(PRIVATE_PATHS).toEqual([
      "/dashboard",
      "/profile",
      "/items",
      "/collections",
      "/search",
      "/tags",
      "/api/",
    ]);
  });

  it("keeps out every page the proxy protects, so the two lists can't drift apart", () => {
    const protectedPaths = config.matcher
      .filter((path) => path !== "/")
      .map((path) => path.replace("/:path*", ""));

    expect(protectedPaths.length).toBeGreaterThan(0);
    for (const path of protectedPaths) {
      expect(PRIVATE_PATHS).toContain(path);
    }
  });

  it("points to the sitemap at the site's own address", () => {
    expect(robots().sitemap).toBe("https://getdevstash.com/sitemap.xml");
  });

  it("keeps crawlers out of a preview deployment altogether and points them nowhere", () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("is the normal file on production", () => {
    vi.stubEnv("VERCEL_ENV", "production");

    expect(robots().rules).toMatchObject({ allow: "/" });
    expect(robots().sitemap).toBeDefined();
  });
});

describe("sitemap", () => {
  it("lists only the landing page", () => {
    expect(sitemap()).toEqual([
      {
        url: "https://getdevstash.com/",
        changeFrequency: "monthly",
        priority: 1,
      },
    ]);
  });
});
