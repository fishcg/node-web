"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Music2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/",
    label: "首页",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/category/music",
    label: "音乐",
    icon: Music2,
    isActive: (pathname) => pathname.startsWith("/category/music"),
  },
  {
    href: "/me/favorites",
    label: "收藏",
    icon: Heart,
    isActive: (pathname) => pathname.startsWith("/me/favorites"),
  },
  {
    href: "/me",
    label: "我的",
    icon: UserRound,
    isActive: (pathname) =>
      pathname === "/me" ||
      (pathname.startsWith("/me") && !pathname.startsWith("/me/favorites")),
  },
];

/** Mobile-only bottom tab bar; the mini player docks just above it. */
export function MobileNav() {
  const pathname = usePathname();

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/sound/")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="底部导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/95 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors duration-300",
                active ? "text-coral-deep" : "text-ink-muted hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition-colors duration-300",
                  active ? "bg-coral/12 text-coral-deep" : "bg-transparent",
                )}
              >
                <Icon
                  className="size-[18px]"
                  strokeWidth={active ? 2 : 1.6}
                  aria-hidden
                />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
