import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const PROSE_CLASS = [
  "text-sm leading-relaxed text-foreground",
  "[&>*+*]:mt-3",
  "[&_h1]:text-xl [&_h1]:font-semibold",
  "[&_h2]:text-lg [&_h2]:font-semibold",
  "[&_h3]:text-base [&_h3]:font-semibold",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
  "[&_hr]:border-border",
].join(" ");

const SAFE_URL_PATTERN = /^https?:\/\//i;

function urlTransform(url: string) {
  return SAFE_URL_PATTERN.test(url) ? url : "";
}

// urlTransform empties every non-http(s) href, so a link without an href is rendered as plain text
const components: Components = {
  a({ href, children }) {
    if (!href) return <span>{children}</span>;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4"
      >
        {children}
      </a>
    );
  },
};

export default function MarkdownContent({ children }: { children: string }) {
  return (
    <div className={PROSE_CLASS}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={["img"]}
        urlTransform={urlTransform}
        components={components}
      >
        {children}
      </Markdown>
    </div>
  );
}
