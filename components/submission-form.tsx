"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Music2,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import type { Category } from "@/lib/types";

const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface SubmissionFormProps {
  categories: Category[];
}

type FormState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; id: number }
  | { status: "error"; message: string };

function validateFiles(formData: FormData): string | null {
  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size <= 0) {
    return "请选择要投稿的音频文件";
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return "音频不能超过 100MB";
  }
  if (!audio.type.toLowerCase().startsWith("audio/")) {
    return "仅支持音频文件";
  }

  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > MAX_COVER_BYTES) {
      return "封面不能超过 5MB";
    }
    if (!COVER_TYPES.has(cover.type.toLowerCase())) {
      return "封面仅支持 JPEG、PNG 或 WebP 图片";
    }
  }

  return null;
}

export function SubmissionForm({ categories }: SubmissionFormProps) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const pending = state.status === "pending";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const fileError = validateFiles(formData);
    if (fileError) {
      setState({ status: "error", message: fileError });
      return;
    }

    setState({ status: "pending" });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; id?: number; error?: string }
        | null;

      if (!response.ok || !payload?.ok || typeof payload.id !== "number") {
        setState({
          status: "error",
          message: payload?.error || "投稿失败，请稍后重试",
        });
        return;
      }

      form.reset();
      setState({ status: "success", id: payload.id });
    } catch {
      setState({
        status: "error",
        message: "网络异常，投稿没有提交成功，请稍后重试",
      });
    }
  }

  if (state.status === "success") {
    return (
      <section className="paper-panel rounded-[28px] p-7 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-8" strokeWidth={1.6} aria-hidden />
        </span>
        <h2 className="mt-5 font-serif text-2xl text-ink sm:text-3xl">
          投稿已提交
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ink-muted">
          我们已收到你的声音（投稿编号 #{state.id}）。审核通过后才会在站点公开播放，结果会通过站内通知告诉你。
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/me/submissions"
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-medium text-paper transition hover:bg-ink-soft"
          >
            查看我的投稿
          </Link>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-sm font-medium text-ink transition hover:border-coral/50 hover:text-coral-deep"
          >
            再投一段
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="paper-panel rounded-[28px] p-5 sm:p-7"
    >
      <div className="flex items-start gap-3 border-b border-line pb-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral/10 text-coral-deep">
          <UploadCloud className="size-5" strokeWidth={1.6} aria-hidden />
        </span>
        <div>
          <h2 className="font-serif text-xl text-ink">声音信息</h2>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            音频与封面会先存到对象存储，审核通过后才对所有人可见。
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="submission-subject"
            className="text-sm font-medium text-ink"
          >
            标题 <span className="text-coral">*</span>
          </label>
          <input
            id="submission-subject"
            name="subject"
            type="text"
            required
            minLength={2}
            maxLength={100}
            placeholder="例如：雨夜书房 · 翻书与低语"
            className="mt-2 h-11 w-full rounded-2xl border border-line bg-white/70 px-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-coral/60 focus:ring-2 focus:ring-coral/15"
          />
          <p className="mt-1.5 text-xs text-ink-muted">2–100 个字符。</p>
        </div>

        <div>
          <label
            htmlFor="submission-category"
            className="text-sm font-medium text-ink"
          >
            分类 <span className="text-coral">*</span>
          </label>
          <select
            id="submission-category"
            name="categoryId"
            required
            defaultValue=""
            className="mt-2 h-11 w-full rounded-2xl border border-line bg-white/70 px-4 text-sm text-ink outline-none transition focus:border-coral/60 focus:ring-2 focus:ring-coral/15"
          >
            <option value="" disabled>
              选择分类
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="submission-author"
            className="text-sm font-medium text-ink"
          >
            作者 / 社团
          </label>
          <input
            id="submission-author"
            name="author"
            type="text"
            maxLength={64}
            placeholder="可选，最多 64 个字符"
            className="mt-2 h-11 w-full rounded-2xl border border-line bg-white/70 px-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-coral/60 focus:ring-2 focus:ring-coral/15"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="submission-summary"
            className="text-sm font-medium text-ink"
          >
            简介
          </label>
          <textarea
            id="submission-summary"
            name="summary"
            rows={4}
            maxLength={1000}
            placeholder="介绍一下这段声音的内容、适合的场景，或录制时的小故事。"
            className="mt-2 w-full resize-y rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-coral/60 focus:ring-2 focus:ring-coral/15"
          />
          <p className="mt-1.5 text-xs text-ink-muted">最多 1000 个字符。</p>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="submission-audio"
            className="text-sm font-medium text-ink"
          >
            音频文件 <span className="text-coral">*</span>
          </label>
          <input
            id="submission-audio"
            name="audio"
            type="file"
            required
            accept="audio/*"
            className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-line-strong bg-paper-warm/60 px-4 py-3 text-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-paper hover:border-coral/50"
          />
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <Music2 className="size-3.5" strokeWidth={1.8} aria-hidden />
            支持 mp3 / m4a / wav / flac 等音频格式，单个文件不超过 100MB。
          </p>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="submission-cover"
            className="text-sm font-medium text-ink"
          >
            封面图
          </label>
          <input
            id="submission-cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full cursor-pointer rounded-2xl border border-dashed border-line-strong bg-paper-warm/60 px-4 py-3 text-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-paper-deep file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:border-coral/50"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            可选，JPEG / PNG / WebP，不超过 5MB。建议使用 1:1 或 4:3 图片。
          </p>
        </div>
      </div>

      {state.status === "error" ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.8}
            aria-hidden
          />
          {state.message}
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <Sparkles className="size-3.5" strokeWidth={1.8} aria-hidden />
          投稿后需审核，通过后才能播放。
        </p>
        <button
          type="submit"
          disabled={pending || categories.length === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-coral px-6 text-sm font-medium text-white transition hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              正在上传…
            </>
          ) : (
            <>
              <UploadCloud className="size-4" strokeWidth={1.8} aria-hidden />
              提交投稿
            </>
          )}
        </button>
      </div>
    </form>
  );
}
