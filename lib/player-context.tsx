"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PlayerTrack } from "@/lib/types";

/** localStorage key shared with the homepage "继续收听" rail. */
export const RECENT_TRACKS_KEY = "acgay:recent";
export const MAX_RECENT_TRACKS = 6;

const DEFAULT_VOLUME = 0.8;
const MIN_PLAYBACK_RATE = 0.5;
const MAX_PLAYBACK_RATE = 2;

export interface PlayerContextValue {
  current: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  /** Current playback position in seconds. */
  progress: number;
  /** Track duration in seconds (0 until metadata is available). */
  duration: number;
  volume: number;
  playbackRate: number;
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  prev: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normaliseTrack(track: PlayerTrack): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    cover: track.cover,
    url: track.url,
    categoryName: track.categoryName,
    section: track.section,
  };
}

function isPlayerTrack(value: unknown): value is PlayerTrack {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PlayerTrack>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.section === "string"
  );
}

/** Best-effort persistence: storage can be disabled (private mode / quota). */
function rememberRecentTrack(track: PlayerTrack) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RECENT_TRACKS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const stored = Array.isArray(parsed) ? parsed.filter(isPlayerTrack) : [];
    const recent = [
      normaliseTrack(track),
      ...stored.filter((item) => item.id !== track.id),
    ].slice(0, MAX_RECENT_TRACKS);
    window.localStorage.setItem(RECENT_TRACKS_KEY, JSON.stringify(recent));
  } catch {
    // Ignore storage failures — the recent rail is a progressive enhancement.
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [playbackRate, setPlaybackRateState] = useState(1);

  // Refs keep callbacks stable while always reading the freshest state.
  const currentRef = useRef<PlayerTrack | null>(null);
  const queueRef = useRef<PlayerTrack[]>([]);
  const loadedTrackIdRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const nextRef = useRef<() => void>(() => {});
  const prevRef = useRef<() => void>(() => {});

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const play = useCallback((track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
    if (!track || !track.url) return;

    const list = nextQueue && nextQueue.length > 0 ? nextQueue : [track];
    const sameTrack = currentRef.current?.id === track.id;

    queueRef.current = list;
    setQueue(list);
    currentRef.current = track;
    setCurrent(track);
    rememberRecentTrack(track);

    const audio = audioRef.current;
    if (!audio) return;

    if (!sameTrack || loadedTrackIdRef.current !== track.id) {
      loadedTrackIdRef.current = track.id;
      pendingSeekRef.current = null;
      audio.src = track.url;
      audio.load();
      setProgress(0);
      setDuration(0);
    }

    const started = audio.play();
    if (started && typeof started.catch === "function") {
      started.catch(() => setIsPlaying(false));
    }
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    if (audio.paused) {
      const started = audio.play();
      if (started && typeof started.catch === "function") {
        started.catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const target = Math.max(0, seconds);

    // Before metadata is known the element rejects currentTime, so remember
    // the request and apply it once `loadedmetadata` fires.
    if (audio.readyState === 0) {
      pendingSeekRef.current = target;
      setProgress(target);
      return;
    }

    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : target;
    const clamped = clamp(target, 0, max);
    try {
      audio.currentTime = clamped;
    } catch {
      pendingSeekRef.current = clamped;
    }
    setProgress(clamped);
  }, []);

  const next = useCallback(() => {
    const list = queueRef.current;
    const active = currentRef.current;
    if (list.length === 0) return;

    const index = active ? list.findIndex((item) => item.id === active.id) : -1;
    const upcoming = list[index + 1];

    if (upcoming) {
      play(upcoming, list);
      return;
    }

    // End of the queue: stop at the beginning instead of looping.
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Metadata may not be loaded yet; the next play() resets the source.
      }
    }
    setProgress(0);
    setIsPlaying(false);
  }, [play]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    const list = queueRef.current;
    const active = currentRef.current;

    if (audio && audio.currentTime > 3) {
      seek(0);
      return;
    }

    const index = active ? list.findIndex((item) => item.id === active.id) : -1;
    const previous = index > 0 ? list[index - 1] : null;
    if (previous) {
      play(previous, list);
      return;
    }
    seek(0);
  }, [play, seek]);

  const setVolume = useCallback((value: number) => {
    const nextVolume = clamp(value, 0, 1);
    setVolumeState(nextVolume);
    if (audioRef.current) audioRef.current.volume = nextVolume;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const nextRate = clamp(rate, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
    setPlaybackRateState(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  }, []);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  useEffect(() => {
    prevRef.current = prev;
  }, [prev]);

  // One <audio> element for the whole app: mounted here, never re-created on
  // navigation, so playback survives route changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = DEFAULT_VOLUME;
    audio.playbackRate = 1;

    const handleTimeUpdate = () => setProgress(audio.currentTime || 0);
    const handleDurationChange = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleLoadedMetadata = () => {
      const knownDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(knownDuration);
      const pending = pendingSeekRef.current;
      if (pending !== null) {
        pendingSeekRef.current = null;
        try {
          audio.currentTime = clamp(pending, 0, knownDuration > 0 ? knownDuration : pending);
        } catch {
          // Ignore — playback still starts from the beginning.
        }
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      nextRef.current();
    };
    const handleError = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // Media Session: lock-screen / hardware media keys.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    const handleSeekBy = (offset: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seek((audio.currentTime || 0) + offset);
    };

    try {
      session.setActionHandler("play", () => {
        const audio = audioRef.current;
        if (!audio || !currentRef.current) return;
        const started = audio.play();
        if (started && typeof started.catch === "function") {
          started.catch(() => setIsPlaying(false));
        }
      });
      session.setActionHandler("pause", () => audioRef.current?.pause());
      session.setActionHandler("nexttrack", () => nextRef.current());
      session.setActionHandler("previoustrack", () => prevRef.current());
      session.setActionHandler("seekbackward", (details) =>
        handleSeekBy(-(details.seekOffset ?? 15)),
      );
      session.setActionHandler("seekforward", (details) =>
        handleSeekBy(details.seekOffset ?? 15),
      );
      session.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") seek(details.seekTime);
      });
      session.setActionHandler("stop", () => {
        audioRef.current?.pause();
        seek(0);
      });
    } catch {
      // Older browsers expose a partial Media Session implementation.
    }

    return () => {
      try {
        session.setActionHandler("play", null);
        session.setActionHandler("pause", null);
        session.setActionHandler("nexttrack", null);
        session.setActionHandler("previoustrack", null);
        session.setActionHandler("seekbackward", null);
        session.setActionHandler("seekforward", null);
        session.setActionHandler("seekto", null);
        session.setActionHandler("stop", null);
      } catch {
        // Ignore unsupported handlers.
      }
    };
  }, [seek]);

  // Metadata shown on the lock screen / media notification.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    if (!current) {
      session.metadata = null;
      return;
    }

    if (typeof MediaMetadata === "undefined") return;

    session.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.categoryName,
      artwork: current.cover ? [{ src: current.cover, sizes: "512x512" }] : [],
    });
  }, [current]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = current
        ? isPlaying
          ? "playing"
          : "paused"
        : "none";
    } catch {
      // Ignore browsers that do not allow writing playbackState.
    }
  }, [current, isPlaying]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      isPlaying,
      progress,
      duration,
      volume,
      playbackRate,
      play,
      toggle,
      pause,
      seek,
      next,
      prev,
      setVolume,
      setPlaybackRate,
    }),
    [
      current,
      queue,
      isPlaying,
      progress,
      duration,
      volume,
      playbackRate,
      play,
      toggle,
      pause,
      seek,
      next,
      prev,
      setVolume,
      setPlaybackRate,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" playsInline className="hidden" />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside <PlayerProvider> (mounted in app/layout.tsx).");
  }
  return context;
}
