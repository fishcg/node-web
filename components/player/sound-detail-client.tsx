"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Headphones,
  MessageCircle,
  Moon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { FavoriteButton } from "@/components/favorite-button";
import { PlayButton } from "@/components/player/play-button";
import { toPlayerTrack } from "@/components/sound-card";
import { CoverFallback } from "@/components/cover-fallback";
import { COVER_FALLBACKS, SECTION_BY_SLUG } from "@/lib/constants";
import { usePlayer } from "@/lib/player-context";
import type { Sound } from "@/lib/types";
import {
  cn,
  formatDate,
  formatDuration,
  formatMetric,
  initials,
} from "@/lib/utils";

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;
const SLEEP_OPTIONS = [15, 30, 60] as const;
const SKIP_SECONDS = 15;

interface SoundDetailClientProps {
  sound: Sound;
  related: Sound[];
  initialFavorited: boolean;
}

export function SoundDetailClient({
  sound,
  related,
  initialFavorited,
}: SoundDetailClientProps) {
  const {
    current,
    isPlaying,
    progress,
    duration,
    volume,
    playbackRate,
    play,
    toggle,
    seek,
    setVolume,
    setPlaybackRate,
    pause,
  } = usePlayer();

  const active = current?.id === sound.id;
  const playing = active && isPlaying;

  const track = useMemo(() => toPlayerTrack(sound), [sound]);
  const relatedTracks = useMemo(() => related.map((item) => toPlayerTrack(item)), [related]);
  const queue = useMemo(() => [track, ...relatedTracks], [track, relatedTracks]);

  const shownProgress = active ? progress : 0;
  const shownDuration = active ? duration : 0;
  const seekable = active && shownDuration > 0;
  const progressPercent = seekable
    ? Math.min(100, Math.max(0, (shownProgress / shownDuration) * 100))
    : 0;
  const totalTimeLabel = shownDuration > 0 ? formatDuration(shownDuration) : "--:--";
  // A missing audio source is an empty state, not a fatal error: keep the page
  // browsable but make the transport controls clearly inert.
  const playable = Boolean(track.url);

  const lastVolumeRef = useRef(volume > 0 ? volume : 0.8);
  useEffect(() => {
    if (volume > 0) lastVolumeRef.current = volume;
  }, [volume]);

  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);

  useEffect(() => {
    if (sleepMinutes === null) return;

    // The deadline lives inside the effect: `Date.now()` must not run while
    // rendering (React purity), and wall-clock math beats counting ticks.
    const endsAt = Date.now() + sleepMinutes * 60_000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSleepRemaining(left);
      if (left <= 0) {
        window.clearInterval(timer);
        setSleepMinutes(null);
        pause();
      }
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [sleepMinutes, pause]);

  function toggleSleepTimer(minutes: number) {
    if (sleepMinutes === minutes) {
      setSleepMinutes(null);
      setSleepRemaining(0);
      return;
    }
    setSleepMinutes(minutes);
    setSleepRemaining(minutes * 60);
  }

  const sectionInfo = SECTION_BY_SLUG.get(sound.section);
  const sectionName = sectionInfo?.name ?? "声音";
  const sectionShortName = sectionInfo?.shortName ?? sectionName;
  const coverFallback = COVER_FALLBACKS[sound.id % COVER_FALLBACKS.length];
  const authorName = sound.author || "佚名";
  const shareUrl = `/sound/${sound.id}`;

  function handlePrimaryToggle() {
    if (!playable) return;
    if (!active) {
      play(track, queue);
      return;
    }
    // A finished track would otherwise call play() from the very end.
    if (!isPlaying && shownDuration > 0 && shownProgress >= shownDuration - 0.5) {
      seek(0);
    }
    toggle();
  }

  function handleSkip(offset: number) {
    if (!active) return;
    seek(Math.max(0, Math.min(shownProgress + offset, shownDuration || shownProgress + offset)));
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    if (!active) return;
    seek(Number(event.target.value));
  }

  function handleVolume(event: ChangeEvent<HTMLInputElement>) {
    setVolume(Number(event.target.value));
  }

  function toggleMute() {
    setVolume(volume > 0 ? 0 : lastVolumeRef.current || 0.8);
  }

  async function copyShareLink() {
    const url =
      typeof window === "undefined"
        ? shareUrl
        : `${window.location.origin}${shareUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败，请手动复制地址栏链接");
    }
  }

  async function handleShare() {
    const url =
      typeof window === "undefined"
        ? shareUrl
        : `${window.location.origin}${shareUrl}`;
    const coarsePointer =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ?? false);

    if (
      coarsePointer &&
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: sound.subject,
          text: sound.summary || undefined,
          url,
        });
        return;
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
      }
    }

    await copyShareLink();
  }

  const VolumeIcon = volume <= 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Rendered in the transport row on desktop and in the secondary row on
  // narrow screens, where four chips would otherwise clip the play controls.
  const rateButtons = PLAYBACK_RATES.map((rate) => (
    <button
      key={rate}
      type="button"
      onClick={() => setPlaybackRate(rate)}
      aria-pressed={Math.abs(playbackRate - rate) < 0.01}
      aria-label={`${rate} 倍速`}
      className={cn(
        "rounded-full px-2 py-1 text-[11px] tabular-nums transition",
        Math.abs(playbackRate - rate) < 0.01
          ? "bg-[#ff5a3c]/20 text-[#ff9a86]"
          : "text-white/45 hover:text-white/80",
      )}
    >
      {rate === 1 ? "1×" : `${rate}×`}
    </button>
  ));

  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-[#0b0a0f] text-[#f7f3ec]">
      {/* cover-tinted glow: the blurred artwork color field behind everything */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={cn(
            "absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br opacity-35 blur-[130px] sm:opacity-40",
            coverFallback,
          )}
        />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#7c6cf0]/20 blur-[120px]" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#ff5a3c]/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(11,10,15,0.55)_60%,#0b0a0f_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-40 pt-6 sm:px-6 md:pb-20 lg:px-8">
        <Link
          href={`/category/${sound.section}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55 transition hover:border-white/25 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          返回{sectionShortName}
        </Link>

        <div className="mt-7 grid gap-8 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-14">
          {/* cover */}
          <div className="relative mx-auto w-full max-w-[320px] md:mx-0 md:max-w-none">
            <div
              aria-hidden="true"
              className={cn(
                "absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br opacity-30 blur-2xl",
                coverFallback,
              )}
            />
            <div className="relative aspect-square w-full overflow-hidden rounded-[28px] ring-1 ring-white/15 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]">
              {sound.photo ? (
                <Image
                  src={sound.photo}
                  alt={sound.subject || "声音封面"}
                  fill
                  priority
                  sizes="(min-width: 1024px) 360px, (min-width: 768px) 300px, 90vw"
                  className="object-cover"
                />
              ) : (
                <CoverFallback
                  id={sound.id}
                  section={sound.section}
                  size="lg"
                />
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/5"
              />
            </div>
          </div>

          {/* title + meta + controls */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/category/${sound.section}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ff5a3c]/35 bg-[#ff5a3c]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[#ff9a86] transition hover:border-[#ff5a3c]/60"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[#ff5a3c]" />
                {sectionShortName}
              </Link>
              {sound.categoryName ? (
                <Link
                  href={`/category/${sound.section}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/55 transition hover:border-white/25 hover:text-white/80"
                >
                  {sound.categoryName}
                </Link>
              ) : null}

              <div className="ml-auto flex items-center gap-2">
                <FavoriteButton musicId={sound.id} initialFavorited={initialFavorited} />
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="分享这个声音"
                  title="分享"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <Share2 aria-hidden="true" className="size-[18px]" />
                </button>
              </div>
            </div>

            <h1 className="mt-5 text-balance font-serif text-[clamp(1.75rem,4.6vw,3rem)] leading-[1.18] tracking-tight text-[#f7f3ec]">
              {sound.subject || "无题声音"}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#7c6cf0] to-[#4b3fb0] text-[10px] font-semibold text-white/90"
                >
                  {initials(authorName)}
                </span>
                <span className="text-white/65">{authorName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {sound.created ? formatDate(sound.created) : "未知日期"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Headphones aria-hidden="true" className="size-3.5" />
                {formatMetric(sound.views)} 次播放
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle aria-hidden="true" className="size-3.5" />
                {formatMetric(sound.replies)} 条评论
              </span>
            </div>

            {/* player surface */}
            <div className="mt-7 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between gap-3 text-[11px] tabular-nums text-white/40">
                <span>{formatDuration(shownProgress)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      playing ? "animate-pulse bg-[#ff5a3c]" : "bg-white/25",
                    )}
                  />
                  {!playable ? "音源缺失" : active ? (playing ? "正在播放" : "已暂停") : "尚未播放"}
                </span>
                <span>{totalTimeLabel}</span>
              </div>

              <input
                type="range"
                min={0}
                max={seekable ? shownDuration : 1}
                step={0.1}
                value={seekable ? Math.min(shownProgress, shownDuration) : 0}
                onChange={handleSeek}
                disabled={!seekable || !playable}
                aria-label="播放进度"
                style={{
                  background: `linear-gradient(to right, #ff5a3c 0%, #ff5a3c ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%, rgba(255,255,255,0.15) 100%)`,
                }}
                className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#ff5a3c] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff5a3c] [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,90,60,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:flex-nowrap sm:justify-start sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleSkip(-SKIP_SECONDS)}
                  disabled={!active || !playable}
                  aria-label={`后退 ${SKIP_SECONDS} 秒`}
                  className="inline-flex size-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  <span className="text-[9px] font-semibold leading-none tracking-tight">
                    {SKIP_SECONDS}s
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePrimaryToggle}
                  disabled={!playable}
                  aria-label={!playable ? "该声音暂不可播放" : playing ? "暂停播放" : "开始播放"}
                  className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[#ff5a3c] text-white shadow-[0_22px_50px_-14px_rgba(255,90,60,0.85)] transition hover:bg-[#ff7055] active:scale-95 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40 disabled:shadow-none disabled:active:scale-100"
                >
                  {playing ? (
                    <Pause aria-hidden="true" className="size-6 fill-current" />
                  ) : (
                    <Play aria-hidden="true" className="size-6 translate-x-0.5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSkip(SKIP_SECONDS)}
                  disabled={!active || !playable}
                  aria-label={`快进 ${SKIP_SECONDS} 秒`}
                  className="inline-flex size-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100"
                >
                  <RotateCw aria-hidden="true" className="size-4" />
                  <span className="text-[9px] font-semibold leading-none tracking-tight">
                    {SKIP_SECONDS}s
                  </span>
                </button>

                <div className="ml-1 hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={volume > 0 ? "静音" : "取消静音"}
                    className="inline-flex size-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <VolumeIcon aria-hidden="true" className="size-[18px]" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolume}
                    aria-label="音量"
                    className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#ff5a3c]"
                  />
                </div>

                <div className="ml-auto hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 sm:flex">
                  {rateButtons}
                </div>
              </div>

              {/* mobile volume + playback rate + sleep timer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-2 sm:mt-3 sm:justify-end">
                <div className="flex items-center gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={volume > 0 ? "静音" : "取消静音"}
                    className="inline-flex size-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <VolumeIcon aria-hidden="true" className="size-4" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolume}
                    aria-label="音量"
                    className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#ff5a3c]"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 sm:hidden">
                  {rateButtons}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                  <Moon aria-hidden="true" className="size-3.5" />
                  <span className="mr-0.5">睡眠定时</span>
                  {SLEEP_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => toggleSleepTimer(minutes)}
                      aria-pressed={sleepMinutes === minutes}
                      className={cn(
                        "rounded-full border px-2 py-0.5 tabular-nums transition",
                        sleepMinutes === minutes
                          ? "border-[#ff5a3c]/50 bg-[#ff5a3c]/15 text-[#ff9a86]"
                          : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/75",
                      )}
                    >
                      {minutes}分
                    </button>
                  ))}
                  {sleepMinutes !== null ? (
                    <span className="ml-1 tabular-nums text-[#ff9a86]">
                      {formatDuration(sleepRemaining)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-14">
          <section aria-labelledby="about-heading" className="min-w-0">
            <h2
              id="about-heading"
              className="font-serif text-xl tracking-tight text-[#f7f3ec] sm:text-2xl"
            >
              声音简介
            </h2>
            <div className="mt-4 whitespace-pre-line rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/60 sm:p-6">
              {sound.summary || "这个声音还没有简介，戴上耳机直接听吧。"}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "分类", value: sound.categoryName || sectionName },
                { label: "发布", value: sound.created ? formatDate(sound.created) : "未知" },
                { label: "播放", value: formatMetric(sound.views) },
                { label: "评论", value: formatMetric(sound.replies) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <dt className="text-[11px] text-white/35">{item.label}</dt>
                  <dd className="mt-1 truncate text-sm text-white/75">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <aside aria-labelledby="related-heading" className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="related-heading"
                className="font-serif text-xl tracking-tight text-[#f7f3ec] sm:text-2xl"
              >
                相关推荐
              </h2>
              <Link
                href={`/category/${sound.section}`}
                className="text-xs text-white/40 transition hover:text-[#ff9a86]"
              >
                更多{sectionShortName}
              </Link>
            </div>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
              {related.length === 0 ? (
                <p className="p-5 text-sm text-white/40">暂无相关推荐。</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {related.map((item) => {
                    const itemTrack = toPlayerTrack(item);
                    return (
                      <li key={item.id}>
                        <div className="group flex items-center gap-3 p-3 transition hover:bg-white/[0.04]">
                          <Link
                            href={`/sound/${item.id}`}
                            className="relative size-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10"
                          >
                            {item.photo ? (
                              <Image
                                src={item.photo}
                                alt=""
                                width={96}
                                height={96}
                                className="size-full object-cover"
                              />
                            ) : (
                              <CoverFallback
                                id={item.id}
                                section={item.section}
                                size="sm"
                              />
                            )}
                          </Link>
                          <Link href={`/sound/${item.id}`} className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white/80 transition group-hover:text-[#ff9a86]">
                              {item.subject || "无题声音"}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/40">
                              <span className="truncate">{item.author || "佚名"}</span>
                              <span aria-hidden="true" className="text-white/20">
                                ·
                              </span>
                              <span className="shrink-0">{formatMetric(item.views)} 播放</span>
                            </p>
                          </Link>
                          <PlayButton
                            track={itemTrack}
                            queue={queue}
                            className="size-9"
                            label={`播放 ${item.subject || "这个声音"}`}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default SoundDetailClient;
