import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ITEMS_PER_PAGE } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
}

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = buttonVariants({ variant: "outline" });

  if (disabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        className={cn(className, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

export default function Pagination({
  basePath,
  page,
  totalPages,
  total,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const first = (page - 1) * ITEMS_PER_PAGE + 1;
  const last = Math.min(page * ITEMS_PER_PAGE, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4"
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        <PageLink
          href={pageHref(basePath, page - 1)}
          disabled={page === 1}
          label="Previous page"
        >
          <ChevronLeft aria-hidden />
          Previous
        </PageLink>
        <span
          aria-current="page"
          className="px-1 text-sm text-muted-foreground tabular-nums"
        >
          <span aria-hidden>
            {page} / {totalPages}
          </span>
          <span className="sr-only">
            Page {page} of {totalPages}
          </span>
        </span>
        <PageLink
          href={pageHref(basePath, page + 1)}
          disabled={page === totalPages}
          label="Next page"
        >
          Next
          <ChevronRight aria-hidden />
        </PageLink>
      </div>
    </nav>
  );
}
