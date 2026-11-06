import HighlightedText from "@/components/search/HighlightedText";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { QuickSearchResult } from "@/types/search";

const VISIBLE_TAG_COUNT = 2;

interface SearchResultOptionProps {
  id: string;
  result: QuickSearchResult;
  words: string[];
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}

export default function SearchResultOption({
  id,
  result,
  words,
  active,
  onHover,
  onSelect,
}: SearchResultOptionProps) {
  const { itemType } = result;
  const Icon = ITEM_TYPE_ICONS[itemType.icon];

  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      // Keeps focus in the input so arrow keys and typing keep working after a click or hover
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onHover}
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
        active && "bg-accent",
      )}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${itemType.color}1f` }}
      >
        {Icon && <Icon className="size-4" style={{ color: itemType.color }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm">
          <HighlightedText text={result.title} words={words} />
        </span>
        {result.snippet && (
          <span className="block truncate text-xs text-muted-foreground">
            <HighlightedText text={result.snippet} words={words} />
          </span>
        )}
      </span>
      {result.tags.length > 0 && (
        <span className="hidden shrink-0 gap-1.5 text-xs text-muted-foreground sm:flex">
          {result.tags.slice(0, VISIBLE_TAG_COUNT).map((tag) => (
            <span key={tag} className="rounded bg-muted/60 px-1.5 py-0.5">
              <HighlightedText text={tag} words={words} />
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
