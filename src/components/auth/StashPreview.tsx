import {
  Code,
  Link as LinkIcon,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

interface PreviewItem {
  title: string;
  excerpt: string;
  type: string;
  Icon: LucideIcon;
  tone: string;
}

const PREVIEW_ITEMS: PreviewItem[] = [
  {
    title: "Undo last commit, keep changes",
    excerpt: "git reset --soft HEAD~1",
    type: "Command",
    Icon: Terminal,
    tone: "bg-[#f97316]/15 text-[#f97316]",
  },
  {
    title: "useDebounce hook",
    excerpt: "const value = useDebounce(query, 300)",
    type: "Snippet",
    Icon: Code,
    tone: "bg-[#3b82f6]/15 text-[#3b82f6]",
  },
  {
    title: "Review a PR for security issues",
    excerpt: "You are a senior engineer reviewing a diff for...",
    type: "Prompt",
    Icon: Sparkles,
    tone: "bg-[#8b5cf6]/15 text-[#8b5cf6]",
  },
  {
    title: "Prisma migrate reference",
    excerpt: "prisma.io/docs/orm/prisma-migrate",
    type: "URL",
    Icon: LinkIcon,
    tone: "bg-[#10b981]/15 text-[#10b981]",
  },
];

export function StashPreview() {
  return (
    <ul className="flex flex-col gap-2.5" aria-hidden="true">
      {PREVIEW_ITEMS.map(({ title, excerpt, type, Icon, tone }) => (
        <li
          key={title}
          className="flex items-center gap-3 rounded-xl border bg-background/60 p-3"
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
          >
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{title}</span>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {excerpt}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{type}</span>
        </li>
      ))}
    </ul>
  );
}
