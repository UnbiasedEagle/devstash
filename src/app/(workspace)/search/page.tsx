import { Suspense } from "react";
import { connection } from "next/server";
import { Search } from "lucide-react";
import ItemCard, { ItemCardSkeleton } from "@/components/items/ItemCard";
import {
  ItemDrawerPending,
  ItemDrawerProvider,
} from "@/components/items/ItemDrawer";
import OpenItemContent from "@/components/items/OpenItemContent";
import Pagination from "@/components/items/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemForUser, searchItems } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/user";
import { parseItemId } from "@/lib/item-schemas";
import { parsePage } from "@/lib/pagination";
import { getRequestTime } from "@/lib/relative-time";
import { MAX_SEARCH_LENGTH, parseSearchQuery } from "@/lib/search-schemas";

const SKELETON_CARD_COUNT = 6;

const gridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

function SearchPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10" />
        <Skeleton className="h-8 w-48" />
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

function SearchMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

async function SearchContent({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  await connection();
  const { q, page: pageParam, item: itemParam } = await searchParams;

  const parsed = parseSearchQuery(q);
  if (parsed.status === "empty") {
    return <SearchMessage>Type something to search</SearchMessage>;
  }
  if (parsed.status === "too-long") {
    return (
      <SearchMessage>
        Search is limited to {MAX_SEARCH_LENGTH} characters
      </SearchMessage>
    );
  }

  const { query } = parsed;
  const userId = await getCurrentUserId();
  const openItemId = parseItemId(itemParam);
  // Started before the list resolves so the drawer does not wait for the list queries
  const openItemPromise = openItemId
    ? getItemForUser(userId, openItemId)
    : null;

  const { items, total, page, totalPages } = await searchItems(
    userId,
    query,
    parsePage(pageParam),
  );
  const now = getRequestTime();

  const hrefFor = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ q: query });
    if (page > 1) params.set("page", String(page));
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    return `/search?${params.toString()}`;
  };

  return (
    <ItemDrawerProvider
      openItemId={openItemId}
      closeHref={hrefFor()}
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
            <Search className="size-5 text-muted-foreground" />
          </span>
          <h1 className="min-w-0 wrap-break-word text-2xl font-semibold tracking-tight">
            Results for “{query}”
          </h1>
          <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {total} {total === 1 ? "item" : "items"}
          </span>
        </div>

        {total === 0 ? (
          <p className="wrap-break-word rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            No results for “{query}”
          </p>
        ) : (
          <>
            <div className={gridClass}>
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  now={now}
                  href={hrefFor({ item: item.id })}
                />
              ))}
            </div>
            <Pagination
              basePath="/search"
              params={{ q: query }}
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

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
