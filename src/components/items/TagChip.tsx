import Link from "next/link";
import { getTagColor } from "@/lib/tag-colors";
import { tagHref } from "@/lib/tag-links";

const chipClass =
  "inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/60";

// On touch screens the invisible extension lifts the 20px chip to 26px; it stops at the 6px gap between wrapped rows so neighbouring targets never overlap
const linkClass =
  "max-md:before:absolute max-md:before:inset-x-0 max-md:before:-inset-y-[3px] max-md:before:content-[''] outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

interface TagChipProps {
  tag: string;
  linked?: boolean;
}

export default function TagChip({ tag, linked = false }: TagChipProps) {
  const content = (
    <>
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: getTagColor(tag) }}
      />
      {tag}
    </>
  );

  if (!linked) return <li className={chipClass}>{content}</li>;

  return (
    <li className="inline-flex">
      {/* Positioned so it paints above a card's stretched item link */}
      <Link
        href={tagHref(tag)}
        prefetch={false}
        aria-label={`Tag: ${tag}`}
        className={`relative ${chipClass} ${linkClass}`}
      >
        {content}
      </Link>
    </li>
  );
}
