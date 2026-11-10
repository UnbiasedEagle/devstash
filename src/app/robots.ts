import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-url";

// The pages behind sign-in (the same ones the proxy protects) and the API. They show nothing to a crawler and shouldn't turn up in search results
export const PRIVATE_PATHS = [
  "/dashboard",
  "/profile",
  "/items",
  "/collections",
  "/search",
  "/tags",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  // A preview deployment is a copy for checking changes, not the site. Crawlers find these addresses in pull requests, and they shouldn't compete with the real one
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
