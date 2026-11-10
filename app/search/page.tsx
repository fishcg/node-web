import type { Metadata } from "next";
import Link from "next/link";
import { Disc3, Search, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SoundCard } from "@/components/sound-card";
import { getSessionUser } from "@/lib/auth";
import { SECTIONS } from "@/lib/constants";
import { getFavoriteIds, searchSounds } from "@/lib/queries/sounds";
import { toPositiveInt } from "@/lib/utils";

export const metadata: Metadata = {
  title: "搜索",
  description: "在幻想の城搜索音乐、ASMR、有声书与杂谈。",
  robots: { index: false, follow: false },
};

function readQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, 80);
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const query = await searchParams;
  const q = readQuery(query.q);
  const page = toPositiveInt(query.page) ?? 1;

  const [result, user] = q
    ? await Promise.all([searchSounds(q, page), getSessionUser()])
    : [null, null];
  const favoritedIds = user ? await getFavoriteIds(user.id) : undefined;

  const baseHref = q ? `/search?q=${encodeURIComponent(q)}` : "/search";

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(46rem_22rem_at_50%_-12%,rgba(255,90,60,0.10),transparent_66%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-[11px] tracking-[0.3em] text-ink-muted">
            <Sparkles className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
            SEARCH THE ARCHIVE
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,6.4vw,3.2rem)] leading-[1.14] text-ink">
            找一段声音
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            按标题、作者或简介搜索，关键词越具体越容易命中。
          </p>

          <form
            action="/search"
            method="get"
            role="search"
            className="mt-7 flex items-center gap-2 rounded-full border border-line bg-paper-warm/90 p-1.5 pl-5 shadow-soft transition focus-within:border-coral/50 focus-within:shadow-lift"
          >
            <Search
              className="size-4 shrink-0 text-ink-muted"
              strokeWidth={1.8}
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="例如：雨声、VOCALOID、睡前故事…"
              aria-label="搜索关键词"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/80"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition duration-300 hover:bg-coral-deep"
            >
              搜索
            </button>
          </form>
        </header>

        {!q ? (
          <div className="mx-auto mt-12 max-w-3xl">
            <EmptyState
              title="想听点什么？"
              description="输入关键词开始搜索，也可以直接从这些分区逛起。"
              icon={<Disc3 className="size-6" strokeWidth={1.5} aria-hidden />}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {SECTIONS.map((section) => (
                    <Link
                      key={section.slug}
                      href={`/category/${section.slug}`}
                      className="rounded-full border border-line bg-paper px-3.5 py-2 text-xs text-ink-soft transition duration-300 hover:border-coral/40 hover:text-coral-deep"
                    >
                      {section.name}
                    </Link>
                  ))}
                </div>
              }
            />
          </div>
        ) : result && result.items.length === 0 ? (
          <div className="mx-auto mt-12 max-w-3xl">
            <EmptyState
              title={`没有找到「${q}」`}
              description="换个关键词试试，或者去分区里随手翻翻。"
              icon={<Search className="size-6" strokeWidth={1.5} aria-hidden />}
              action={
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
                >
                  回到首页
                </Link>
              }
            />
          </div>
        ) : result ? (
          <>
            <div className="mt-10 flex flex-wrap items-baseline justify-between gap-2 border-b border-line/80 pb-4">
              <p className="text-sm text-ink-soft">
                <span className="font-serif text-lg text-ink">「{q}」</span>{" "}
                的搜索结果
              </p>
              <p className="text-xs text-ink-muted">
                共 <span className="font-medium text-ink-soft">{result.total}</span>{" "}
                段声音
                {result.totalPages > 1
                  ? ` · 第 ${result.page} / ${result.totalPages} 页`
                  : ""}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {result.items.map((sound, index) => (
                <SoundCard
                  key={sound.id}
                  sound={sound}
                  favorited={favoritedIds?.has(sound.id)}
                  priority={index < 4}
                />
              ))}
            </div>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              hrefFor={(target) =>
                target === 1 ? baseHref : `${baseHref}&page=${target}`
              }
              className="mt-12"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
