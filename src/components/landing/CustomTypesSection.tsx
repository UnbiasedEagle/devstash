import { BookOpen, Bookmark, Bug, Key, Lightbulb, Wrench } from "lucide-react";
import {
  CONTAINER,
  HEADING,
  PICTURE,
  SECTION_SPACING,
  SUBHEADING,
} from "@/components/landing/classes";

const ICONS = [BookOpen, Bookmark, Bug, Key, Lightbulb, Wrench];

// The classes are written out in full so Tailwind finds them. The first color is the chosen one
const COLORS = [
  "bg-[#ef4444]",
  "bg-[#14b8a6]",
  "bg-[#06b6d4]",
  "bg-[#6366f1]",
  "bg-[#d946ef]",
  "bg-[#84cc16]",
];

const LABEL = "text-[0.8125rem] font-medium text-muted-foreground";

function CustomTypePicture() {
  return (
    <div aria-hidden="true" className={`${PICTURE} p-5`}>
      <div className="flex items-center gap-2.5">
        <span className="text-xl font-bold tracking-tight">New type</span>
        <span className="rounded-full bg-card px-2 py-0.5 text-[0.6875rem] font-medium">
          Pro
        </span>
      </div>

      <p className={`${LABEL} mt-4`}>Name</p>
      <div className="mt-1.5 flex h-10 items-center rounded-lg border border-border bg-background px-3">
        Recipe
      </div>

      <p className={`${LABEL} mt-4`}>Icon</p>
      <div className="mt-1.5 flex gap-2">
        {ICONS.map((Icon, index) => (
          <span
            key={index}
            className={`grid size-10 place-items-center rounded-lg border ${index === 0 ? "border-foreground" : "border-border"}`}
          >
            <Icon className="size-4" />
          </span>
        ))}
      </div>

      <p className={`${LABEL} mt-4`}>Color</p>
      <div className="mt-1.5 flex gap-2">
        {COLORS.map((color, index) => (
          <span
            key={color}
            className={`size-7 rounded-full ${color} ${index === 0 ? "outline-2 outline-offset-2 outline-foreground" : ""}`}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span className="grid size-9 place-items-center rounded-lg bg-[#ef4444]/15 text-[#ef4444]">
          <BookOpen className="size-4" />
        </span>
        <b className="font-semibold">Recipe</b>
        <span className="ml-auto text-muted-foreground">3 items</span>
      </div>
    </div>
  );
}

export function CustomTypesSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div className="lg:order-last">
          <h2 className={HEADING}>Make your own types.</h2>
          <p className={SUBHEADING}>
            Add types like Recipe or Runbook next to the built-in ones. Pick an
            icon and a color, and they show up in the sidebar, on cards, in
            search and in your export. A Pro feature.
          </p>
        </div>
        <CustomTypePicture />
      </div>
    </section>
  );
}
