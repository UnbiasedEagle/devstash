import { Download } from "lucide-react";
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

interface StoredFile {
  kind: LandingKind;
  name: string;
  details: string;
}

const FILES: StoredFile[] = [
  { kind: "Image", name: "auth-flow.png", details: "84 KB, image/png" },
  {
    kind: "File",
    name: "docker-compose.prod.yml",
    details: "2 KB, application/yaml",
  },
];

function DiagramPreview() {
  return (
    <div className="grid aspect-video place-items-center border-b border-border bg-background">
      <svg
        viewBox="0 0 320 120"
        fill="none"
        strokeWidth="2"
        className="h-auto w-[70%] stroke-muted-foreground"
      >
        <rect x="8" y="40" width="80" height="40" rx="8" />
        <rect x="120" y="8" width="80" height="40" rx="8" />
        <rect x="120" y="72" width="80" height="40" rx="8" />
        <rect
          x="232"
          y="40"
          width="80"
          height="40"
          rx="8"
          className="stroke-[#ec4899]"
        />
        <path d="M88 60h16l16-32M88 60h16l16 32M200 28h16l16 32M200 92h16l16-32" />
      </svg>
    </div>
  );
}

// Images preview in place, and every file downloads with one click
function FilesPicture() {
  return (
    <div aria-hidden="true" className={PICTURE}>
      <DiagramPreview />
      {FILES.map(({ kind, name, details }) => {
        const { Icon, tint } = KIND_STYLES[kind];
        return (
          <div
            key={name}
            className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
          >
            <span
              className={`grid size-10 place-items-center rounded-lg ${tint}`}
            >
              <Icon className="size-4" />
            </span>
            <div>
              <b className="block font-semibold">{name}</b>
              <small className="text-[0.8125rem] text-muted-foreground">
                {details}
              </small>
            </div>
            <span className="ml-auto hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 font-medium sm:inline-flex">
              <Download className="size-4" />
              Download
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function FilesSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <h2 className={HEADING}>Files and images, kept with the rest.</h2>
          <p className={SUBHEADING}>
            Upload a screenshot or a config next to the snippet it belongs to.
            Images preview in place and files download with one click.
          </p>
        </div>
        <FilesPicture />
      </div>
    </section>
  );
}
