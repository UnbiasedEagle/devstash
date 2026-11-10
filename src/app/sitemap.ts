import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-url";

// Only the landing page is public; everything else is behind sign-in
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_ORIGIN}/`, changeFrequency: "monthly", priority: 1 }];
}
