import {
  CHIP,
  CONTAINER,
  HEADING,
  PICTURE,
  SECTION_SPACING,
  SUBHEADING,
} from "@/components/landing/classes";
import { KindPill } from "@/components/landing/KindPill";
import type { LandingKind } from "@/components/landing/type-styles";

interface CollectionRow {
  kind: LandingKind;
  title: string;
}

const ROWS: CollectionRow[] = [
  { kind: "Snippet", title: "useDebounce hook" },
  { kind: "Command", title: "npx create-next-app@latest" },
  { kind: "Note", title: "When to lift state up" },
  { kind: "Link", title: "react.dev, Synchronizing with effects" },
];

function CollectionPicture() {
  return (
    <div aria-hidden="true" className={`${PICTURE} p-5`}>
      <div className="text-xl font-bold tracking-tight">React Patterns</div>
      <p className="text-muted-foreground">{ROWS.length} items</p>
      <ul className="mt-4 border-t border-border">
        {ROWS.map(({ kind, title }) => (
          <li
            key={title}
            className="grid items-center gap-1 border-b border-border py-3 font-medium sm:grid-cols-[6.5rem_1fr] sm:gap-4"
          >
            <KindPill kind={kind} />
            <span>{title}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {["hooks", "react", "typescript"].map((tag) => (
          <span key={tag} className={CHIP}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CollectionsSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <h2 className={HEADING}>Group it the way you work.</h2>
          <p className={SUBHEADING}>
            A collection can hold anything, so a project&apos;s snippet, its
            setup command and the doc you keep opening sit together.
          </p>
          <p className="relative mt-7 max-w-120 pl-5 text-muted-foreground before:absolute before:top-[0.72em] before:left-0 before:h-0.5 before:w-2 before:bg-muted-foreground">
            <b className="font-semibold text-foreground">Tags</b> link every
            item that shares one.
          </p>
        </div>
        <CollectionPicture />
      </div>
    </section>
  );
}
