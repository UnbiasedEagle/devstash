export type SignInMethod = "credential" | "github";

export interface Profile {
  isPro: boolean;
  memberSince: Date;
  emailVerified: boolean;
  signInMethods: SignInMethod[];
  itemCount: number;
  collectionCount: number;
}
