import { Download, File } from "lucide-react";
import {
  CONTAINER,
  HEADING,
  PICTURE,
  SECTION_SPACING,
  SUBHEADING,
} from "@/components/landing/classes";

const BUTTON =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 font-medium";

const ZIP_CONTENTS = [
  "files/cm4k2x-auth-flow.png",
  "files/cm7p9q-compose.yml",
  "export.json",
];

function ExportPicture() {
  return (
    <div aria-hidden="true" className={`${PICTURE} p-5`}>
      <div className="flex items-center gap-2.5">
        <span className="text-xl font-bold tracking-tight">
          Export your data
        </span>
        <span className="rounded-full bg-card px-2 py-0.5 text-[0.6875rem] font-medium">
          Pro
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={BUTTON}>
          <Download className="size-4" />
          Download JSON
        </span>
        <span className={BUTTON}>
          <Download className="size-4" />
          Download with files (ZIP)
        </span>
      </div>
      <ul className="mt-5 border-t border-border font-mono text-[0.8125rem]">
        {ZIP_CONTENTS.map((name) => (
          <li
            key={name}
            className="flex items-center gap-2.5 border-b border-border py-2.5"
          >
            <File className="size-4 shrink-0 text-muted-foreground" />
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExportSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <h2 className={HEADING}>Take it with you.</h2>
          <p className={SUBHEADING}>
            With Pro, export everything as one JSON file, or as a ZIP that also
            holds the files and images you uploaded.
          </p>
        </div>
        <ExportPicture />
      </div>
    </section>
  );
}
