import { Suspense } from "react";
import { connection } from "next/server";
import CollectionCard, {
  CollectionCardSkeleton,
} from "@/components/dashboard/CollectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllCollections } from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/user";

const SKELETON_CARD_COUNT = 3;

const gridClass = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

function Heading({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
      {count === undefined ? (
        <Skeleton className="h-6 w-20 rounded-full" />
      ) : (
        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {count} {count === 1 ? "collection" : "collections"}
        </span>
      )}
    </div>
  );
}

function CollectionsPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl space-y-6">
      <Heading />
      <div className={gridClass}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <CollectionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function CollectionsContent() {
  await connection();
  const collections = await getAllCollections(await getCurrentUserId());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Heading count={collections.length} />
      {collections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          No collections yet
        </p>
      ) : (
        <div className={gridClass}>
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsPageSkeleton />}>
      <CollectionsContent />
    </Suspense>
  );
}
