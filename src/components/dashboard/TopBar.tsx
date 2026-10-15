import { FolderPlus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TopBar() {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border px-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search items..." className="pl-9" readOnly />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline">
          <FolderPlus />
          New Collection
        </Button>
        <Button>
          <Plus />
          New Item
        </Button>
      </div>
    </header>
  );
}
