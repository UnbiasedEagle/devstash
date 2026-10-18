import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <section
      aria-hidden
      className="rounded-xl border border-border bg-card p-5"
    >
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-5 max-w-sm space-y-4">
        <Skeleton className="h-9" />
        <Skeleton className="h-8 w-24" />
      </div>
    </section>
  );
}
