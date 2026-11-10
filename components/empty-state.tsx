import { Disc3 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Quiet, on-brand placeholder for empty rails, empty search results and
 * logged-out collections. Stays server-rendered so pages can use it freely.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[28px] border border-dashed border-line-strong/80 bg-paper-warm/50 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full border border-line bg-paper text-ink-muted shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
        {icon ?? <Disc3 className="size-6" strokeWidth={1.4} aria-hidden />}
      </span>
      <h3 className="mt-4 font-serif text-xl text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
