import { ProfileSection } from "@/components/profile/ProfileSection";
import { Skeleton } from "@/components/ui/skeleton";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

interface UsageCardProps {
  profile: Profile;
}

interface UsageRowProps {
  label: string;
  count: number;
  limit: number | null;
}

function UsageRow({ label, count, limit }: UsageRowProps) {
  const atLimit = limit !== null && count >= limit;

  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-semibold",
          atLimit && "text-destructive",
        )}
      >
        {count}
        {limit !== null && (
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            of {limit}
          </span>
        )}
      </dd>
    </div>
  );
}

export function UsageCardSkeleton() {
  return (
    <section
      aria-hidden
      className="rounded-xl border border-border bg-card p-5"
    >
      <Skeleton className="h-6 w-20" />
      <div className="mt-5 grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function UsageCard({ profile }: UsageCardProps) {
  return (
    <ProfileSection
      title="Usage"
      description={profile.isPro ? undefined : "Your free plan limits."}
    >
      <dl className="grid grid-cols-2 gap-4">
        <UsageRow
          label="Items"
          count={profile.itemCount}
          limit={profile.isPro ? null : FREE_ITEM_LIMIT}
        />
        <UsageRow
          label="Collections"
          count={profile.collectionCount}
          limit={profile.isPro ? null : FREE_COLLECTION_LIMIT}
        />
      </dl>
    </ProfileSection>
  );
}
