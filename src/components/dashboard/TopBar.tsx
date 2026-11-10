import { Suspense } from "react";
import NewCollectionDialog from "@/components/collections/NewCollectionDialog";
import ImportDialog from "@/components/items/ImportDialog";
import NewItemButton, {
  NewItemButtonFallback,
} from "@/components/items/NewItemButton";
import SearchPalette from "@/components/search/SearchPalette";

export default function TopBar() {
  return (
    <header className="flex min-w-0 flex-1 items-center gap-2 px-3 md:gap-4 md:px-4">
      <SearchPalette />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NewCollectionDialog />
        <ImportDialog />
        <Suspense fallback={<NewItemButtonFallback />}>
          <NewItemButton />
        </Suspense>
      </div>
    </header>
  );
}
