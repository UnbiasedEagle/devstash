import { Search } from "lucide-react";
import { PICTURE } from "@/components/landing/classes";
import {
  KIND_STYLES,
  type LandingKind,
} from "@/components/landing/type-styles";

interface Hit {
  kind: LandingKind;
  before: string;
  match: string;
  after: string;
  place: string;
  active?: boolean;
}

interface Group {
  heading: string;
  hits: Hit[];
}

const GROUPS: Group[] = [
  {
    heading: "Snippets",
    hits: [
      {
        kind: "Snippet",
        before: "",
        match: "Debounce",
        after: " hook",
        place: "React Patterns",
        active: true,
      },
    ],
  },
  {
    heading: "Notes",
    hits: [
      {
        kind: "Note",
        before: "Debounce vs ",
        match: "throttle",
        after: "",
        place: "Decisions",
      },
    ],
  },
  {
    heading: "Links",
    hits: [
      {
        kind: "Link",
        before: "",
        match: "Debounc",
        after: "ing in React",
        place: "Reading",
      },
    ],
  },
];

// The Ctrl K search: results from every kind of item, grouped by kind
export function SearchPicture({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`${PICTURE} shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 text-lg">
        <Search className="size-4.5 text-muted-foreground" />
        debounce
        <kbd className="ml-auto rounded-md border border-border px-1.5 py-px font-mono text-xs text-muted-foreground">
          Esc
        </kbd>
      </div>
      {GROUPS.map(({ heading, hits }) => (
        <div key={heading}>
          <div className="px-5 pt-3 pb-1 text-[0.8125rem] font-medium text-muted-foreground">
            {heading}
          </div>
          {hits.map(({ kind, before, match, after, place, active }) => {
            const { Icon, text, underline } = KIND_STYLES[kind];
            return (
              <div
                key={`${kind}-${match}`}
                className={`flex items-center gap-3 px-5 py-2 ${active ? "bg-card" : ""}`}
              >
                <Icon className={`size-4.25 ${text}`} />
                <span>
                  {before}
                  <mark
                    className={`bg-transparent text-inherit underline decoration-2 underline-offset-[3px] ${underline}`}
                  >
                    {match}
                  </mark>
                  {after}
                </span>
                <small className="ml-auto text-[0.8125rem] text-muted-foreground">
                  {place}
                </small>
              </div>
            );
          })}
        </div>
      ))}
      <div className="mt-2 flex gap-5 border-t border-border px-5 py-3 text-[0.8125rem] text-muted-foreground">
        <span>Up and down to move</span>
        <span>Enter to open</span>
      </div>
    </div>
  );
}
