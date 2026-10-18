import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Profile, SignInMethod } from "@/types/profile";

const SIGN_IN_METHODS: readonly string[] = ["credential", "github"];

function isSignInMethod(providerId: string): providerId is SignInMethod {
  return SIGN_IN_METHODS.includes(providerId);
}

export const getProfile = cache(async (userId: string): Promise<Profile> => {
  const [user, itemCount, collectionCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        isPro: true,
        createdAt: true,
        emailVerified: true,
        accounts: { select: { providerId: true } },
      },
    }),
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);

  return {
    isPro: user.isPro,
    memberSince: user.createdAt,
    emailVerified: user.emailVerified,
    signInMethods: user.accounts
      .map((account) => account.providerId)
      .filter(isSignInMethod),
    itemCount,
    collectionCount,
  };
});
