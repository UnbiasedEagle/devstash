import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { sendEmail } from "@/lib/email";
import { consumeEmailQuota } from "@/lib/email-quota";
import {
  existingAccountEmail,
  githubSignInEmail,
  resetPasswordEmail,
  verificationEmail,
} from "@/lib/email-templates";
import { authEnv, flagsEnv, githubEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sanitizeImage, sanitizeName } from "@/lib/user-sanitize";

export const auth = betterAuth({
  secret: authEnv.BETTER_AUTH_SECRET,
  baseURL: authEnv.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // The default in-memory storage is per serverless instance, so limits would barely apply
  rateLimit: {
    storage: "database",
    // Not covered by the built-in strict rules, and it accepts password guesses
    customRules: { "/delete-user": { window: 60, max: 3 } },
  },
  user: {
    deleteUser: {
      enabled: true,
      // Verification tokens and rate limit counters have no foreign key, so they don't cascade with the user
      afterDelete: async (user) => {
        try {
          await prisma.verification.deleteMany({ where: { value: user.id } });
          await prisma.rateLimit.deleteMany({
            where: { key: { endsWith: `:${user.id}` } },
          });
        } catch (error) {
          console.error("Failed to clean up after account deletion", error);
        }
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            name: sanitizeName(user.name) || user.email.split("@")[0],
            image: sanitizeImage(user.image),
          },
        }),
      },
      update: {
        before: async (user) => {
          const name = user.name === undefined ? undefined : sanitizeName(user.name);
          return {
            data: {
              ...user,
              ...(name ? { name } : {}),
              ...(user.image === undefined
                ? {}
                : { image: sanitizeImage(user.image) }),
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: flagsEnv.EMAIL_VERIFICATION_ENABLED,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      after(async () => {
        try {
          if (!(await consumeEmailQuota(`reset-password:${user.id}`))) return;

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
          if (!(await consumeEmailQuota(`existing-account:${user.id}`))) return;

          const signInUrl = new URL("/sign-in", authEnv.BETTER_AUTH_URL);
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
    sendOnSignUp: flagsEnv.EMAIL_VERIFICATION_ENABLED,
    sendOnSignIn: flagsEnv.EMAIL_VERIFICATION_ENABLED,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Better Auth appends link errors to the callback URL, so it must be a page that shows them
      const link = new URL(url);
      link.searchParams.set("callbackURL", "/sign-in");
      const { subject, html } = verificationEmail(user.name, link.toString());
      // Sent after the response so timing doesn't reveal whether an account exists, while keeping the function alive on serverless
      after(async () => {
        try {
          if (!(await consumeEmailQuota(`verification:${user.id}`))) return;
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
