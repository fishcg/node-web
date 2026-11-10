"use client";

import Image from "next/image";
import Link from "next/link";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { CoverFallback } from "@/components/cover-fallback";
import { PlayButton } from "@/components/player/play-button";
import type { PlayerTrack } from "@/lib/types";
import { assetUrl } from "@/lib/utils";

const RECENT_KEY = "acgay:recent";
const MAX_ITEMS = 6;

function isTrack(value: unknown): value is PlayerTrack {
  if (!value || typeof value !== "object") return false;
  const track = value as Partial<PlayerTrack>;
  return (
    typeof track.id === "number" &&
    typeof track.title === "string" &&
    typeof track.url === "string"
  );
}

function readRecent(): PlayerTrack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTrack).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/**
 * "继续收听" shelf. Reads the player's localStorage history on the client so
 * nothing personal is rendered on the server.
 */
export function ContinueListening() {
  const [tracks, setTracks] = useState<PlayerTrack[] | null>(null);

  useEffect(() => {
    const load = () => setTracks(readRecent());
    load();

    window.addEventListener("focus", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full border border-line bg-paper-warm text-ink-muted">
          <History className="size-4" strokeWidth={1.7} aria-hidden />
        </span>
        <div>
          <h2 className="font-serif text-xl text-ink sm:text-2xl">继续收听</h2>
          <p className="text-xs tracking-wide text-ink-muted">
            从上次断开的地方接着听
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track) => {
          const cover = assetUrl(track.cover);
          return (
            <div
              key={track.id}
              className="group flex items-center gap-3 rounded-2xl border border-line/80 bg-paper-warm/70 p-2.5 backdrop-blur-sm transition duration-300 hover:border-line-strong hover:bg-paper-warm"
            >
              <Link
                href={`/sound/${track.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-line/70">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <CoverFallback
                      id={track.id}
                      section={track.section}
                      size="sm"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-coral-deep">
                    {track.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {track.artist || "佚名"}
                    {track.categoryName ? ` · ${track.categoryName}` : ""}
                  </p>
                </div>
              </Link>
              <PlayButton track={track} className="shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
