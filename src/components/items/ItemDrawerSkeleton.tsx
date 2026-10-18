import ItemDrawerHeader from "@/components/items/ItemDrawerHeader";
import { SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { DrawerPreview } from "@/types/items";

export default function ItemDrawerSkeleton({
  preview,
}: {
  preview?: DrawerPreview | null;
}) {
  return (
    <div className="flex flex-col gap-5 p-6" aria-busy>
      {preview ? (
        <ItemDrawerHeader {...preview} />
      ) : (
        <>
          <SheetTitle className="sr-only">Loading item</SheetTitle>
          <div aria-hidden className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </>
      )}
      <Skeleton aria-hidden className="h-48" />
    </div>
  );
}
