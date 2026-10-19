import ItemFlagIcons from "@/components/items/ItemFlagIcons";
import ItemLink from "@/components/items/ItemLink";
import TagChip from "@/components/items/TagChip";
import { Skeleton } from "@/components/ui/skeleton";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { formatRelativeTime } from "@/lib/relative-time";
import type { ListItem } from "@/types/items";

interface ItemCardProps {
  item: ListItem;
  now: number;
  href: string;
}

const VISIBLE_TAG_COUNT = 3;
const CODE_TYPES = ["Snippet", "Command"];

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function ItemPreview({ item }: { item: ListItem }) {
  if (item.contentType === "URL" && item.url) {
    return (
      <p className="truncate font-mono text-xs text-muted-foreground">
        {getHostname(item.url)}
      </p>
    );
  }
  if (item.contentType === "FILE" && item.fileName) {
    return (
      <p className="truncate font-mono text-xs text-muted-foreground">
        {item.fileName}
      </p>
    );
  }
  if (item.contentPreview && CODE_TYPES.includes(item.itemType.name)) {
    return (
      <pre className="line-clamp-4 overflow-hidden rounded-md bg-muted/50 p-2.5 font-mono text-xs break-all whitespace-pre-wrap text-muted-foreground">
        {item.contentPreview}
      </pre>
    );
  }
  return null;
}

export function ItemCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0" />
        <Skeleton className="h-5 w-2/5" />
      </div>
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-14" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export default function ItemCard({ item, now, href }: ItemCardProps) {
  const type = item.itemType;
  const Icon = ITEM_TYPE_ICONS[type.icon];
  const visibleTags = item.tags.slice(0, VISIBLE_TAG_COUNT);
  const hiddenTagCount = item.tags.length - visibleTags.length;

  return (
    <article className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${type.color}1f` }}
        >
          {Icon && <Icon className="size-4" style={{ color: type.color }} />}
        </span>
        <h2 className="min-w-0 flex-1 truncate font-mono text-sm font-medium">
          <ItemLink
            id={`item-${item.id}`}
            preview={{
              id: item.id,
              title: item.title,
              description: item.description,
              tags: item.tags,
              itemType: item.itemType,
            }}
            href={href}
            scroll={false}
            className="outline-none after:absolute after:inset-0"
          >
            <span className="sr-only">{type.name}: </span>
            {item.title}
          </ItemLink>
        </h2>
        <ItemFlagIcons
          id={item.id}
          saved={{ isFavorite: item.isFavorite, isPinned: item.isPinned }}
        />
      </header>

      {item.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>
      )}

      <ItemPreview item={item} />

      <footer className="mt-auto flex items-center justify-between gap-3 pt-1">
        <ul className="flex min-w-0 flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
          {hiddenTagCount > 0 && (
            <li className="rounded-md px-1 py-0.5 text-xs text-muted-foreground">
              +{hiddenTagCount}
            </li>
          )}
        </ul>
        <time
          className="shrink-0 text-xs text-muted-foreground"
          dateTime={item.updatedAt.toISOString()}
        >
          {formatRelativeTime(item.updatedAt, now)}
        </time>
      </footer>
    </article>
  );
}
