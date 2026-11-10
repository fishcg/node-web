import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "审核后台",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin("/admin");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <header className="paper-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-paper">
            <ShieldCheck className="size-5" strokeWidth={1.7} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.3em] text-ink-muted">
              ADMIN CONSOLE
            </p>
            <p className="truncate font-serif text-xl text-ink">审核后台</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-ink-muted sm:inline">
              @{admin.username}
            </span>
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm text-ink-muted transition hover:border-line-strong hover:text-ink"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
              返回站点
            </Link>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <AdminNav />
        </div>
      </header>

      <div className="mt-6">{children}</div>
    </div>
  );
}
