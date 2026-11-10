"use client";

import Link from "next/link";
import { ArrowLeft, Disc3, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("页面渲染出错：", error);
  }, [error]);

  return (
    <div className="relative mx-auto flex min-h-[62vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative">
        <span className="grid size-28 place-items-center rounded-full border border-line bg-paper-warm sm:size-32">
          <span className="vinyl-grooves absolute inset-3 rounded-full opacity-70" />
          <Disc3 className="size-10 animate-float text-ink-muted" strokeWidth={1.2} aria-hidden />
        </span>
        <span className="absolute -right-3 -top-2 rounded-full border border-line bg-paper px-2.5 py-1 font-serif text-xs text-coral-deep">
          OOPS
        </span>
      </div>

      <p className="mt-8 text-[11px] tracking-[0.3em] text-ink-muted">
        PLAYBACK INTERRUPTED
      </p>
      <h1 className="mt-3 font-serif text-[clamp(2rem,7vw,3rem)] leading-tight text-ink">
        这一刻卡住了
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
        页面加载时出了点小问题，可以重试一次，或者先回到首页。
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition duration-300 hover:bg-ink-soft"
        >
          <RotateCcw className="size-4" aria-hidden />
          再试一次
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper px-5 py-3 text-sm text-ink-soft transition duration-300 hover:border-coral/40 hover:text-coral-deep"
        >
          <ArrowLeft className="size-4" aria-hidden />
          回到首页
        </Link>
      </div>
    </div>
  );
}
