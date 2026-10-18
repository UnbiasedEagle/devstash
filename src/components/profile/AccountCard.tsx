import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/user-initials";
import type { Profile, SignInMethod } from "@/types/profile";

interface AccountCardProps {
  user: { name: string; email: string; image?: string | null };
  profile: Profile;
}

const SIGN_IN_METHOD_LABELS: Record<SignInMethod, string> = {
  credential: "Email and password",
  github: "GitHub",
};

const pillClass =
  "rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground";

const memberSinceFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function AccountCardSkeleton() {
  return (
    <section
      aria-hidden
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
    </section>
  );
}

export default function AccountCard({ user, profile }: AccountCardProps) {
  return (
    <section
      aria-label="Account"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="text-lg font-medium text-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {user.name}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="truncate">{user.email}</span>
            {profile.emailVerified && (
              <span className="flex shrink-0 items-center gap-1 text-emerald-500">
                <BadgeCheck className="size-4" aria-hidden />
                Verified
              </span>
            )}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="mt-1">
            <span className={pillClass}>{profile.isPro ? "Pro" : "Free"}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Member since</dt>
          <dd className="mt-1">
            {memberSinceFormat.format(profile.memberSince)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sign-in methods</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {profile.signInMethods.map((method) => (
              <span key={method} className={pillClass}>
                {SIGN_IN_METHOD_LABELS[method]}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
