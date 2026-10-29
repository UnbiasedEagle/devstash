import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Folder, Star } from "lucide-react";
import { z } from "zod";
import ItemCard, { ItemCardSkeleton } from "@/components/items/ItemCard";
import ItemDetail, { ItemNotFound } from "@/components/items/ItemDetail";
import {
  ItemDrawerPending,
  ItemDrawerProvider,
} from "@/components/items/ItemDrawer";
import Pagination from "@/components/items/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionById } from "@/lib/db/collections";
import { getItemById, getItemsByCollection } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/user";
import { parsePage } from "@/lib/pagination";
import { getRequestTime } from "@/lib/relative-time";
import type { DetailItem } from "@/types/items";

const idSchema = z.string().min(1).max(64);
const SKELETON_CARD_COUNT = 6;

const gridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

function CollectionPageSkeleton() {
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

async function CollectionContent({
  params,
  searchParams,
}: Pick<PageProps<"/collections/[id]">, "params" | "searchParams">) {
  await connection();
  const { id: rawId } = await params;
  const { page: pageParam, item: itemParam } = await searchParams;
  const id = idSchema.safeParse(rawId).data;
  if (!id) notFound();

  const userId = await getCurrentUserId();
  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  const openItemId = idSchema.safeParse(
    Array.isArray(itemParam) ? itemParam[0] : itemParam,
  ).data;
  // Started before the list resolves so the drawer does not wait for the list queries
  const openItemPromise = openItemId
    ? getItemById(userId, openItemId, { collectionId: collection.id })
    : null;

  const { items, total, page, totalPages } = await getItemsByCollection(
    userId,
    collection.id,
    parsePage(pageParam),
  );
  const now = getRequestTime();
  const basePath = `/collections/${collection.id}`;
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
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Folder className="size-5 text-muted-foreground" />
            </span>
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight">
              {collection.name}
            </h1>
            {collection.isFavorite && (
              <Star
                aria-label="Favorite"
                className="size-4 shrink-0 fill-yellow-500 text-yellow-500"
              />
            )}
            <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {total} {total === 1 ? "item" : "items"}
            </span>
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
        </div>

        {total === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            No items in this collection yet
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

export default function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[id]">) {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <CollectionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
