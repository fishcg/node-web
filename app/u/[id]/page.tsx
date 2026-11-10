import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Headphones,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SoundCard } from "@/components/sound-card";
import { FollowButton } from "@/components/social/follow-button";
import { UserAvatar } from "@/components/social/user-avatar";
import { getSessionUser } from "@/lib/auth";
import {
  getApprovedSoundsByUser,
  getPublicUser,
  getUserProfile,
} from "@/lib/queries/social";
import { getFavoriteIds } from "@/lib/queries/sounds";
import { formatDate, toPositiveInt } from "@/lib/utils";

interface UserPageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: UserPageParams): Promise<Metadata> {
  const id = toPositiveInt((await params).id);
  if (!id) return { title: "用户主页" };

  const user = await getPublicUser(id);
  if (!user) return { title: "用户主页" };

  return {
    title: `${user.username} 的主页`,
    description: `${user.username} 在幻想の城分享的声音、关注与收藏。`,
  };
}

export default async function UserProfilePage({
  params,
}: PageProps<"/u/[id]">) {
  const id = toPositiveInt((await params).id);
  if (!id) notFound();

  const viewer = await getSessionUser();
  const profile = await getUserProfile(id, viewer?.id ?? null);
  if (!profile) notFound();

  const [sounds, favoritedIds] = await Promise.all([
    getApprovedSoundsByUser(id, 24),
    viewer ? getFavoriteIds(viewer.id) : Promise.resolve(new Set<number>()),
  ]);

  const isAdminProfile = profile.role === "admin";
  const isSelf = profile.isSelf;
  const loginNext = `/u/${profile.id}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <nav
        aria-label="面包屑"
        className="flex items-center gap-2 text-xs text-ink-muted"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
          首页
        </Link>
        <span aria-hidden className="text-line-strong">
          /
        </span>
        <span className="text-ink-soft">{isSelf ? "我的主页" : "用户主页"}</span>
      </nav>

      <section className="paper-panel relative mt-6 overflow-hidden rounded-[32px] p-6 sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border border-line/70 opacity-60"
        >
          <span className="vinyl-grooves absolute inset-3 rounded-full opacity-50" />
          <span className="absolute inset-[40%] rounded-full bg-ink/10" />
        </div>

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <UserAvatar
              username={profile.username}
              avatar={profile.avatar}
              size={84}
              className="shadow-[0_16px_32px_-24px_rgba(28,25,23,0.6)]"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-medium tracking-[0.3em] text-ink-muted">
                  {isSelf ? "YOUR PUBLIC PAGE" : "LISTENER PROFILE"}
                </p>
                {isAdminProfile ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-mist/25 bg-mist/10 px-2 py-0.5 text-[10px] font-medium text-mist-deep">
                    <ShieldCheck className="size-3" strokeWidth={2} aria-hidden />
                    管理员
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 truncate font-serif text-[clamp(1.85rem,5vw,2.6rem)] leading-tight text-ink">
                {profile.username}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" strokeWidth={1.7} aria-hidden />
                  {formatDate(profile.created)} 加入
                </span>
                <span aria-hidden className="hidden text-line-strong sm:inline">
                  ·
                </span>
                <span>会员编号 #{String(profile.id).padStart(4, "0")}</span>
              </p>

              <dl className="mt-4 flex flex-wrap items-baseline gap-x-7 gap-y-2">
                <div className="flex items-baseline gap-1.5">
                  <dt className="sr-only">关注</dt>
                  <dd className="font-serif text-xl leading-none text-ink">
                    {profile.followingCount}
                  </dd>
                  <span className="text-[11px] text-ink-muted">关注</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="sr-only">粉丝</dt>
                  <dd className="font-serif text-xl leading-none text-ink">
                    {profile.followerCount}
                  </dd>
                  <span className="text-[11px] text-ink-muted">粉丝</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="sr-only">声音</dt>
                  <dd className="font-serif text-xl leading-none text-ink">
                    {profile.soundCount}
                  </dd>
                  <span className="text-[11px] text-ink-muted">声音</span>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-col sm:items-stretch">
            {isSelf ? (
              <>
                <Link
                  href="/me"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper transition duration-300 hover:bg-ink-soft"
                >
                  我的主页
                  <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper px-5 text-sm text-ink-soft transition duration-300 hover:border-ink/25 hover:text-ink"
                >
                  <Headphones className="size-4" strokeWidth={1.8} aria-hidden />
                  继续投稿
                </Link>
              </>
            ) : viewer ? (
              <>
                <FollowButton targetId={profile.id} following={profile.isFollowing} />
                <Link
                  href={`/messages/${profile.id}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper px-5 text-sm text-ink-soft transition duration-300 hover:border-ink/25 hover:text-ink"
                >
                  <MessageSquare className="size-4" strokeWidth={1.8} aria-hidden />
                  发私信
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(loginNext)}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-coral px-5 text-sm font-medium text-white transition duration-300 hover:bg-coral-deep"
                >
                  <UserPlus className="size-4" strokeWidth={1.9} aria-hidden />
                  登录后关注
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(`/messages/${profile.id}`)}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper px-5 text-sm text-ink-soft transition duration-300 hover:border-ink/25 hover:text-ink"
                >
                  <MessageSquare className="size-4" strokeWidth={1.8} aria-hidden />
                  发私信
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/80 pb-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-ink-muted">
              {isSelf ? (
                <Users className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
              ) : (
                <Headphones className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
              )}
              {isSelf ? "YOUR SOUNDS" : "PUBLISHED SOUNDS"}
            </p>
            <h2 className="mt-1.5 font-serif text-xl text-ink sm:text-2xl">
              {isSelf ? "我的声音" : "TA 的声音"}
            </h2>
          </div>
          <p className="text-xs text-ink-muted">
            共 {profile.soundCount} 段已通过审核的声音
          </p>
        </div>

        {sounds.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={isSelf ? "还没有通过审核的声音" : "还没有发布声音"}
              description={
                isSelf
                  ? "投稿通过审核后，就会出现在你的公开主页。"
                  : "安静的人往往在等一段合适的声音。你可以先听听别人的收藏。"
              }
              icon={<Headphones className="size-6" strokeWidth={1.5} aria-hidden />}
              action={
                <Link
                  href={isSelf ? "/submit" : "/category/music"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
                >
                  {isSelf ? "去投稿" : "去音乐区逛逛"}
                  <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {sounds.map((sound, index) => (
              <SoundCard
                key={sound.id}
                sound={sound}
                favorited={favoritedIds.has(sound.id)}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
