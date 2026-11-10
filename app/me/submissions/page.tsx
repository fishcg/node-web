import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  FileClock,
  Headphones,
  UploadCloud,
} from "lucide-react";

import { CoverFallback } from "@/components/cover-fallback";
import { EmptyState } from "@/components/empty-state";
import { SubmissionStatusBadge } from "@/components/social/submission-status";
import { requireUser } from "@/lib/auth";
import { getMySubmissions } from "@/lib/queries/submissions";
import type { Submission } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的投稿",
  description: "查看投稿的审核状态与驳回原因。",
  robots: { index: false, follow: false },
};

function SubmissionCard({ submission }: { submission: Submission }) {
  const isRejected = submission.status === "rejected";
  const isApproved = submission.status === "approved";

  return (
    <article className="paper-panel rounded-[22px] p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-line/80 bg-paper-deep sm:size-[72px]">
          {submission.photo ? (
            <Image
              src={submission.photo}
              alt=""
              fill
              sizes="72px"
              className="object-cover"
            />
          ) : (
            <CoverFallback id={submission.id} section={submission.section} size="sm" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
                {submission.subject}
              </h2>
              <p className="mt-1 text-[11px] text-ink-muted">
                {submission.categoryName} · 投稿于 {formatDate(submission.created)}
              </p>
            </div>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          {submission.summary ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-muted">
              {submission.summary}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
            {isApproved ? (
              <Link
                href={`/sound/${submission.id}`}
                className="inline-flex items-center gap-1 font-medium text-coral-deep transition hover:text-coral"
              >
                <Headphones className="size-3.5" strokeWidth={1.8} aria-hidden />
                去收听
              </Link>
            ) : null}
            {submission.status === "pending" ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" strokeWidth={1.7} aria-hidden />
                审核中，通过后会发送站内通知
              </span>
            ) : null}
            {isRejected ? (
              <Link
                href="/submit"
                className="inline-flex items-center gap-1 font-medium text-coral-deep transition hover:text-coral"
              >
                修改后重新投稿
                <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {isRejected ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2.5 text-xs leading-5 text-red-700">
          <span className="font-medium">驳回原因：</span>
          {submission.reviewReason || "未填写具体原因，可联系管理员了解详情。"}
        </div>
      ) : null}
    </article>
  );
}

export default async function MySubmissionsPage() {
  const user = await requireUser("/me/submissions");
  const submissions = await getMySubmissions(user.id);
  const pending = submissions.filter((item) => item.status === "pending").length;
  const approved = submissions.filter((item) => item.status === "approved").length;
  const rejected = submissions.filter((item) => item.status === "rejected").length;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <nav
        aria-label="面包屑"
        className="flex items-center gap-2 text-xs text-ink-muted"
      >
        <Link
          href="/me"
          className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
          我的主页
        </Link>
        <span aria-hidden className="text-line-strong">
          /
        </span>
        <span className="text-ink-soft">投稿</span>
      </nav>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-6">
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-ink-muted">
            <FileClock className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
            MY SUBMISSIONS
          </p>
          <h1 className="mt-2.5 font-serif text-[clamp(1.9rem,5.4vw,2.8rem)] leading-tight text-ink">
            我的投稿
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            共 {submissions.length} 篇
            {submissions.length > 0
              ? ` · ${pending} 待审核 · ${approved} 已通过 · ${rejected} 未通过`
              : ""}
          </p>
        </div>
        <Link
          href="/submit"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-coral px-4 text-sm font-medium text-white transition duration-300 hover:bg-coral-deep"
        >
          <UploadCloud className="size-4" strokeWidth={1.8} aria-hidden />
          投稿声音
        </Link>
      </header>

      {submissions.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="还没有投过稿"
            description="把喜欢的音声、音乐或有声书分享给同好。审核通过后就会出现在站点里。"
            icon={<UploadCloud className="size-6" strokeWidth={1.5} aria-hidden />}
            action={
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
              >
                去投稿
                <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {submissions.map((submission) => (
            <li key={submission.id}>
              <SubmissionCard submission={submission} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[11px] leading-5 text-ink-muted">
        投稿需人工审核 · 通过后会通过站内通知告诉你
      </p>
    </div>
  );
}
