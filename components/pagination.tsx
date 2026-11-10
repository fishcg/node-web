import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Build the href for a given 1-based page number. */
  hrefFor: (page: number) => string;
  className?: string;
}

type PageItem = number | "gap-start" | "gap-end";

function buildItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("gap-start");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push("gap-end");
  items.push(totalPages);

  return items;
}

const ARROW =
  "grid size-9 place-items-center rounded-full border border-line bg-paper-warm text-ink-soft transition hover:border-line-strong hover:bg-paper hover:text-ink";

/** Quiet paper pagination used by category, search and favorites pages. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);

  return (
    <nav
      aria-label="分页"
      className={cn(
        "mt-10 flex items-center justify-center gap-1.5 sm:mt-14",
        className,
      )}
    >
      {current > 1 ? (
        <Link
          href={hrefFor(current - 1)}
          aria-label="上一页"
          className={ARROW}
          rel="prev"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(ARROW, "opacity-40")}>
          <ChevronLeft className="size-4" strokeWidth={1.8} />
        </span>
      )}

      <div className="mx-1 flex items-center gap-1">
        {buildItems(current, totalPages).map((item) =>
          typeof item === "number" ? (
            <Link
              key={item}
              href={hrefFor(item)}
              aria-current={item === current ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-full text-sm transition",
                item === current
                  ? "bg-ink font-medium text-paper shadow-[0_10px_18px_-12px_rgba(28,25,23,0.9)]"
                  : "text-ink-soft hover:bg-paper-deep hover:text-ink",
              )}
            >
              {item}
            </Link>
          ) : (
            <span
              key={item}
              aria-hidden
              className="grid size-9 place-items-center text-sm text-ink-muted"
            >
              …
            </span>
          ),
        )}
      </div>

      {current < totalPages ? (
        <Link
          href={hrefFor(current + 1)}
          aria-label="下一页"
          className={ARROW}
          rel="next"
        >
          <ChevronRight className="size-4" strokeWidth={1.8} aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(ARROW, "opacity-40")}>
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </span>
      )}
    </nav>
  );
}
