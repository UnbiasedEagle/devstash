import { Pin, Star } from "lucide-react";
import {
  CONTAINER,
  HEADING,
  PICTURE,
  SECTION_SPACING,
  SUBHEADING,
} from "@/components/landing/classes";
import {
  KIND_STYLES,
  type LandingKind,
} from "@/components/landing/type-styles";

interface FlaggedItem {
  kind: LandingKind;
  title: string;
  pinned: boolean;
  favorite: boolean;
}

const ITEMS: FlaggedItem[] = [
  { kind: "Snippet", title: "useDebounce hook", pinned: true, favorite: true },
  {
    kind: "Command",
    title: "npx create-next-app@latest",
    pinned: true,
    favorite: false,
  },
  {
    kind: "Note",
    title: "When to lift state up",
    pinned: false,
    favorite: true,
  },
  {
    kind: "Link",
    title: "react.dev, Synchronizing with effects",
    pinned: false,
    favorite: false,
  },
];

function FlaggedPicture() {
  return (
    <div aria-hidden="true" className={PICTURE}>
      {ITEMS.map(({ kind, title, pinned, favorite }) => {
        const { Icon, tint } = KIND_STYLES[kind];
        return (
          <div
            key={title}
            className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-lg ${tint}`}
            >
              <Icon className="size-4" />
            </span>
            <b className="min-w-0 truncate font-semibold">{title}</b>
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {pinned && <Pin className="size-3.5 text-muted-foreground" />}
              {favorite && (
                <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function FavoritesSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div className="lg:order-last">
          <h2 className={HEADING}>Keep the daily ones close.</h2>
          <p className={SUBHEADING}>
            Pin what you reach for every day and it waits at the top of your
            dashboard. Star the ones you want to find again.
          </p>
        </div>
        <FlaggedPicture />
      </div>
    </section>
  );
}
