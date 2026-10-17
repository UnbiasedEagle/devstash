import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types/dashboard";

interface StatsCardsProps {
  stats: DashboardStats;
}

const STAT_COUNT = 4;
const LEGEND_PLACEHOLDER_COUNT = 7;

export function StatsCardsSkeleton() {
  return (
    <section
      aria-hidden
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="grid grid-cols-2 divide-border max-lg:divide-y lg:grid-cols-4 lg:divide-x">
        {Array.from({ length: STAT_COUNT }, (_, index) => (
          <div key={index} className="px-5 py-4 max-lg:odd:border-r">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-1 h-9 w-12" />
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-4">
        <Skeleton className="h-2 rounded-full" />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {Array.from({ length: LEGEND_PLACEHOLDER_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-5 w-16" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function StatsCards({ stats: data }: StatsCardsProps) {
  const itemTypes = data.itemTypeCounts;
  const stats = [
    { label: "Items", value: data.totalItems },
    { label: "Collections", value: data.totalCollections },
    { label: "Favorite items", value: data.favoriteItems },
    { label: "Favorite collections", value: data.favoriteCollections },
  ];

  return (
    <section
      aria-label="Stash overview"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <dl className="grid grid-cols-2 divide-border max-lg:divide-y lg:grid-cols-4 lg:divide-x">
        {stats.map(({ label, value }) => (
          <div key={label} className="px-5 py-4 max-lg:odd:border-r">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-border px-5 py-4">
        <div
          role="img"
          aria-label="Items by type"
          className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted"
        >
          {itemTypes
            .filter((type) => type.count > 0)
            .map((type) => (
              <div
                key={type.id}
                className="min-w-1"
                style={{ flexGrow: type.count, backgroundColor: type.color }}
              />
            ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {itemTypes.map((type) => (
            <li key={type.id} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.name}
              <span className="tabular-nums text-foreground/70">
                {type.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
