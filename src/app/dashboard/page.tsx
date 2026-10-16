import { Pin } from "lucide-react";
import CollectionCard from "@/components/dashboard/CollectionCard";
import ItemRow from "@/components/dashboard/ItemRow";
import StatsCards from "@/components/dashboard/StatsCards";
import { latestUpdate } from "@/lib/collections";
import { collections, items, type Item } from "@/lib/mock-data";

const RECENT_COLLECTION_LIMIT = 6;
const RECENT_ITEM_LIMIT = 10;

const recentCollections = [...collections]
  .sort((a, b) => latestUpdate(b.id).localeCompare(latestUpdate(a.id)))
  .slice(0, RECENT_COLLECTION_LIMIT);
const pinnedItems = items.filter((item) => item.isPinned);
const recentItems = [...items]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, RECENT_ITEM_LIMIT);

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <StatsCards />

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent collections</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Pin className="size-4 text-muted-foreground" />
          Pinned
        </h2>
        <ItemList items={pinnedItems} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent items</h2>
        <ItemList items={recentItems} />
      </section>
    </div>
  );
}
