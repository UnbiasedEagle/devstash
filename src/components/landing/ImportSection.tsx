import { X } from "lucide-react";
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

interface ChosenFile {
  name: string;
  result: string;
  kind: LandingKind;
  // A file that can't be imported says why, in red
  refused?: boolean;
}

const FILES: ChosenFile[] = [
  { name: "ideas.md", result: "Note", kind: "Note" },
  { name: "deploy.sh", result: "Snippet · bash", kind: "Snippet" },
  { name: "util.ts", result: "Snippet · typescript", kind: "Snippet" },
  {
    name: "photo.png",
    result: "Not a supported file type",
    kind: "File",
    refused: true,
  },
];

function ImportPicture() {
  return (
    <div aria-hidden="true" className={`${PICTURE} p-5`}>
      <span className="text-xl font-bold tracking-tight">Import files</span>
      <ul className="mt-4 overflow-hidden rounded-xl border border-border">
        {FILES.map(({ name, result, kind, refused }) => {
          const { Icon, tint } = KIND_STYLES[kind];
          return (
            <li
              key={name}
              className="flex items-center gap-3.5 border-b border-border px-4 py-3 last:border-b-0"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-lg ${tint}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <b className="block truncate font-semibold">{name}</b>
                <small
                  className={`text-[0.8125rem] ${refused ? "text-red-400" : "text-muted-foreground"}`}
                >
                  {result}
                </small>
              </div>
              <X className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <span className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 font-medium">
          Cancel
        </span>
        <span className="inline-flex h-9 items-center rounded-lg bg-foreground px-3.5 font-medium text-background">
          Import 3 files
        </span>
      </div>
    </div>
  );
}

export function ImportSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <h2 className={HEADING}>Bring your files in.</h2>
          <p className={SUBHEADING}>
            Drop in the Markdown notes and code files you already have. Markdown
            and text become Notes, and code becomes Snippets with the language
            filled in. It&apos;s free, up to 20 files at a time.
          </p>
        </div>
        <ImportPicture />
      </div>
    </section>
  );
}
