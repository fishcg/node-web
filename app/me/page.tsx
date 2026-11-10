import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Disc3, Heart, Sparkles } from "lucide-react";
import { ContinueListening } from "@/components/continue-listening";
import { EmptyState } from "@/components/empty-state";
import { LogoutButton } from "@/components/logout-button";
import { SoundCard } from "@/components/sound-card";
import { requireUser } from "@/lib/auth";
import { getFavoriteSounds } from "@/lib/queries/sounds";
import { assetUrl, formatDate, greeting, initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的主页",
  description: "你的账号、收藏与最近在听。",
  robots: { index: false, follow: false },
};

export default async function MePage() {
  const user = await requireUser("/me");
  const favorites = await getFavoriteSounds(user.id, 1);
  const recent = favorites.items.slice(0, 4);
  const favoritedIds = new Set(recent.map((sound) => sound.id));
  const avatar = assetUrl(user.avatar);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-line bg-paper-warm/80 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-line/70 opacity-60"
        >
          <span className="vinyl-grooves absolute inset-3 rounded-full opacity-50" />
          <span className="absolute inset-[40%] rounded-full bg-ink/10" />
        </div>

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={72}
                height={72}
                priority
                className="size-16 rounded-full border border-line object-cover sm:size-[72px]"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-full border border-line bg-mist/12 font-serif text-2xl text-mist-deep sm:size-[72px]">
                {initials(user.username)}
              </span>
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-ink-muted">
                <Sparkles className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
                {greeting()}
              </p>
              <h1 className="mt-1.5 truncate font-serif text-2xl text-ink sm:text-3xl">
                {user.username}
              </h1>
              <p className="mt-1.5 text-xs text-ink-muted">
                会员编号 #{String(user.id).padStart(4, "0")} · 收藏{" "}
                {favorites.total} 段声音
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <Link
              href="/me/favorites"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition duration-300 hover:bg-ink-soft"
            >
              <Heart className="size-4" strokeWidth={1.7} aria-hidden />
              我的收藏
            </Link>
            <LogoutButton />
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-line bg-paper-warm/60 px-5 py-4">
          <div>
            <p className="text-[11px] tracking-wide text-ink-muted">收藏总数</p>
            <p className="mt-1 font-serif text-2xl leading-none text-ink">
              {favorites.total}
            </p>
          </div>
          <Heart className="size-5 text-coral/70" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-paper-warm/60 px-5 py-4">
          <div>
            <p className="text-[11px] tracking-wide text-ink-muted">最近更新</p>
            <p className="mt-1 font-serif text-xl leading-none text-ink">
              {recent[0] ? formatDate(recent[0].created) : "—"}
            </p>
          </div>
          <Disc3 className="size-5 text-mist/70" strokeWidth={1.5} aria-hidden />
        </div>
      </div>

      <ContinueListening />

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3 border-b border-line/80 pb-4">
          <div>
            <p className="text-[11px] tracking-[0.28em] text-ink-muted">
              RECENT FAVORITES
            </p>
            <h2 className="mt-1.5 font-serif text-xl text-ink sm:text-2xl">
              最近收藏
            </h2>
          </div>
          {favorites.total > 0 ? (
            <Link
              href="/me/favorites"
              className="group inline-flex items-center gap-1.5 pb-0.5 text-xs text-ink-muted transition-colors duration-300 hover:text-coral-deep"
            >
              查看全部
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="还没有收藏"
              description="在声音卡片上点一下爱心，喜欢的声音就会出现在这里。"
              icon={<Heart className="size-6" strokeWidth={1.5} aria-hidden />}
              action={
                <Link
                  href="/category/music"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
                >
                  去逛逛
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-5 md:grid-cols-4">
              {recent.map((sound) => (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  favorited={favoritedIds.has(sound.id)}
                />
              ))}
            </div>
            <p className="mt-4 text-[11px] text-ink-muted">
              最近收藏于 {formatDate(recent[0].created)} 更新
            </p>
          </>
        )}
      </section>
    </div>
  );
}
