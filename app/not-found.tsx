import Link from "next/link";
import { ArrowLeft, Disc3, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[62vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative">
        <span className="grid size-28 place-items-center rounded-full border border-line bg-paper-warm sm:size-32">
          <span className="vinyl-grooves absolute inset-3 rounded-full opacity-70" />
          <Disc3 className="relative size-10 text-ink-muted" strokeWidth={1.2} aria-hidden />
        </span>
        <span className="absolute -right-2 -top-1 rounded-full border border-line bg-paper px-2.5 py-1 font-serif text-xs text-coral-deep">
          404
        </span>
      </div>

      <p className="mt-8 text-[11px] tracking-[0.3em] text-ink-muted">
        TRACK NOT FOUND
      </p>
      <h1 className="mt-3 font-serif text-[clamp(2rem,7vw,3rem)] leading-tight text-ink">
        这张唱片不在架上
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
        你访问的页面可能被移动、删除，或者从来没有存在过。回到首页，或者换一段声音继续听。
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition duration-300 hover:bg-ink-soft"
        >
          <ArrowLeft className="size-4" aria-hidden />
          回到首页
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper px-5 py-3 text-sm text-ink-soft transition duration-300 hover:border-coral/40 hover:text-coral-deep"
        >
          <Search className="size-4" aria-hidden />
          搜索声音
        </Link>
      </div>
    </div>
  );
}
