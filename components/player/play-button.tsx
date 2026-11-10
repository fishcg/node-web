"use client";

import { Pause, Play } from "lucide-react";
import type { MouseEvent } from "react";
import { usePlayer } from "@/lib/player-context";
import type { PlayerTrack } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PlayButtonProps {
  track: PlayerTrack;
  className?: string;
  /** Accessible label used while the track is paused. */
  label?: string;
  variant?: "solid" | "ghost";
  /** Optional queue so `next()`/`prev()` can walk the list the track came from. */
  queue?: PlayerTrack[];
}

const BASE_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-full outline-none transition duration-200 " +
  "focus-visible:ring-2 focus-visible:ring-[#ff5a3c]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent " +
  "active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100";

const VARIANT_CLASSES = {
  solid:
    "size-11 bg-[#ff5a3c] text-white shadow-[0_12px_30px_-12px_rgba(255,90,60,0.85)] " +
    "hover:bg-[#ff7055] hover:shadow-[0_16px_36px_-12px_rgba(255,90,60,0.9)]",
  ghost:
    "size-10 border border-current/20 bg-transparent text-current " +
    "hover:border-[#ff5a3c] hover:text-[#ff5a3c]",
} as const;

export function PlayButton({
  track,
  className,
  label,
  variant = "solid",
  queue,
}: PlayButtonProps) {
  const { current, isPlaying, play, toggle, progress, duration, seek } = usePlayer();

  const isActive = current?.id === track.id;
  const playing = isActive && isPlaying;
  const disabled = !track.url;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // SoundCard wraps the whole card in a <Link>; never navigate on play.
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    if (!isActive) {
      play(track, queue);
      return;
    }

    // A finished track toggled from the end would stop again immediately.
    if (!isPlaying && duration > 0 && progress >= duration - 0.5) {
      seek(0);
    }
    toggle();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={playing ? `暂停 ${track.title}` : (label ?? `播放 ${track.title}`)}
      aria-pressed={isActive ? isPlaying : false}
      title={playing ? "暂停" : (label ?? "播放")}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
    >
      {playing ? (
        <Pause aria-hidden="true" className="size-[1.1em] fill-current" />
      ) : (
        <Play aria-hidden="true" className="size-[1.1em] translate-x-[6%] fill-current" />
      )}
    </button>
  );
}

export default PlayButton;
