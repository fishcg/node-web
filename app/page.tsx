import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Disc3,
  Headphones,
  Search,
  Sparkles,
} from "lucide-react";
import { ContinueListening } from "@/components/continue-listening";
import { EmptyState } from "@/components/empty-state";
import { HeroPlayButton } from "@/components/hero-play-button";
import { SectionRail } from "@/components/section-rail";
import { toPlayerTrack } from "@/components/sound-card";
import { getSessionUser } from "@/lib/auth";
import { COVER_FALLBACKS, SECTIONS, SITE } from "@/lib/constants";
import { getFavoriteIds, getHomeData } from "@/lib/queries/sounds";
import type { Sound } from "@/lib/types";
import { assetUrl, cn, initials } from "@/lib/utils";

function HeroCollage({ sounds }: { sounds: Sound[] }) {
  const cards = sounds.slice(0, 4);
  const tilts = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        aria-hidden
        className="absolute -right-2 -top-5 size-24 rounded-full border border-line/80 bg-paper-warm/60 backdrop-blur-sm sm:size-28"
      >
        <span className="vinyl-grooves absolute inset-2 rounded-full opacity-60" />
        <span className="absolute inset-[38%] rounded-full bg-ink/80" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {cards.map((sound, index) => {
          const cover = assetUrl(sound.photo);
          const gradient =
            COVER_FALLBACKS[Math.abs(sound.id) % COVER_FALLBACKS.length];

          return (
            <Link
              key={sound.id}
              href={`/sound/${sound.id}`}
              className={cn(
                "group relative block overflow-hidden rounded-[22px] border border-line/80 bg-paper-warm shadow-soft transition duration-500 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-lift",
                tilts[index % tilts.length],
                index % 2 === 1 && "translate-y-5",
              )}
            >
              <div className="relative aspect-square">
                {cover ? (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 220px"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    priority={index < 2}
                  />
                ) : (
                  <div
                    className={cn(
                      "grid size-full place-items-center bg-linear-to-br font-serif text-4xl text-white/80",
                      gradient,
                    )}
                  >
                    {initials(sound.subject)}
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/0 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="line-clamp-2 font-serif text-[13px] leading-snug text-paper">
                    {sound.subject}
                  </p>
                  <p className="mt-1 text-[10px] tracking-wide text-paper/60">
                    {sound.categoryName}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mx-auto mt-9 flex w-fit items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[11px] tracking-wide text-ink-muted shadow-soft sm:mt-10">
        <Headphones className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
        戴上耳机，把音量调低一点
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [home, user] = await Promise.all([getHomeData(), getSessionUser()]);
  const favoritedIds = user ? await getFavoriteIds(user.id) : undefined;

  const heroCovers =
    home.featured.length > 0 ? home.featured : home.newest.slice(0, 4);
  const heroTracks = heroCovers.map(toPlayerTrack);
  const sectionEntries = SECTIONS.map((section) => ({
    section,
    sounds: home.sections[section.slug] ?? [],
  })).filter((entry) => entry.sounds.length > 0);

  const isEmpty =
    home.featured.length === 0 &&
    home.newest.length === 0 &&
    sectionEntries.length === 0;

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(52rem_30rem_at_78%_-6%,rgba(255,90,60,0.10),transparent_62%),radial-gradient(40rem_26rem_at_6%_4%,rgba(124,108,240,0.08),transparent_64%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-warm/80 px-3.5 py-1.5 text-[11px] tracking-[0.18em] text-ink-muted backdrop-blur-sm">
              <Sparkles className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
              深夜播放台 · {SITE.shortName}
            </span>

            <h1 className="mt-6 font-serif text-[clamp(2.15rem,7.4vw,4.25rem)] leading-[1.12] tracking-[-0.01em] text-ink">
              把耳机戴好，
              <span className="mt-1 block text-ink">
                世界就<span className="text-coral">安静</span>了。
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
              {SITE.description}
            </p>

            <form
              action="/search"
              method="get"
              role="search"
              className="mt-7 flex max-w-xl items-center gap-2 rounded-full border border-line bg-paper-warm/90 p-1.5 pl-4 shadow-soft transition focus-within:border-coral/50 focus-within:shadow-lift"
            >
              <Search
                className="size-4 shrink-0 text-ink-muted"
                strokeWidth={1.8}
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="搜索音声、音乐、有声书…"
                aria-label="搜索声音"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted/80"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition duration-300 hover:bg-coral-deep"
              >
                搜索
              </button>
            </form>

            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
              <HeroPlayButton
                tracks={heroTracks}
                className="inline-flex items-center gap-2.5 rounded-full bg-coral px-5 py-3 text-sm font-medium text-white shadow-[0_16px_36px_-16px_rgba(255,90,60,0.9)] transition duration-300 hover:bg-coral-deep"
              />

              <div className="flex items-center gap-7">
                <div>
                  <p className="font-serif text-2xl leading-none text-ink">
                    {home.totalSounds}
                  </p>
                  <p className="mt-1.5 text-[11px] tracking-wide text-ink-muted">
                    段声音
                  </p>
                </div>
                <span className="h-7 w-px bg-line" aria-hidden />
                <div>
                  <p className="font-serif text-2xl leading-none text-ink">
                    {home.totalCategories}
                  </p>
                  <p className="mt-1.5 text-[11px] tracking-wide text-ink-muted">
                    个分类
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {SECTIONS.map((section) => (
                <Link
                  key={section.slug}
                  href={`/category/${section.slug}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-line/90 bg-paper-warm/60 px-3.5 py-2 text-xs text-ink-soft transition duration-300 hover:border-coral/40 hover:bg-coral/5 hover:text-coral-deep"
                >
                  {section.shortName}
                  <ArrowUpRight
                    className="size-3.5 opacity-50 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>

          {heroCovers.length > 0 ? (
            <HeroCollage sounds={heroCovers} />
          ) : (
            <div className="hidden justify-center lg:flex">
              <span className="grid size-64 place-items-center rounded-full border border-line bg-paper-warm">
                <Disc3 className="size-24 text-line-strong" strokeWidth={0.8} aria-hidden />
              </span>
            </div>
          )}
        </section>

        <ContinueListening />

        {isEmpty ? (
          <div className="mt-16">
            <EmptyState
              title="站点还很安静"
              description="数据库里还没有可播放的声音，等第一段声音上架。"
              icon={<Disc3 className="size-6" strokeWidth={1.5} aria-hidden />}
              action={
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
                >
                  去搜索
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-14 space-y-12 sm:mt-16 sm:space-y-14">
            {home.featured.length > 0 ? (
              <SectionRail
                eyebrow="EDITOR'S PICK"
                title="编辑精选"
                description="几段值得完整听完的声音。"
                badge="精选"
                sounds={home.featured}
                favoritedIds={favoritedIds}
                href="/search"
                linkLabel="浏览全部"
              />
            ) : null}

            {home.newest.length > 0 ? (
              <SectionRail
                eyebrow="NEW ARRIVALS"
                title="新声上架"
                description="刚刚被放进唱片架的那些。"
                sounds={home.newest}
                favoritedIds={favoritedIds}
                href="/category/music"
                linkLabel="去音乐区"
              />
            ) : null}

            {sectionEntries.map(({ section, sounds }) => (
              <SectionRail
                key={section.slug}
                eyebrow={section.slug.toUpperCase()}
                title={section.name}
                description={section.description}
                sounds={sounds}
                favoritedIds={favoritedIds}
                href={`/category/${section.slug}`}
                linkLabel="查看全部"
              />
            ))}
          </div>
        )}

        <section className="mt-16 overflow-hidden rounded-[28px] border border-line bg-paper-deep/60 sm:mt-20">
          <div className="relative grid gap-6 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full border border-line/70 opacity-60"
            >
              <span className="vinyl-grooves absolute inset-3 rounded-full opacity-50" />
            </div>
            <div className="relative">
              <p className="text-[11px] tracking-[0.28em] text-ink-muted">
                ONE MORE THING
              </p>
              <h2 className="mt-3 font-serif text-2xl leading-snug text-ink sm:text-3xl">
                深夜频道，随机播放一段
                <br />
                不在计划里的声音。
              </h2>
            </div>
            <div className="relative flex flex-wrap items-center gap-3 lg:justify-end">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition duration-300 hover:bg-ink-soft"
              >
                搜一段声音
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/category/asmr"
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper px-5 py-3 text-sm text-ink-soft transition duration-300 hover:border-coral/40 hover:text-coral-deep"
              >
                去 ASMR 区
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
