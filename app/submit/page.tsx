import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Clock3,
  Headphones,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { SubmissionForm } from "@/components/submission-form";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries/sounds";

export const metadata: Metadata = {
  title: "投稿声音",
  description: "把喜欢的音声、音乐或有声书分享给同好，审核通过后即可在站点播放。",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  await requireUser("/submit");
  const categories = await getCategories();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <nav
        aria-label="面包屑"
        className="mb-5 flex items-center gap-1.5 text-xs text-ink-muted"
      >
        <Link href="/" className="transition hover:text-coral-deep">
          首页
        </Link>
        <ChevronRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        <span className="text-ink">投稿</span>
      </nav>

      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-night px-6 py-8 text-white sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-coral/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#7c6cf0]/25 blur-3xl"
        />
        <div className="relative">
          <p className="text-[10px] font-medium tracking-[0.32em] text-white/50">
            SHARE A SOUND
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            把一段声音，交给同好。
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">
            原创或已获授权的音声、音乐、有声书都可以投稿。我们会人工审核内容与音频可用性，通过后你的声音会出现在站点里。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5">
              <ShieldCheck className="size-3.5" strokeWidth={1.8} aria-hidden />
              人工审核
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5">
              <Headphones className="size-3.5" strokeWidth={1.8} aria-hidden />
              音频最大 100MB
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5">
              <Clock3 className="size-3.5" strokeWidth={1.8} aria-hidden />
              通过后才会公开
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)]">
        <SubmissionForm categories={categories} />

        <aside className="space-y-4">
          <section className="paper-panel rounded-[24px] p-5">
            <h2 className="flex items-center gap-2 font-serif text-lg text-ink">
              <UploadCloud className="size-4 text-coral-deep" strokeWidth={1.7} aria-hidden />
              投稿须知
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-ink-muted">
              <li>· 音频需完整可播放，尽量无明显爆音与长时间空白。</li>
              <li>· 封面、标题与简介需符合站点内容规范。</li>
              <li>· 请只投稿原创或已获得授权的内容。</li>
              <li>· 审核结果会通过站内通知发送给你。</li>
            </ul>
          </section>

          <section className="rounded-[24px] border border-line bg-paper-warm/70 p-5">
            <p className="text-sm leading-6 text-ink-muted">
              已提交过？可以在「我的投稿」里查看审核状态和驳回原因。
            </p>
            <Link
              href="/me/submissions"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-coral-deep transition hover:text-coral"
            >
              查看我的投稿
              <ChevronRight className="size-4" strokeWidth={1.8} aria-hidden />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
