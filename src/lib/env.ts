import { z } from "zod";

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
});

const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

const githubEnvSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

const flagsEnvSchema = z.object({
  EMAIL_VERIFICATION_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export const authEnv = authEnvSchema.parse(process.env);
export const redisEnv = redisEnvSchema.parse(process.env);
export const githubEnv = githubEnvSchema.parse(process.env);
export const flagsEnv = flagsEnvSchema.parse(process.env);

// Fails the deploy instead of silently shipping unverified sign-ups. VERCEL_ENV, not NODE_ENV, because previews also run with NODE_ENV=production
if (
  process.env.VERCEL_ENV === "production" &&
  !flagsEnv.EMAIL_VERIFICATION_ENABLED
) {
  throw new Error("EMAIL_VERIFICATION_ENABLED cannot be false in production");
}
export const emailEnv = emailEnvSchema.parse(process.env);
