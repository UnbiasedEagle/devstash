import { Folder, Plus, Search } from "lucide-react";
import {
  CHIP,
  CONTAINER,
  HEADING,
  PICTURE_BG,
  SECTION_SPACING,
  SUBHEADING,
} from "@/components/landing/classes";
import { LogoMark } from "@/components/landing/LogoMark";
import {
  KIND_STYLES,
  LANDING_KINDS,
  type LandingKind,
} from "@/components/landing/type-styles";

// The numbers add up to less than the free plan's item limit and agree with each other, so the picture could be a real free account
const TYPE_COUNTS: Record<LandingKind, number> = {
  Snippet: 14,
  Prompt: 9,
  Command: 8,
  Note: 6,
  File: 3,
  Image: 2,
  Link: 5,
};

interface CollectionCard {
  name: string;
  count: number;
  description: string;
  edge: LandingKind;
  kinds: LandingKind[];
}

// Three collections, the most the free plan allows. Used by the sidebar and by the cards
const COLLECTIONS: CollectionCard[] = [
  {
    name: "React Patterns",
    count: 4,
    description: "Common React patterns and hooks",
    edge: "Snippet",
    kinds: ["Snippet", "Command", "Note", "Link"],
  },
  {
    name: "Git Commands",
    count: 6,
    description: "Frequently used git commands",
    edge: "Command",
    kinds: ["Command", "Note"],
  },
  {
    name: "AI Prompts",
    count: 5,
    description: "Curated prompts for coding",
    edge: "Prompt",
    kinds: ["Prompt", "Snippet"],
  },
];

interface PinnedItem {
  kind: LandingKind;
  title: string;
  description: string;
  date: string;
  tags?: string[];
}

const PINNED: PinnedItem[] = [
  {
    kind: "Snippet",
    title: "useAuth hook",
    description: "Custom authentication hook for React applications",
    date: "Jan 15",
    tags: ["react", "auth", "hooks"],
  },
  {
    kind: "Snippet",
    title: "API error handling pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    date: "Jan 12",
  },
  {
    kind: "Command",
    title: "Undo last commit, keep changes",
    description: "git reset --soft HEAD~1",
    date: "Jan 9",
  },
];

const SIDEBAR_LABEL =
  "px-2 pt-2 pb-1 text-[0.8125rem] font-medium text-muted-foreground";

function Sidebar() {
  return (
    <aside className="hidden border-r border-border bg-background px-3 py-4 md:block">
      <div className="flex items-center gap-2.5 px-2 pb-4 text-[1.0625rem] font-bold">
        <LogoMark className="size-7" />
        DevStash
      </div>
      <div className={SIDEBAR_LABEL}>Types</div>
      <ul>
        {LANDING_KINDS.map((kind) => {
          const { Icon, text, plural } = KIND_STYLES[kind];
          return (
            <li
              key={kind}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
            >
              <Icon className={`size-4.25 ${text}`} />
              {plural}
              <b className="ml-auto text-sm font-normal text-muted-foreground">
                {TYPE_COUNTS[kind]}
              </b>
            </li>
          );
        })}
      </ul>
      <div className={`mt-3 ${SIDEBAR_LABEL}`}>Collections</div>
      <ul>
        {COLLECTIONS.map(({ name, count }) => (
          <li
            key={name}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
          >
            <Folder className="size-4.25 text-muted-foreground" />
            {name}
            <b className="ml-auto text-sm font-normal text-muted-foreground">
              {count}
            </b>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function DashboardPicture() {
  return (
    <div
      aria-hidden="true"
      className="mt-10 h-[clamp(26rem,50vw,38rem)] overflow-hidden rounded-t-2xl border border-b-0 border-border text-[0.9375rem] mask-[linear-gradient(#000_82%,transparent)]"
    >
      <div className={`grid min-h-full md:grid-cols-[15rem_1fr] ${PICTURE_BG}`}>
        <Sidebar />
        <div className="min-w-0 px-4 pb-6 sm:px-7">
          <div className="-mx-4 flex items-center gap-3 border-b border-border px-4 py-3 sm:-mx-7 sm:px-7">
            <div className="mr-auto flex h-9 max-w-[24rem] min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-lg bg-card px-3 whitespace-nowrap text-muted-foreground">
              <Search className="size-4 shrink-0" />
              Search items...
              <kbd className="ml-auto hidden font-mono text-xs sm:inline">
                Ctrl K
              </kbd>
            </div>
            <span className="hidden h-9 items-center rounded-lg border border-border px-3.5 font-medium sm:inline-flex">
              New Collection
            </span>
            <span className="hidden h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 font-medium text-background sm:inline-flex">
              <Plus className="size-4" />
              New Item
            </span>
          </div>
          <div className="mt-6 text-[1.625rem] font-bold tracking-tight">
            Dashboard
          </div>
          <p className="text-muted-foreground">Your developer knowledge hub</p>
          <div className="mt-6 text-[1.0625rem] font-bold">Collections</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {COLLECTIONS.map(
              ({ name, count, description, edge, kinds }, index) => (
                <div
                  key={name}
                  className={`rounded-[10px] border border-l-[3px] border-border px-4 py-3.5 ${KIND_STYLES[edge].edge} ${index > 1 ? "hidden md:block" : ""}`}
                >
                  <b className="font-semibold">{name}</b>
                  <div className="text-sm text-muted-foreground">
                    {count} items
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {kinds.map((kind) => {
                      const { Icon, text } = KIND_STYLES[kind];
                      return <Icon key={kind} className={`size-4 ${text}`} />;
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="mt-6 text-[1.0625rem] font-bold">Pinned</div>
          <div className="mt-3 grid gap-2">
            {PINNED.map(({ kind, title, description, date, tags }) => {
              const { Icon, tint, edge } = KIND_STYLES[kind];
              return (
                <div
                  key={title}
                  className={`grid grid-cols-[2.5rem_1fr] items-center gap-3.5 rounded-[10px] border border-l-[3px] border-border px-4 py-3 sm:grid-cols-[2.5rem_1fr_auto] ${edge}`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-lg ${tint}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <b className="font-semibold">{title}</b>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                    {tags && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className={CHIP}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="hidden text-[0.8125rem] text-muted-foreground sm:block">
                    {date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <h2 className={HEADING}>Everything you keep, in one place.</h2>
      <p className={SUBHEADING}>
        Seven kinds of item, each with its own color and view. Group them in
        collections, pin the ones you use daily and find the rest with one
        search.
      </p>
      <DashboardPicture />
      <p className="sr-only">
        The DevStash dashboard, with item types in the sidebar and collections
        and pinned items in the main area.
      </p>
    </section>
  );
}
