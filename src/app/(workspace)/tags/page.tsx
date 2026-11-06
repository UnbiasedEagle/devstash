import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { getTagsWithCounts } from "@/lib/db/tags";
import { getCurrentUserId } from "@/lib/db/user";
import { tagHref } from "@/lib/tag-links";
import { getTagColor } from "@/lib/tag-colors";

const SKELETON_CARD_COUNT = 6;

const gridClass = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

function Heading({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
      {count === undefined ? (
        <Skeleton className="h-6 w-16 rounded-full" />
      ) : (
        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {count} {count === 1 ? "tag" : "tags"}
        </span>
      )}
    </div>
  );
}

function TagsPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl space-y-6">
      <Heading />
      <div className={gridClass}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function TagsContent() {
  await connection();
  const tags = await getTagsWithCounts(await getCurrentUserId());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Heading count={tags.length} />
      {tags.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          No tags yet. Add tags to an item and they will show up here.
        </p>
      ) : (
        <ul className={gridClass}>
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={tagHref(tag.name)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors outline-none hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getTagColor(tag.name) }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-sm font-medium"
                  title={tag.name}
                >
                  {tag.name}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {tag.count} {tag.count === 1 ? "item" : "items"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TagsPage() {
  return (
    <Suspense fallback={<TagsPageSkeleton />}>
      <TagsContent />
    </Suspense>
  );
}
