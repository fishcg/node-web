import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { SiteNav } from "@/components/layout/site-nav";
import { getSessionUser } from "@/lib/auth";
import { assetUrl, initials } from "@/lib/utils";

/**
 * Sticky top bar. Reads the session on the server so the account chip never
 * flashes the signed-out state.
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  const avatar = user ? assetUrl(user.avatar) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:h-20 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="幻想の城 · 返回首页"
          className="group flex shrink-0 items-center gap-2.5"
        >
          <span className="relative grid size-10 place-items-center rounded-full bg-ink text-paper shadow-[0_8px_20px_-12px_rgba(28,25,23,0.8)] transition-transform duration-700 ease-out group-hover:rotate-180 sm:size-11">
            <span aria-hidden className="absolute inset-[7px] rounded-full border border-paper/25" />
            <span aria-hidden className="absolute inset-[12px] rounded-full border border-paper/15" />
            <span aria-hidden className="size-1.5 rounded-full bg-paper/70" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-coral ring-2 ring-paper" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[17px] tracking-[0.02em] text-ink sm:text-lg">
              幻想の城
            </span>
            <span className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.34em] text-ink-muted">
              AcGay Sound
            </span>
          </span>
        </Link>

        <SiteNav />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/search"
            aria-label="搜索声音"
            className="grid size-9 place-items-center rounded-full border border-transparent text-ink-soft transition duration-300 hover:border-line hover:bg-paper-warm hover:text-ink"
          >
            <Search className="size-[18px]" strokeWidth={1.7} aria-hidden />
          </Link>

          {user ? (
            <Link
              href="/me"
              className="group flex items-center gap-2 rounded-full border border-line bg-paper-warm py-1 pl-1 pr-2.5 text-sm text-ink-soft transition duration-300 hover:border-line-strong hover:text-ink sm:pr-3.5"
            >
              {avatar ? (
                <Image
                  src={avatar}
                  alt=""
                  width={30}
                  height={30}
                  className="size-[30px] rounded-full border border-line object-cover"
                />
              ) : (
                <span className="grid size-[30px] place-items-center rounded-full bg-mist/15 font-serif text-sm text-mist-deep">
                  {initials(user.username)}
                </span>
              )}
              <span className="hidden max-w-24 truncate sm:inline">
                {user.username}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition duration-300 hover:bg-ink-soft sm:px-5 sm:py-2.5"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
