import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Folder } from "lucide-react";
import CollectionFavoriteButton from "@/components/collections/CollectionFavoriteButton";
import DeleteCollectionButton from "@/components/collections/DeleteCollectionButton";
import EditCollectionDialog from "@/components/collections/EditCollectionDialog";
import ItemCard, { ItemCardSkeleton } from "@/components/items/ItemCard";
import {
  ItemDrawerPending,
  ItemDrawerProvider,
} from "@/components/items/ItemDrawer";
import OpenItemContent from "@/components/items/OpenItemContent";
import Pagination from "@/components/items/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { collectionIdSchema } from "@/lib/collection-schemas";
import { getCollectionById } from "@/lib/db/collections";
import { getItemForUser, getItemsByCollection } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/user";
import { parseItemId } from "@/lib/item-schemas";
import { parsePage } from "@/lib/pagination";
import { getRequestTime } from "@/lib/relative-time";

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
  const id = collectionIdSchema.safeParse(rawId).data;
  if (!id) notFound();

  const userId = await getCurrentUserId();
  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  const openItemId = parseItemId(itemParam);
  // Started before the list resolves so the drawer does not wait for the list queries
  const openItemPromise = openItemId
    ? getItemForUser(userId, openItemId)
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Folder className="size-5 text-muted-foreground" />
            </span>
            <h1 className="min-w-0 wrap-break-word text-2xl font-semibold tracking-tight">
              {collection.name}
            </h1>
            <span className="shrink-0 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {total} {total === 1 ? "item" : "items"}
            </span>
            <div className="flex items-center gap-2 sm:ml-auto">
              <CollectionFavoriteButton
                id={collection.id}
                name={collection.name}
                isFavorite={collection.isFavorite}
              />
              <EditCollectionDialog collection={collection} />
              <DeleteCollectionButton
                id={collection.id}
                name={collection.name}
              />
            </div>
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
