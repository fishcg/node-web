import { Headphones } from "lucide-react";
import { COVER_FALLBACKS, SECTION_BY_SLUG } from "@/lib/constants";
import type { SectionSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CoverFallbackProps {
  id: number;
  section?: SectionSlug;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Decorative cover used when a sound has no artwork. It avoids rendering the
 * first character of a title (numbers look like layout bugs) and instead shows
 * a headphone glyph plus the section name.
 */
export function CoverFallback({
  id,
  section,
  size = "md",
  className,
}: CoverFallbackProps) {
  const gradient = COVER_FALLBACKS[Math.abs(id) % COVER_FALLBACKS.length];
  const label = section ? SECTION_BY_SLUG.get(section)?.shortName : null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-linear-to-br",
        gradient,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.42),transparent_62%)]" />
      <div className="vinyl-grooves absolute inset-0 opacity-40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/85">
        <Headphones
          strokeWidth={1.2}
          className={cn(
            size === "lg" ? "size-14" : size === "sm" ? "size-4" : "size-7",
          )}
        />
        {size !== "sm" && label ? (
          <span
            className={cn(
              "font-serif tracking-[0.22em] text-white/60",
              size === "lg" ? "text-xs" : "text-[9px]",
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
