import Link from "next/link";
import { Disc3 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { SECTIONS, SITE } from "@/lib/constants";

/** Site footer. Reserves room for the mobile tab bar and the mini player. */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const user = await getSessionUser();
  const exploreLinks = [
    { href: "/search", label: "搜索声音" },
    ...(user
      ? [
          { href: "/me", label: "我的主页" },
          { href: "/me/favorites", label: "我的收藏" },
        ]
      : [{ href: "/login", label: "登录 / 注册" }]),
  ];

  return (
    <footer className="mt-16 border-t border-line/80 bg-paper-warm/70 pb-[calc(9rem+env(safe-area-inset-bottom))] md:mt-20 md:pb-28">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-paper">
                <Disc3 className="size-4" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="font-serif text-lg text-ink">{SITE.name}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {SITE.description}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] tracking-wide text-ink-muted">
              <span className="size-1.5 rounded-full bg-coral" aria-hidden />
              深夜播放台 · 耳机友好
            </p>
          </div>

          <nav aria-label="分区" className="text-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-ink-muted">
              Sections
            </p>
            <ul className="mt-4 space-y-2.5">
              {SECTIONS.map((section) => (
                <li key={section.slug}>
                  <Link
                    href={`/category/${section.slug}`}
                    className="inline-flex text-ink-soft transition-colors duration-300 hover:text-coral-deep"
                  >
                    {section.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="更多" className="text-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-ink-muted">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex text-ink-soft transition-colors duration-300 hover:text-coral-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-muted sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© {year} {SITE.name} · 声音版权归原作者所有</span>
            <span aria-hidden>·</span>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-coral-deep"
            >
              黔ICP备16010721号-2
            </a>
          </p>
          <p className="font-serif tracking-wide">带好耳机，世界属于你</p>
        </div>
      </div>
    </footer>
  );
}
