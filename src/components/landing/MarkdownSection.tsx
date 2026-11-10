import {
  CONTAINER,
  HEADING,
  PICTURE,
  SECTION_SPACING,
  SUBHEADING,
} from "@/components/landing/classes";
import { KindPill } from "@/components/landing/KindPill";

const MARKER = "text-[#c4b5fd]";
const CODE = "text-[#7dd3fc]";

function MarkdownPicture() {
  return (
    <div aria-hidden="true" className={PICTURE}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <KindPill kind="Note" withIcon />
        <div className="flex gap-1 rounded-lg bg-background p-1 text-[0.8125rem] font-medium">
          <span className="rounded-md bg-card px-3 py-1">Write</span>
          <span className="px-3 py-1 text-muted-foreground">Preview</span>
        </div>
      </div>
      <pre className="p-5 font-mono text-[0.8125rem] leading-[1.7] whitespace-pre-wrap">
        <span className={MARKER}>{"# "}</span>
        {
          "When to lift state up\n\nMove state to the closest parent that\nneeds it, and pass it down as props.\n\n"
        }
        <span className={MARKER}>{"- "}</span>
        {"Two siblings read the same value\n"}
        <span className={MARKER}>{"- "}</span>
        {"A child needs to change it\n\nUse "}
        <span className={CODE}>`useReducer`</span>
        {" once the updates grow."}
      </pre>
    </div>
  );
}

export function MarkdownSection() {
  return (
    <section className={`${CONTAINER} ${SECTION_SPACING}`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div className="lg:order-last">
          <h2 className={HEADING}>Write notes and prompts in Markdown.</h2>
          <p className={SUBHEADING}>
            Notes and prompts open in a Markdown editor with highlighting.
            Switch to Preview to read them the way you will see them later.
          </p>
        </div>
        <MarkdownPicture />
      </div>
    </section>
  );
}
