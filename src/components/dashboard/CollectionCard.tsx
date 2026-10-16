import Link from "next/link";
import { Star } from "lucide-react";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { itemTypes, type Collection } from "@/lib/mock-data";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const types = itemTypes.filter((type) =>
    collection.itemTypeIds.includes(type.id),
  );

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25 focus-visible:outline-2"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 opacity-70 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: collection.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{collection.name}</h3>
        {collection.isFavorite && (
          <Star
            aria-label="Favorite"
            className="mt-1 size-3.5 shrink-0 fill-yellow-500 text-yellow-500"
          />
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {collection.description}
      </p>
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
    </Link>
  );
}
