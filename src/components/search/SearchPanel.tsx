"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import SearchResultOption from "@/components/search/SearchResultOption";
import { useQuickSearch } from "@/components/search/useQuickSearch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolveItemHref, searchResultsHref } from "@/lib/search-navigation";
import { MAX_SEARCH_LENGTH, splitSearchWords } from "@/lib/search-schemas";
import type { QuickSearchResult } from "@/types/search";

interface SearchPanelProps {
  onSelect: (href: string, opensItem: boolean) => void;
}

type SearchOption =
  { kind: "item"; result: QuickSearchResult } | { kind: "all" };

interface ResultGroup {
  id: string;
  name: string;
  entries: { result: QuickSearchResult; index: number }[];
}

// Grouped like the Next.js docs search; the flat arrow-key order follows the groups
function groupByType(results: QuickSearchResult[]): ResultGroup[] {
  const groups = new Map<string, QuickSearchResult[]>();
  for (const result of results) {
    const id = result.itemType.id;
    groups.set(id, [...(groups.get(id) ?? []), result]);
  }
  let index = 0;
  return [...groups].map(([id, items]) => ({
    id,
    name: items[0].itemType.name,
    entries: items.map((result) => ({ result, index: index++ })),
  }));
}

function Message({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "alert";
}) {
  return (
    <p
      role={role}
      className="px-3 py-8 text-center text-sm text-muted-foreground"
    >
      {children}
    </p>
  );
}

export default function SearchPanel({ onSelect }: SearchPanelProps) {
  const pathname = usePathname();
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [input, setInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { status, query, results, error } = useQuickSearch(input);

  const words = useMemo(() => (query ? splitSearchWords(query) : []), [query]);
  const groups = useMemo(() => groupByType(results), [results]);
  const options = useMemo<SearchOption[]>(
    () => [
      ...groups.flatMap((group) =>
        group.entries.map(({ result }) => ({ kind: "item" as const, result })),
      ),
      ...(query && results.length > 0 ? [{ kind: "all" as const }] : []),
    ],
    [groups, query, results.length],
  );
  const active = Math.min(activeIndex, options.length - 1);
  const allIndex = options.length - 1;

  useEffect(() => {
    if (active >= 0) {
      document
        .getElementById(`${baseId}-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [active, baseId, results]);

  function select(option: SearchOption | undefined) {
    // The list still shows the previous query's results while loading, so "See all" would disagree with it
    if (!option || !query || status === "loading") return;
    if (option.kind === "all") {
      onSelect(searchResultsHref(query), false);
      return;
    }
    onSelect(
      resolveItemHref(pathname, new URLSearchParams(window.location.search), {
        id: option.result.id,
        typeName: option.result.itemType.name,
      }),
      true,
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // Safari reports isComposing as false on the keydown that confirms an IME composition, but keyCode is 229
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (options.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((active + step + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(options[active]);
    }
  }

  const showResults = results.length > 0;

  return (
    <div>
      <div className="relative border-b border-border">
        <Search
          aria-hidden
          className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          role="combobox"
          aria-label="Search items"
          aria-expanded={options.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Search items..."
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="h-12 rounded-none border-0 bg-transparent pl-11 pr-4 focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      <div
        className={cn(
          "h-80 max-h-[50vh] overflow-y-auto p-2",
          status === "loading" && showResults && "opacity-70",
        )}
        aria-busy={status === "loading"}
      >
        <div id={listboxId} role="listbox" aria-label="Search results">
          {groups.map((group) => {
            const headingId = `${baseId}-group-${group.id}`;
            return (
              <div key={group.id} role="group" aria-labelledby={headingId}>
                <div
                  id={headingId}
                  className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground"
                >
                  {group.name}s
                </div>
                {group.entries.map(({ result, index }) => (
                  <SearchResultOption
                    key={result.id}
                    id={optionId(index)}
                    result={result}
                    words={words}
                    active={index === active}
                    onHover={() => setActiveIndex(index)}
                    onSelect={() => select(options[index])}
                  />
                ))}
              </div>
            );
          })}
          {query && showResults && (
            <div
              id={optionId(allIndex)}
              role="option"
              aria-selected={active === allIndex}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActiveIndex(allIndex)}
              onClick={() => select(options[allIndex])}
              className={cn(
                "mt-1 cursor-pointer truncate rounded-lg px-3 py-2 text-sm text-muted-foreground",
                active === allIndex && "bg-accent text-foreground",
              )}
            >
              See all results for “{query}”
            </div>
          )}
        </div>

        {status === "idle" && (
          <Message>Search your items by title, content, tags or type</Message>
        )}
        {status === "loading" && !showResults && <Message>Searching…</Message>}
        {status === "ready" && !showResults && (
          <Message>No results for “{query}”</Message>
        )}
        {status === "error" && <Message role="alert">{error}</Message>}
      </div>

      <p className="sr-only" role="status">
        {status === "ready" &&
          (showResults
            ? `${results.length} ${results.length === 1 ? "result" : "results"}`
            : "No results")}
      </p>

      <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground md:flex">
        <span>↑↓ to navigate</span>
        <span>Enter to open</span>
        <span>Esc to close</span>
      </div>
    </div>
  );
}
