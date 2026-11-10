import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Headphones,
  Tag,
  UserRound,
} from "lucide-react";

import { CoverFallback } from "@/components/cover-fallback";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getSubmissionWithUserById } from "@/lib/queries/submissions";
import { assetUrl, cn, formatDate, toPositiveInt } from "@/lib/utils";

export const metadata: Metadata = { title: "审核详情" };

export default async function AdminReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await requireAdmin("/admin/reviews");

  const { id } = await params;
  const submissionId = toPositiveInt(id);
  if (submissionId === null) notFound();

  const [submission, query] = await Promise.all([
    getSubmissionWithUserById(submissionId),
    searchParams,
  ]);
  if (!submission) notFound();

  const isPending = submission.status === "pending";
  const reasonError =
    isPending && query.error === "reason" ? "驳回原因需要 1–500 个字符，请重新填写。" : "";
  const submittedClock =
    submission.created.length >= 16
      ? submission.created.slice(11, 16)
      : "";

  return (
    <div className="space-y-5">
      <Link
        href="/admin/reviews"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden />
        返回审核队列
      </Link>

      {reasonError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.8}
            aria-hidden
          />
          {reasonError}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[24px] border border-line bg-paper-deep">
            {submission.photo ? (
              <Image
                src={submission.photo}
                alt={submission.subject}
                fill
                priority
                sizes="(min-width: 1024px) 300px, 100vw"
                className="object-cover"
              />
            ) : (
              <CoverFallback
                id={submission.id}
                section={submission.section}
                size="lg"
              />
            )}
          </div>

          <div className="paper-panel space-y-3 rounded-[24px] p-5 text-sm">
            <div className="flex items-start gap-2.5">
              <UserRound
                className="mt-0.5 size-4 shrink-0 text-ink-muted"
                strokeWidth={1.7}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">投稿人</p>
                <p className="mt-0.5 truncate font-medium text-ink">
                  @{submission.submitter.username}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Tag
                className="mt-0.5 size-4 shrink-0 text-ink-muted"
                strokeWidth={1.7}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">分类</p>
                <p className="mt-0.5 text-ink">{submission.categoryName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays
                className="mt-0.5 size-4 shrink-0 text-ink-muted"
                strokeWidth={1.7}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">提交时间</p>
                <p className="mt-0.5 text-ink">
                  {formatDate(submission.created)}
                  {submittedClock ? ` ${submittedClock}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Headphones
                className="mt-0.5 size-4 shrink-0 text-ink-muted"
                strokeWidth={1.7}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">作者 / 社团</p>
                <p className="mt-0.5 truncate text-ink">
                  {submission.author || "未填写"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="paper-panel rounded-[24px] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.3em] text-ink-muted">
                  SUBMISSION #{submission.id}
                </p>
                <h1 className="mt-1.5 font-serif text-2xl leading-snug text-ink sm:text-3xl">
                  {submission.subject || "未命名声音"}
                </h1>
              </div>
              <StatusBadge status={submission.status} />
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <h2 className="text-xs font-medium tracking-[0.12em] text-ink-muted">
                简介
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-soft">
                {submission.summary || "投稿者没有填写简介。"}
              </p>
            </div>
          </div>

          <div className="paper-panel rounded-[24px] p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-serif text-lg text-ink">
              <Headphones className="size-4 text-coral-deep" strokeWidth={1.7} aria-hidden />
              音频试听
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              请确认音频可完整播放，再决定是否通过。
            </p>
            <audio
              controls
              preload="none"
              src={assetUrl(submission.url)}
              className="mt-4 w-full"
            >
              你的浏览器不支持音频播放。
            </audio>
          </div>

          {isPending ? (
            <ReviewActions id={submission.id} />
          ) : (
            <div
              className={cn(
                "rounded-[24px] border p-5 sm:p-6",
                submission.status === "approved"
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-red-200 bg-red-50/60",
              )}
            >
              <h2 className="font-serif text-lg text-ink">
                {submission.status === "approved"
                  ? "该投稿已通过审核"
                  : "该投稿已驳回"}
              </h2>
              {submission.status === "approved" ? (
                <>
                  <p className="mt-1.5 text-sm leading-6 text-ink-muted">
                    声音已在站点公开，投稿者已收到通过通知。
                  </p>
                  <Link
                    href={`/sound/${submission.id}`}
                    className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper transition hover:bg-ink-soft"
                  >
                    查看声音页
                  </Link>
                </>
              ) : (
                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-ink-muted">
                  驳回原因：{submission.reviewReason || "未填写"}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
