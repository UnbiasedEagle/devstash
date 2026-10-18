import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ItemCard, { ItemCardSkeleton } from "@/components/items/ItemCard";
import Pagination from "@/components/items/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemTypeBySlug } from "@/lib/db/item-types";
import { getItemsByType } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/user";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { parsePage } from "@/lib/pagination";
import { getRequestTime } from "@/lib/relative-time";

const SLUG_PATTERN = /^[a-z0-9-]{1,30}$/i;
const SKELETON_CARD_COUNT = 6;

const gridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

function ItemsPageSkeleton() {
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

async function ItemsContent({
  params,
  searchParams,
}: Pick<PageProps<"/items/[type]">, "params" | "searchParams">) {
  await connection();
  const { type: slug } = await params;
  const { page: pageParam } = await searchParams;
  if (!SLUG_PATTERN.test(slug)) notFound();

  const userId = await getCurrentUserId();
  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  const { items, total, page, totalPages } = await getItemsByType(
    userId,
    type.id,
    parsePage(pageParam),
  );
  const Icon = ITEM_TYPE_ICONS[type.icon];
  const now = getRequestTime();
  const plural = `${type.name}s`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${type.color}1f` }}
        >
          {Icon && <Icon className="size-5" style={{ color: type.color }} />}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{plural}</h1>
        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}
        </span>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          No {type.name === "URL" ? plural : plural.toLowerCase()} yet
        </p>
      ) : (
        <>
          <div className={gridClass}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} now={now} />
            ))}
          </div>
          <Pagination
            basePath={`/items/${type.name.toLowerCase()}`}
            page={page}
            totalPages={totalPages}
            total={total}
          />
        </>
      )}
    </div>
  );
}

export default function ItemsPage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  return (
    <Suspense fallback={<ItemsPageSkeleton />}>
      <ItemsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
