import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SoundCard } from "@/components/sound-card";
import { requireUser } from "@/lib/auth";
import { getFavoriteSounds } from "@/lib/queries/sounds";
import { toPositiveInt } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的收藏",
  description: "你收藏过的所有声音。",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage({
  searchParams,
}: PageProps<"/me/favorites">) {
  const user = await requireUser("/me/favorites");
  const query = await searchParams;
  const page = toPositiveInt(query.page) ?? 1;
  const result = await getFavoriteSounds(user.id, page);
  const favoritedIds = new Set(result.items.map((sound) => sound.id));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <nav aria-label="面包屑" className="flex items-center gap-2 text-xs text-ink-muted">
        <Link
          href="/me"
          className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
          我的主页
        </Link>
        <span aria-hidden className="text-line-strong">
          /
        </span>
        <span className="text-ink-soft">收藏</span>
      </nav>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-6 sm:mt-8">
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-ink-muted">
            <Heart className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
            YOUR COLLECTION
          </p>
          <h1 className="mt-2.5 font-serif text-[clamp(1.9rem,5.4vw,2.8rem)] leading-tight text-ink">
            我的收藏
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            共 {result.total} 段声音
            {result.totalPages > 1
              ? ` · 第 ${result.page} / ${result.totalPages} 页`
              : ""}
          </p>
        </div>
      </header>

      {result.items.length === 0 ? (
        <div className="mx-auto mt-10 max-w-3xl">
          <EmptyState
            title="收藏夹还是空的"
            description="在声音卡片上点一下爱心，喜欢的声音就会收进来。"
            icon={<Heart className="size-6" strokeWidth={1.5} aria-hidden />}
            action={
              <Link
                href="/category/music"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
              >
                去音乐区看看
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {result.items.map((sound, index) => (
              <SoundCard
                key={sound.id}
                sound={sound}
                favorited={favoritedIds.has(sound.id)}
                priority={index < 4}
              />
            ))}
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            hrefFor={(target) =>
              target === 1 ? "/me/favorites" : `/me/favorites?page=${target}`
            }
            className="mt-12"
          />
        </>
      )}
    </div>
  );
}
