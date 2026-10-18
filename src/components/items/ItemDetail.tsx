import CodeBlock from "@/components/items/CodeBlock";
import { CopyButton } from "@/components/items/CopyButton";
import MarkdownContent from "@/components/items/MarkdownContent";
import TagChip from "@/components/items/TagChip";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import type { DetailItem } from "@/types/items";

const CODE_TYPES = ["Snippet", "Command"];
const COPYABLE_TYPES = ["Snippet", "Command", "Prompt"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getCopyText(item: DetailItem) {
  if (item.contentType === "URL") {
    return item.url && isHttpUrl(item.url) ? item.url : null;
  }
  return COPYABLE_TYPES.includes(item.itemType.name) ? item.content : null;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ItemBody({ item }: { item: DetailItem }) {
  if (item.contentType === "URL" && item.url) {
    return isHttpUrl(item.url) ? (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-mono text-sm text-primary underline underline-offset-4"
      >
        {getHostname(item.url)}
      </a>
    ) : (
      <p className="break-all font-mono text-sm text-muted-foreground">
        {item.url}
      </p>
    );
  }

  if (item.contentType === "FILE") {
    return (
      <p className="font-mono text-sm text-muted-foreground">
        {item.fileName ?? "Unnamed file"}
        {item.fileSize !== null && ` · ${formatFileSize(item.fileSize)}`}
      </p>
    );
  }

  if (!item.content) {
    return <p className="text-sm text-muted-foreground">No content</p>;
  }
  if (CODE_TYPES.includes(item.itemType.name)) {
    return <CodeBlock code={item.content} language={item.language} />;
  }
  return <MarkdownContent>{item.content}</MarkdownContent>;
}

export function ItemNotFound() {
  return (
    <div className="flex flex-col gap-1 p-6">
      <SheetTitle>Item not found</SheetTitle>
      <SheetDescription>
        It may have been deleted, or it isn&apos;t in your stash.
      </SheetDescription>
    </div>
  );
}

export default function ItemDetail({ item }: { item: DetailItem }) {
  const type = item.itemType;
  const Icon = ITEM_TYPE_ICONS[type.icon];
  const copyText = getCopyText(item);

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex flex-col gap-3 pr-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${type.color}1f` }}
          >
            {Icon && <Icon className="size-4" style={{ color: type.color }} />}
          </span>
          {type.name}
        </div>
        <SheetTitle className="font-mono">{item.title}</SheetTitle>
        {item.description && (
          <SheetDescription>{item.description}</SheetDescription>
        )}
      </header>

      {item.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </ul>
      )}

      {copyText && (
        <div>
          <CopyButton text={copyText} />
        </div>
      )}

      <ItemBody item={item} />

      <footer className="mt-2 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Created {dateFormatter.format(item.createdAt)}</span>
        <span>Updated {dateFormatter.format(item.updatedAt)}</span>
      </footer>
    </div>
  );
}
