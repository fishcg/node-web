"use client";

import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import type { PlayerTrack } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeroPlayButtonProps {
  tracks: PlayerTrack[];
  className?: string;
}

/**
 * Plays the hero's featured shelf as a queue. Kept tiny so the hero itself
 * can stay a server component.
 */
export function HeroPlayButton({ tracks, className }: HeroPlayButtonProps) {
  const { current, isPlaying, play, toggle } = usePlayer();

  if (tracks.length === 0) return null;

  const first = tracks[0];
  const isActive = current?.id === first.id;
  const showingPause = isActive && isPlaying;

  function handleClick() {
    if (isActive) {
      toggle();
      return;
    }
    play(first, tracks);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-[0_18px_36px_-18px_rgba(28,25,23,0.85)] transition duration-300 hover:-translate-y-0.5 hover:bg-ink-soft active:translate-y-0",
        className,
      )}
    >
      <span className="grid size-6 place-items-center rounded-full bg-coral text-white">
        {showingPause ? (
          <Pause className="size-3.5 fill-current" strokeWidth={0} aria-hidden />
        ) : (
          <Play className="size-3.5 fill-current" strokeWidth={0} aria-hidden />
        )}
      </span>
      {showingPause ? "暂停精选" : "播放精选"}
    </button>
  );
}
