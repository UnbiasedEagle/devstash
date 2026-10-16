import { Suspense } from "react";
import { connection } from "next/server";
import { Pin } from "lucide-react";
import CollectionCard from "@/components/dashboard/CollectionCard";
import ItemRow from "@/components/dashboard/ItemRow";
import StatsCards from "@/components/dashboard/StatsCards";
import { getRecentCollections } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems } from "@/lib/db/items";
import { getDashboardStats } from "@/lib/db/stats";
import { getCurrentUserId } from "@/lib/db/user";
import type { DashboardItem } from "@/types/dashboard";

const RECENT_COLLECTION_LIMIT = 6;
const RECENT_ITEM_LIMIT = 10;

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
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden className="h-96 animate-pulse rounded-xl bg-muted/40" />
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  await connection();
  const userId = await getCurrentUserId();
  const [stats, recentCollections, pinnedItems, recentItems] = await Promise.all([
    getDashboardStats(userId),
    getRecentCollections(userId, RECENT_COLLECTION_LIMIT),
    getPinnedItems(userId),
    getRecentItems(userId, RECENT_ITEM_LIMIT),
  ]);

  return (
    <div className="space-y-10">
      <StatsCards stats={stats} />

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent collections</h2>
        {recentCollections.length === 0 ? (
          <EmptyState message="No collections yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Pin className="size-4 text-muted-foreground" />
          Pinned
        </h2>
        <ItemList items={pinnedItems} emptyMessage="No pinned items yet." />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent items</h2>
        <ItemList items={recentItems} emptyMessage="No items yet." />
      </section>
    </div>
  );
}
