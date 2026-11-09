import { Folder } from "lucide-react";
import Link from "next/link";
import CodeBlock from "@/components/items/CodeBlock";
import { CopyButton } from "@/components/items/CopyButton";
import MarkdownContent from "@/components/items/MarkdownContent";
import ItemDetailShell from "@/components/items/ItemDetailShell";
import ItemDrawerHeader from "@/components/items/ItemDrawerHeader";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { isCreatableItemType } from "@/lib/item-schemas";
import { formatFileSize } from "@/lib/upload-rules";
import type { CollectionOption, DetailItem } from "@/types/items";

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

export default function ItemDetail({
  item,
  collections,
}: {
  item: DetailItem;
  collections: CollectionOption[];
}) {
  const copyText = getCopyText(item);

  return (
    <ItemDetailShell
      key={item.id}
      item={item}
      collections={collections}
      editable={isCreatableItemType(item.itemType.name)}
    >
      <ItemDrawerHeader
        title={item.title}
        description={item.description}
        tags={item.tags}
        itemType={item.itemType}
      />

      {copyText && (
        <div>
          <CopyButton text={copyText} />
        </div>
      )}

      <ItemBody item={item} />

      <footer className="mt-2 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        {item.collection && (
          <Link
            href={`/collections/${item.collection.id}`}
            aria-label={`Collection: ${item.collection.name}`}
            className="flex min-w-0 items-center gap-1.5 hover:text-foreground focus-visible:text-foreground focus-visible:underline"
          >
            <Folder aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">{item.collection.name}</span>
          </Link>
        )}
        <span>Created {dateFormatter.format(item.createdAt)}</span>
        <span>Updated {dateFormatter.format(item.updatedAt)}</span>
      </footer>
    </ItemDetailShell>
  );
}
