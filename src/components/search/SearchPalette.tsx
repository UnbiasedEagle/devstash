"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchPanel from "@/components/search/SearchPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export default function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const hasModifier = event.metaKey || event.ctrlKey;
      if (hasModifier && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Holding the keys would otherwise flicker the popup open and closed
        if (!event.repeat) setOpen((current) => !current);
      } else if (
        event.key === "/" &&
        !hasModifier &&
        !event.altKey &&
        !isEditableTarget(event.target) &&
        // Another dialog or the item drawer is open, so a second modal would stack on top
        !document.querySelector('[role="dialog"]')
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(href: string, opensItem: boolean) {
    navigatedRef.current = true;
    setOpen(false);
    router.push(href, { scroll: !opensItem });
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K /"
        onClick={() => setOpen(true)}
        className="relative flex h-8 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search items...</span>
        <kbd
          aria-hidden
          className="hidden rounded bg-muted px-1.5 py-0.5 text-xs md:block"
        >
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-xl gap-0 overflow-hidden p-0"
          // After choosing a result the drawer takes focus, so the trigger must not steal it back
          finalFocus={() => {
            const navigated = navigatedRef.current;
            navigatedRef.current = false;
            return !navigated;
          }}
        >
          <DialogTitle className="sr-only">Search items</DialogTitle>
          <DialogDescription className="sr-only">
            Type to search your items, use the arrow keys to choose one and
            press Enter to open it.
          </DialogDescription>
          <SearchPanel onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
}
