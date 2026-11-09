import { Copy } from "lucide-react";
import { CHIP, PICTURE } from "@/components/landing/classes";
import { KindPill } from "@/components/landing/KindPill";

const KEYWORD = "text-[#c4b5fd]";
const FUNCTION = "text-[#7dd3fc]";

// What opening an item looks like: a drawer with highlighted code and a copy button
export function ItemDrawerPicture({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`${PICTURE} ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <KindPill kind="Snippet" withIcon />
        <span className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 font-medium">
          Edit
        </span>
      </div>
      <div className="p-5">
        <div className="text-[1.375rem] font-bold tracking-tight">
          useDebounce hook
        </div>
        <p className="mt-1 text-muted-foreground">
          Waits until a value stops changing.
        </p>
        <div className="mt-4 overflow-hidden rounded-[10px] border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2 text-[0.8125rem] text-muted-foreground">
            <span>typescript</span>
            <span className="inline-flex items-center gap-1.5">
              <Copy className="size-3.5" />
              Copy
            </span>
          </div>
          <pre className="overflow-x-auto p-3.5 font-mono text-[0.8125rem] leading-[1.7]">
            <span className={KEYWORD}>export function</span>{" "}
            <span className={FUNCTION}>useDebounce</span>
            {"(value, ms) {\n  "}
            <span className={KEYWORD}>const</span>
            {" [v, setV] = "}
            <span className={FUNCTION}>useState</span>
            {"(value);\n  "}
            <span className={FUNCTION}>useEffect</span>
            {"(() => {\n    "}
            <span className={KEYWORD}>const</span>
            {" id = "}
            <span className={FUNCTION}>setTimeout</span>
            {"(\n      () => "}
            <span className={FUNCTION}>setV</span>
            {"(value), ms);\n    "}
            <span className={KEYWORD}>return</span>
            {" () => "}
            <span className={FUNCTION}>clearTimeout</span>
            {"(id);\n  }, [value, ms]);\n  "}
            <span className={KEYWORD}>return</span>
            {" v;\n}"}
          </pre>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className={CHIP}>react</span>
          <span className={CHIP}>hooks</span>
          <span className="ml-auto">In React Patterns</span>
        </div>
      </div>
    </div>
  );
}
