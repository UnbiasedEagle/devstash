import { getTagColor } from "@/lib/tag-colors";

export default function TagChip({ tag }: { tag: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/60">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: getTagColor(tag) }}
      />
      {tag}
    </li>
  );
}
