import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { z } from "zod";
import ItemCard, { ItemCardSkeleton } from "@/components/items/ItemCard";
import ItemDetail, { ItemNotFound } from "@/components/items/ItemDetail";
import {
  ItemDrawerPending,
  ItemDrawerProvider,
} from "@/components/items/ItemDrawer";
import Pagination from "@/components/items/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemTypeBySlug } from "@/lib/db/item-types";
import { getItemById, getItemsByType } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/user";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { parsePage } from "@/lib/pagination";
import { getRequestTime } from "@/lib/relative-time";
import type { DetailItem } from "@/types/items";

const SLUG_PATTERN = /^[a-z0-9-]{1,30}$/i;
const itemIdSchema = z.string().min(1).max(64);
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
  const { page: pageParam, item: itemParam } = await searchParams;
  if (!SLUG_PATTERN.test(slug)) notFound();

  const userId = await getCurrentUserId();
  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  const openItemId = itemIdSchema.safeParse(
    Array.isArray(itemParam) ? itemParam[0] : itemParam,
  ).data;
  // Started before the list resolves so the drawer does not wait for the list queries
  const openItemPromise = openItemId
    ? getItemById(userId, openItemId, { itemTypeId: type.id })
    : null;

  const { items, total, page, totalPages } = await getItemsByType(
    userId,
    type.id,
    parsePage(pageParam),
  );
  const Icon = ITEM_TYPE_ICONS[type.icon];
  const now = getRequestTime();
  const plural = `${type.name}s`;
  const basePath = `/items/${type.name.toLowerCase()}`;
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

async function OpenItemContent({
  itemPromise,
}: {
  itemPromise: Promise<DetailItem | null>;
}) {
  const item = await itemPromise;
  return item ? <ItemDetail item={item} /> : <ItemNotFound />;
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
