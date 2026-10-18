import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  existingAccountEmail,
  githubSignInEmail,
  resetPasswordEmail,
  verificationEmail,
} from "@/lib/email-templates";
import { githubEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_RESET_EMAILS_PER_HOUR = 3;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      after(async () => {
        try {
          // The resend cooldown only exists in the browser, so cap emails per user here too
          const recentRequests = await prisma.verification.count({
            where: {
              value: user.id,
              identifier: { startsWith: "reset-password:" },
              createdAt: { gt: new Date(Date.now() - ONE_HOUR_MS) },
            },
          });
          if (recentRequests > MAX_RESET_EMAILS_PER_HOUR) return;

          const credentialAccount = await prisma.account.findFirst({
            where: { userId: user.id, providerId: "credential" },
            select: { id: true },
          });
          const { subject, html } = credentialAccount
            ? resetPasswordEmail(user.name, url)
            : githubSignInEmail(
                user.name,
                new URL("/sign-in", new URL(url).origin).toString(),
              );
          await sendEmail({ to: user.email, subject, html });
        } catch (error) {
          console.error("Failed to send password reset email", error);
        }
      });
    },
    // Better Auth answers duplicate sign-ups with a fake success, so this email is the only signal the owner gets
    onExistingUserSignUp: async ({ user }) => {
      after(async () => {
        try {
          const signInUrl = new URL("/sign-in", process.env.BETTER_AUTH_URL);
          const { subject, html } = existingAccountEmail(
            user.name,
            signInUrl.toString(),
          );
          await sendEmail({ to: user.email, subject, html });
        } catch (error) {
          console.error("Failed to send existing account email", error);
        }
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Better Auth appends link errors to the callback URL, so it must be a page that shows them
      const link = new URL(url);
      link.searchParams.set("callbackURL", "/sign-in");
      const { subject, html } = verificationEmail(user.name, link.toString());
      // Sent after the response so timing doesn't reveal whether an account exists, while keeping the function alive on serverless
      after(async () => {
        try {
          await sendEmail({ to: user.email, subject, html });
        } catch (error) {
          console.error("Failed to send verification email", error);
        }
      });
    },
  },
  account: {
    accountLinking: { enabled: true },
  },
  socialProviders: {
    github: {
      clientId: githubEnv.GITHUB_CLIENT_ID,
      clientSecret: githubEnv.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [nextCookies()],
});
