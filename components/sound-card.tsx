import Image from "next/image";
import Link from "next/link";
import { Headphones, Sparkles } from "lucide-react";
import { CoverFallback } from "@/components/cover-fallback";
import { FavoriteButton } from "@/components/favorite-button";
import { PlayButton } from "@/components/player/play-button";
import { SECTION_BY_SLUG } from "@/lib/constants";
import type { PlayerTrack, Sound } from "@/lib/types";
import { assetUrl, cn, formatDate, formatViews } from "@/lib/utils";

interface SoundCardProps {
  sound: Sound;
  favorited?: boolean;
  priority?: boolean;
  variant?: "grid" | "rail";
}

/** Map a catalog row to the shape the global player expects. */
export function toPlayerTrack(sound: Sound): PlayerTrack {
  return {
    id: sound.id,
    title: sound.subject,
    artist: sound.author,
    cover: assetUrl(sound.photo),
    url: assetUrl(sound.url),
    categoryName: sound.categoryName,
    section: sound.section,
  };
}


/**
 * Cover-led sound card used by every list surface. The cover itself is a
 * click target, while the play / favorite controls float above it.
 */
export function SoundCard({
  sound,
  favorited = false,
  priority = false,
  variant = "grid",
}: SoundCardProps) {
  const cover = assetUrl(sound.photo);
  const track = toPlayerTrack(sound);
  const section = SECTION_BY_SLUG.get(sound.section);
  const isRail = variant === "rail";

  return (
    <article
      className={cn(
        "group relative flex flex-col",
        isRail &&
          "w-[71vw] max-w-[264px] shrink-0 snap-start sm:w-[252px]",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px] border border-line/80 bg-paper-deep shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] transition duration-500 ease-[var(--ease-soft)] group-hover:-translate-y-1 group-hover:shadow-[0_26px_48px_-30px_rgba(28,25,23,0.55)]">
        <Link
          href={`/sound/${sound.id}`}
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0 z-10"
        >
          <span className="sr-only">{sound.subject}</span>
        </Link>

        {cover ? (
          <Image
            src={cover}
            alt={sound.subject}
            fill
            priority={priority}
            sizes={
              isRail
                ? "(min-width: 1024px) 264px, 71vw"
                : "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 50vw"
            }
            className="object-cover transition duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.035]"
          />
        ) : (
          <CoverFallback id={sound.id} section={sound.section} />
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-black/5 to-transparent opacity-90" />

        <div className="absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/25 bg-paper/25 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-white backdrop-blur-md">
            {section?.shortName ?? sound.categoryName}
          </span>
          <FavoriteButton
            musicId={sound.id}
            initialFavorited={favorited}
            size="sm"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-md">
            {sound.views > 0 ? (
              <>
                <Headphones className="size-3.5" strokeWidth={1.8} aria-hidden />
                {formatViews(sound.views)}
              </>
            ) : (
              <>
                <Sparkles className="size-3" strokeWidth={1.8} aria-hidden />
                新声
              </>
            )}
          </span>
          <span className="pointer-events-auto">
            <PlayButton
              track={track}
              className="shadow-[0_14px_30px_-12px_rgba(0,0,0,0.75)]"
            />
          </span>
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-ink sm:text-base">
          <Link
            href={`/sound/${sound.id}`}
            className="transition-colors duration-300 hover:text-coral-deep"
          >
            {sound.subject}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="truncate">{sound.author || "佚名"}</span>
          <span
            className="size-0.5 shrink-0 rounded-full bg-ink-muted/60"
            aria-hidden
          />
          <span className="shrink-0">{formatDate(sound.created)}</span>
        </p>
      </div>
    </article>
  );
}
