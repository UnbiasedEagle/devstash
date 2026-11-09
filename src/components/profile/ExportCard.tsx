import { ExportDownloadButton } from "@/components/profile/ExportDownloadButton";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ExportCardSkeleton() {
  return (
    <section
      aria-hidden
      className="rounded-xl border border-border bg-card p-5"
    >
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <Skeleton className="mt-5 h-8 w-36" />
    </section>
  );
}

export function ExportCard({ isPro }: { isPro: boolean }) {
  return (
    <ProfileSection
      title="Export your data"
      description="Download your items, collections and tags as one JSON file. Uploaded files aren't included, only their names."
    >
      {isPro ? (
        <ExportDownloadButton />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Export is a Pro feature.
          </p>
          <a href="#plan" className={buttonVariants({ variant: "outline" })}>
            Upgrade
          </a>
        </div>
      )}
    </ProfileSection>
  );
}
