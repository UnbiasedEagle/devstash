import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ItemCard, { ItemCardSkeleton } from "@/components/items/ItemCard";
import {
  ItemDrawerPending,
  ItemDrawerProvider,
} from "@/components/items/ItemDrawer";
import OpenItemContent from "@/components/items/OpenItemContent";
import Pagination from "@/components/items/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemForUser, getItemsByTag } from "@/lib/db/items";
import { getTagByName } from "@/lib/db/tags";
import { getCurrentUserId } from "@/lib/db/user";
import { parseItemId } from "@/lib/item-schemas";
import { parsePage } from "@/lib/pagination";
import { getRequestTime } from "@/lib/relative-time";
import { getTagColor } from "@/lib/tag-colors";
import { tagHref } from "@/lib/tag-links";
import { parseTagName } from "@/lib/tag-schemas";

const SKELETON_CARD_COUNT = 6;

const gridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

function TagPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className={gridClass}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <ItemCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function TagContent({
  params,
  searchParams,
}: Pick<PageProps<"/tags/[name]">, "params" | "searchParams">) {
  await connection();
  const { name: rawName } = await params;
  const { page: pageParam, item: itemParam } = await searchParams;
  const name = parseTagName(rawName);
  if (!name) notFound();

  const userId = await getCurrentUserId();
  const tag = await getTagByName(userId, name);
  if (!tag) notFound();

  const openItemId = parseItemId(itemParam);
  // Started before the list resolves so the drawer does not wait for the list queries
  const openItemPromise = openItemId
    ? getItemForUser(userId, openItemId)
    : null;

  const { items, total, page, totalPages } = await getItemsByTag(
    userId,
    tag.id,
    parsePage(pageParam),
  );
  const now = getRequestTime();
  const basePath = tagHref(tag.name);
  const pagePrefix = page > 1 ? `page=${page}&` : "";
  const closeHref = page > 1 ? `${basePath}?page=${page}` : basePath;

  return (
    <ItemDrawerProvider
      openItemId={openItemId}
      closeHref={closeHref}
      drawer={
        openItemPromise && (
          <Suspense fallback={<ItemDrawerPending />}>
            <OpenItemContent itemPromise={openItemPromise} />
          </Suspense>
        )
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <span
              aria-hidden
              className="size-3 rounded-full"
              style={{ backgroundColor: getTagColor(tag.name) }}
            />
          </span>
          <h1 className="min-w-0 wrap-break-word text-2xl font-semibold tracking-tight">
            {tag.name}
          </h1>
          <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {total} {total === 1 ? "item" : "items"}
          </span>
        </div>

        {total === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            No items with this tag
          </p>
        ) : (
          <>
            <div className={gridClass}>
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  now={now}
                  href={`${basePath}?${pagePrefix}item=${item.id}`}
                />
              ))}
            </div>
            <Pagination
              basePath={basePath}
              page={page}
              totalPages={totalPages}
              total={total}
            />
          </>
        )}
      </div>
    </ItemDrawerProvider>
  );
}

export default function TagPage({
  params,
  searchParams,
}: PageProps<"/tags/[name]">) {
  return (
    <Suspense fallback={<TagPageSkeleton />}>
      <TagContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
