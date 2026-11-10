import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Clock3,
  Headphones,
  ShieldCheck,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { countPendingSubmissions } from "@/lib/queries/submissions";

export const metadata: Metadata = { title: "审核概览" };

export default async function AdminHomePage() {
  const admin = await requireAdmin("/admin");
  const pending = await countPendingSubmissions();

  return (
    <div className="space-y-6">
      <section className="paper-panel relative overflow-hidden rounded-[28px] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-coral/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-[0.3em] text-ink-muted">
              PENDING REVIEW
            </p>
            <p className="mt-3 font-serif text-6xl leading-none text-ink sm:text-7xl">
              {pending}
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              条投稿等待审核
              {pending === 0 ? "，队列已经清空。" : "，处理后会通过站内通知告诉投稿者。"}
            </p>
          </div>
          <Link
            href="/admin/reviews"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-coral px-6 text-sm font-medium text-white transition hover:bg-coral-deep"
          >
            <ClipboardCheck className="size-4" strokeWidth={1.8} aria-hidden />
            进入审核队列
            <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/reviews"
          className="paper-panel group flex items-start gap-4 rounded-[24px] p-5 transition hover:border-coral/40"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-coral/10 text-coral-deep">
            <Clock3 className="size-5" strokeWidth={1.7} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center justify-between gap-2 font-serif text-lg text-ink">
              审核队列
              <ArrowRight
                className="size-4 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-coral-deep"
                strokeWidth={1.8}
                aria-hidden
              />
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-ink-muted">
              试听音频、查看封面与简介，通过或填写原因驳回。
            </p>
          </div>
        </Link>

        <Link
          href="/"
          className="paper-panel group flex items-start gap-4 rounded-[24px] p-5 transition hover:border-coral/40"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-paper-deep text-ink-soft">
            <Headphones className="size-5" strokeWidth={1.7} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center justify-between gap-2 font-serif text-lg text-ink">
              返回站点
              <ArrowRight
                className="size-4 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-coral-deep"
                strokeWidth={1.8}
                aria-hidden
              />
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-ink-muted">
              以普通听众的身份检查首页、分类和播放器。
            </p>
          </div>
        </Link>
      </div>

      <section className="rounded-[24px] border border-line bg-paper-warm/60 p-5">
        <h2 className="flex items-center gap-2 font-serif text-lg text-ink">
          <ShieldCheck className="size-4 text-coral-deep" strokeWidth={1.8} aria-hidden />
          审核原则
        </h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-muted sm:grid-cols-2">
          <li>· 音频完整可播放，无明显爆音或长时间空白。</li>
          <li>· 标题、简介、封面与内容相符且合规。</li>
          <li>· 只接受原创或已获授权的投稿。</li>
          <li>· 驳回时写明可执行的修改建议，方便投稿者重新提交。</li>
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
          当前管理员：@{admin.username}
        </p>
      </section>
    </div>
  );
}
