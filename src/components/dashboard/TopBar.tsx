import { Search } from "lucide-react";
import { Suspense } from "react";
import NewCollectionDialog from "@/components/collections/NewCollectionDialog";
import NewItemButton, {
  NewItemButtonFallback,
} from "@/components/items/NewItemButton";
import { Input } from "@/components/ui/input";

export default function TopBar() {
  return (
    <header className="flex min-w-0 flex-1 items-center gap-2 px-3 md:gap-4 md:px-4">
      <div className="relative min-w-0 max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search items..." className="px-9" readOnly />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground md:block">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NewCollectionDialog />
        <Suspense fallback={<NewItemButtonFallback />}>
          <NewItemButton />
        </Suspense>
      </div>
    </header>
  );
}
