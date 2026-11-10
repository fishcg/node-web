import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Disc3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SoundCard } from "@/components/sound-card";
import { getSessionUser } from "@/lib/auth";
import { SECTIONS, SECTION_BY_SLUG } from "@/lib/constants";
import { getFavoriteIds, getSectionPage } from "@/lib/queries/sounds";
import type { SectionSlug } from "@/lib/types";
import { toPositiveInt } from "@/lib/utils";

const SECTION_SLUGS = SECTIONS.map((section) => section.slug);
const SECTION_EYEBROW: Record<SectionSlug, string> = {
  asmr: "ASMR",
  music: "MUSIC",
  audiobook: "AUDIOBOOK",
  talk: "TALK",
};

function isSectionSlug(value: string): value is SectionSlug {
  return SECTION_SLUGS.includes(value as SectionSlug);
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const section = SECTION_BY_SLUG.get(slug as SectionSlug);
  if (!section) return { title: "分区不存在" };

  return {
    title: section.name,
    description: section.description,
    alternates: { canonical: `/category/${section.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  if (!isSectionSlug(slug)) notFound();

  const section = SECTION_BY_SLUG.get(slug);
  if (!section) notFound();

  const query = await searchParams;
  const page = toPositiveInt(query.page) ?? 1;
  const [result, user] = await Promise.all([
    getSectionPage(slug, page),
    getSessionUser(),
  ]);
  const favoritedIds = user ? await getFavoriteIds(user.id) : undefined;
  const siblings = SECTIONS.filter((item) => item.slug !== section.slug);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(44rem_22rem_at_18%_-10%,rgba(124,108,240,0.10),transparent_66%),radial-gradient(38rem_20rem_at_88%_0%,rgba(255,90,60,0.08),transparent_62%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <nav aria-label="面包屑" className="flex items-center gap-2 text-xs text-ink-muted">
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
          <span className="text-ink-soft">{section.name}</span>
        </nav>

        <header className="mt-6 flex flex-col gap-5 border-b border-line/80 pb-8 sm:mt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] tracking-[0.3em] text-ink-muted">
              <Disc3 className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
              {SECTION_EYEBROW[section.slug]} SECTION
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2rem,6.4vw,3.4rem)] leading-[1.14] text-ink">
              {section.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
              {section.description}
            </p>
            <p className="mt-4 text-xs text-ink-muted">
              共 <span className="font-medium text-ink-soft">{result.total}</span>{" "}
              段声音
              {result.totalPages > 1 ? ` · 第 ${result.page} / ${result.totalPages} 页` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {siblings.map((item) => (
              <Link
                key={item.slug}
                href={`/category/${item.slug}`}
                className="rounded-full border border-line/90 bg-paper-warm/70 px-3.5 py-2 text-xs text-ink-soft transition duration-300 hover:border-coral/40 hover:bg-coral/5 hover:text-coral-deep"
              >
                {item.shortName}
              </Link>
            ))}
          </div>
        </header>

        {result.items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="这个分区还没有声音"
              description="等下一段声音被放上唱片架，或者先去别处分区逛逛。"
              icon={<Disc3 className="size-6" strokeWidth={1.5} aria-hidden />}
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
        ) : (
          <>
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
                target === 1
                  ? `/category/${section.slug}`
                  : `/category/${section.slug}?page=${target}`
              }
              className="mt-12"
            />
          </>
        )}
      </div>
    </div>
  );
}
