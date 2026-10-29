import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Pin } from "lucide-react";
import CollectionCard, {
  CollectionCardSkeleton,
} from "@/components/dashboard/CollectionCard";
import ItemRow, { ItemRowSkeleton } from "@/components/dashboard/ItemRow";
import StatsCards, { StatsCardsSkeleton } from "@/components/dashboard/StatsCards";
import { getRecentCollections } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems } from "@/lib/db/items";
import { getDashboardStats } from "@/lib/db/stats";
import { getCurrentUserId } from "@/lib/db/user";
import type { DashboardItem } from "@/types/dashboard";

const RECENT_COLLECTION_LIMIT = 6;
const RECENT_ITEM_LIMIT = 10;
const PINNED_ITEM_LIMIT = 20;
const PINNED_SKELETON_ROWS = 3;

const itemListClass =
  "divide-y divide-border overflow-hidden rounded-xl border border-border bg-card";

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function ItemList({
  items,
  emptyMessage,
}: {
  items: DashboardItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <ul className={itemListClass}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function ItemListSkeleton({ rows }: { rows: number }) {
  return (
    <ul aria-hidden className={itemListClass}>
      {Array.from({ length: rows }, (_, index) => (
        <ItemRowSkeleton key={index} />
      ))}
    </ul>
  );
}

async function StatsSection() {
  await connection();
  const stats = await getDashboardStats(await getCurrentUserId());
  return <StatsCards stats={stats} />;
}

async function RecentCollectionsSection() {
  await connection();
  const collections = await getRecentCollections(
    await getCurrentUserId(),
    RECENT_COLLECTION_LIMIT,
  );

  if (collections.length === 0) return <EmptyState message="No collections yet." />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

async function PinnedItemsSection() {
  await connection();
  const items = await getPinnedItems(await getCurrentUserId(), PINNED_ITEM_LIMIT);
  return <ItemList items={items} emptyMessage="No pinned items yet." />;
}

async function RecentItemsSection() {
  await connection();
  const items = await getRecentItems(await getCurrentUserId(), RECENT_ITEM_LIMIT);
  return <ItemList items={items} emptyMessage="No items yet." />;
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsSection />
      </Suspense>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent collections</h2>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <Suspense
          fallback={
            <div
              aria-hidden
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: RECENT_COLLECTION_LIMIT }, (_, index) => (
                <CollectionCardSkeleton key={index} />
              ))}
            </div>
          }
        >
          <RecentCollectionsSection />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Pin className="size-4 text-muted-foreground" />
          Pinned
        </h2>
        <Suspense fallback={<ItemListSkeleton rows={PINNED_SKELETON_ROWS} />}>
          <PinnedItemsSection />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent items</h2>
        <Suspense fallback={<ItemListSkeleton rows={RECENT_ITEM_LIMIT} />}>
          <RecentItemsSection />
        </Suspense>
      </section>
    </div>
  );
}
