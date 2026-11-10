import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";

import { CoverFallback } from "@/components/cover-fallback";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getPendingSubmissions } from "@/lib/queries/submissions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "审核队列" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string | string[] }>;
}) {
  await requireAdmin("/admin/reviews");

  const params = await searchParams;
  const done =
    params.done === "1" ||
    (Array.isArray(params.done) && params.done.includes("1"));

  const submissions = await getPendingSubmissions();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-[0.3em] text-ink-muted">
            REVIEW QUEUE
          </p>
          <h1 className="mt-1.5 font-serif text-3xl text-ink">审核队列</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            共 {submissions.length} 条待审核投稿，点击任意一条查看详情。
          </p>
        </div>
        <Link
          href="/admin/reviews"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm text-ink-muted transition hover:border-line-strong hover:text-ink"
        >
          <RefreshCw className="size-3.5" strokeWidth={1.8} aria-hidden />
          刷新队列
        </Link>
      </header>

      {done ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.8}
            aria-hidden
          />
          已处理一条投稿，投稿者会收到站内通知。
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <EmptyState
          title="没有待审核的投稿"
          description="队列已经清空。等新的投稿进来后，这里会实时更新。"
          icon={<ClipboardCheck className="size-6" strokeWidth={1.4} aria-hidden />}
          action={
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-ink-soft"
            >
              返回站点
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {submissions.map((submission) => (
            <li key={submission.id}>
              <Link
                href={`/admin/reviews/${submission.id}`}
                className="paper-panel group flex items-center gap-4 rounded-[24px] p-3.5 transition hover:border-coral/40 sm:p-4"
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-line bg-paper-deep">
                  {submission.photo ? (
                    <Image
                      src={submission.photo}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <CoverFallback
                      id={submission.id}
                      section={submission.section}
                      size="sm"
                    />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-serif text-base text-ink sm:text-lg">
                      {submission.subject || "未命名声音"}
                    </span>
                    <StatusBadge status={submission.status} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-muted">
                    投稿人 @{submission.submitter.username} ·{" "}
                    {submission.categoryName} · {formatDate(submission.created)}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-6 text-ink-muted">
                    {submission.summary || "暂无简介"}
                  </span>
                </span>

                <ArrowRight
                  className="size-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-coral-deep"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
