import ItemDrawerHeader from "@/components/items/ItemDrawerHeader";
import { SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { isCreatableItemType } from "@/lib/item-schemas";
import type { DrawerPreview } from "@/types/items";

export default function ItemDrawerSkeleton({
  preview,
}: {
  preview?: DrawerPreview | null;
}) {
  // Before the preview is known (a direct link) the type is unknown, so the common toolbar is assumed
  const showEdit = !preview || isCreatableItemType(preview.itemType.name);

  return (
    <div className="flex flex-col gap-5 p-6" aria-busy>
      {/* Holds the toolbar's place so the header doesn't jump down once the item loads */}
      <div
        aria-hidden
        className="-mb-2 flex h-8 items-center justify-end gap-1 pr-10"
      >
        <Skeleton className="size-8" />
        <Skeleton className="size-8" />
        {showEdit && <Skeleton className="h-7 w-16" />}
        <Skeleton className="h-7 w-[4.5rem]" />
      </div>
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
