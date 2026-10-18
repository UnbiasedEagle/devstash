import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { githubEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: {
    github: {
      clientId: githubEnv.GITHUB_CLIENT_ID,
      clientSecret: githubEnv.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [nextCookies()],
});
