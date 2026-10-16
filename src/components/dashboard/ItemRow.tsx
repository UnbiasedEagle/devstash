import { Pin, Star } from "lucide-react";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { itemTypes, type Item } from "@/lib/mock-data";

interface ItemRowProps {
  item: Item;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export default function ItemRow({ item }: ItemRowProps) {
  const type = itemTypes.find((t) => t.id === item.itemTypeId);
  const Icon = type ? ITEM_TYPE_ICONS[type.icon] : undefined;

  return (
    <li className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/60">
      <span
        title={type?.name}
        className="flex size-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: type ? `${type.color}1f` : undefined }}
      >
        {Icon && <Icon className="size-4" style={{ color: type?.color }} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-mono text-sm font-medium">
            {item.title}
          </h3>
          {item.isPinned && (
            <Pin
              aria-label="Pinned"
              className="size-3 shrink-0 text-muted-foreground"
            />
          )}
          {item.isFavorite && (
            <Star
              aria-label="Favorite"
              className="size-3 shrink-0 fill-yellow-500 text-yellow-500"
            />
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {item.description}
        </p>
      </div>
      <ul className="hidden gap-1.5 md:flex">
        {item.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
          >
            {tag}
          </li>
        ))}
      </ul>
      <time
        className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
        dateTime={item.updatedAt}
      >
        {dateFormatter.format(new Date(item.updatedAt))}
      </time>
    </li>
  );
}
