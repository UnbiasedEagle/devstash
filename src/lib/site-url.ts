import "server-only";
import { z } from "zod";

// Reads only the one setting it needs, not all of `env.ts`, which checks every service's settings at once. A missing Stripe or R2 key must not take the landing page, the robots file and the sitemap down with it
const siteEnvSchema = z.object({ BETTER_AUTH_URL: z.url() });

// The address the site is served from, used to make links in page tags, the robots file and the sitemap absolute. Auth already needs it, so no new setting is added. The root layout imports this, so a missing or invalid address fails the build on purpose, the same as it already breaks sign-in
export const SITE_ORIGIN = new URL(
  siteEnvSchema.parse(process.env).BETTER_AUTH_URL,
).origin;
