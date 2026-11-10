"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, X } from "lucide-react";
import { useState } from "react";
import { COVER_FALLBACKS } from "@/lib/constants";
import { usePlayer } from "@/lib/player-context";
import { cn, initials } from "@/lib/utils";

/**
 * Floating bottom player. Self-positioned: sits just above the mobile tab bar
 * (site-ui's MobileNav is 4rem + safe-area tall) and lower on desktop.
 * Hidden on the immersive /sound/[id] page, which has its own full controls.
 */
export function MiniPlayer() {
  const { current, isPlaying, progress, duration, toggle, pause } = usePlayer();
  const pathname = usePathname();
  // Derived dismissal: remember which track was closed. A new track (or any
  // external resume) surfaces the bar again without an effect-driven reset.
  const [dismissedTrackId, setDismissedTrackId] = useState<number | null>(null);

  const dismissed =
    current !== null && dismissedTrackId === current.id && !isPlaying;

  if (!current || dismissed || pathname?.startsWith("/sound/")) return null;

  const percent =
    duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0;
  const fallback = COVER_FALLBACKS[current.id % COVER_FALLBACKS.length];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-4">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#17141b]/95 text-[#f7f3ec] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Link
            href={`/sound/${current.id}`}
            aria-label={`打开 ${current.title}`}
            className="relative size-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10"
          >
            {current.cover ? (
              <Image
                src={current.cover}
                alt=""
                width={96}
                height={96}
                className="size-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-full items-center justify-center bg-gradient-to-br text-base font-semibold text-white",
                  fallback,
                )}
              >
                {initials(current.title)}
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/sound/${current.id}`}
              className="block truncate text-sm font-medium text-[#f7f3ec] transition-colors hover:text-[#ff8a72]"
            >
              {current.title}
            </Link>
            <p className="mt-0.5 truncate text-xs text-white/45">
              {current.artist || "佚名"}
              <span aria-hidden="true" className="mx-1.5 text-white/25">
                ·
              </span>
              {current.categoryName}
            </p>
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "暂停播放" : "继续播放"}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ff5a3c] text-white shadow-[0_10px_24px_-10px_rgba(255,90,60,0.9)] transition hover:bg-[#ff7055] active:scale-95"
          >
            {isPlaying ? (
              <Pause aria-hidden="true" className="size-4 fill-current" />
            ) : (
              <Play aria-hidden="true" className="size-4 translate-x-px fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              pause();
              setDismissedTrackId(current.id);
            }}
            aria-label="关闭播放器"
            title="关闭"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="h-0.5 w-full bg-white/10" aria-hidden="true">
          <div
            className="h-full bg-[#ff5a3c] transition-[width] duration-300 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default MiniPlayer;
