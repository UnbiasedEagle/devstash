import Link from "next/link";
import CollectionFavoriteButton from "@/components/collections/CollectionFavoriteButton";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardCollection } from "@/types/dashboard";

interface CollectionCardProps {
  collection: DashboardCollection;
}

export function CollectionCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col rounded-xl border border-border bg-card p-5"
    >
      <Skeleton className="h-6 w-2/5" />
      <Skeleton className="mt-2 h-5 w-4/5" />
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <Skeleton className="size-6" />
          <Skeleton className="size-6" />
        </div>
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const types = collection.itemTypes;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25 has-[a:focus-visible]:outline-2">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: collection.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold">
          <Link
            href={`/collections/${collection.id}`}
            title={collection.name}
            className="outline-none after:absolute after:inset-0"
          >
            {collection.name}
          </Link>
        </h3>
        <CollectionFavoriteButton
          id={collection.id}
          name={collection.name}
          isFavorite={collection.isFavorite}
          className="relative z-10 -mr-2 -mt-1.5 shrink-0"
        />
      </div>
      {collection.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {collection.description}
        </p>
      )}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {types.map((type) => {
            const Icon = ITEM_TYPE_ICONS[type.icon];
            return (
              <span
                key={type.id}
                title={type.name}
                className="flex size-6 items-center justify-center rounded-md"
                style={{ backgroundColor: `${type.color}1f` }}
              >
                <Icon className="size-3.5" style={{ color: type.color }} />
              </span>
            );
          })}
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {collection.itemCount} items
        </span>
      </div>
    </div>
  );
}
