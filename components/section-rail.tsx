import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SoundCard } from "@/components/sound-card";
import type { Sound } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SectionRailProps {
  title: string;
  eyebrow?: string;
  description?: string;
  sounds: Sound[];
  href?: string;
  linkLabel?: string;
  favoritedIds?: ReadonlySet<number>;
  badge?: string;
  className?: string;
}

/**
 * Horizontal, snap-scrolling shelf of sound cards. Empty rails render
 * nothing so the homepage never shows a hole.
 */
export function SectionRail({
  title,
  eyebrow,
  description,
  sounds,
  href,
  linkLabel = "查看全部",
  favoritedIds,
  badge,
  className,
}: SectionRailProps) {
  if (sounds.length === 0) return null;

  return (
    <section className={cn("mt-14 sm:mt-20", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.28em] text-coral-deep">
              <span className="h-px w-6 bg-coral/60" aria-hidden />
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 font-serif text-2xl text-ink sm:text-[28px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-2 py-1 text-sm text-ink-soft transition hover:border-line hover:bg-paper-warm hover:text-ink"
          >
            {linkLabel}
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.7}
              aria-hidden
            />
          </Link>
        ) : badge ? (
          <span className="shrink-0 rounded-full border border-line bg-paper-warm px-3 py-1 text-[11px] tracking-wide text-ink-muted">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:px-0">
        {sounds.map((sound, index) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            variant="rail"
            favorited={favoritedIds?.has(sound.id) ?? false}
            priority={index < 2}
          />
        ))}
      </div>
    </section>
  );
}
