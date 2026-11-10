"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Desktop primary navigation with a coral hairline on the active route. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="主导航" className="hidden items-center gap-0.5 md:flex">
      {NAV_LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3 py-2 text-sm transition-colors duration-300",
              active
                ? "text-ink"
                : "text-ink-soft hover:bg-paper-deep/60 hover:text-ink",
            )}
          >
            {link.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-0.5 h-px bg-coral"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
