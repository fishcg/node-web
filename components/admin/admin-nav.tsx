"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "概览", icon: LayoutDashboard, exact: true },
  { href: "/admin/reviews", label: "审核队列", icon: ClipboardCheck, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="审核后台导航" className="flex flex-wrap items-center gap-1.5">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition",
              active
                ? "bg-ink text-paper"
                : "text-ink-muted hover:bg-paper-deep hover:text-ink",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.8} aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
