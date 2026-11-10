import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones, Heart, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { SITE } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "登录" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const user = await getSessionUser();
  if (user) redirect(nextPath);

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7f3ec] px-4 py-10 sm:px-6 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#ff5a3c]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#7c6cf0]/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#e5ddd0] bg-[#fffdf9] shadow-[0_40px_100px_-60px_rgba(42,32,24,0.55)] lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden bg-[#17131c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,90,60,0.45),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(124,108,240,0.35),transparent_50%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70">
              <Headphones className="h-4 w-4" />
              {SITE.name}
            </Link>
            <h1 className="mt-16 max-w-sm font-serif text-4xl leading-[1.2] tracking-tight">
              让每一次登录，
              <br />
              都回到安静的声音里。
            </h1>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/60">
              {SITE.tagline}
            </p>
          </div>

          <div className="relative space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <Heart className="h-4 w-4 text-[#ff8f78]" />
              收藏喜欢的声音，随时继续听
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <Sparkles className="h-4 w-4 text-[#b9adff]" />
              ASMR、音乐、有声书，一站收好
            </div>
          </div>

          <div
            aria-hidden
            className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full border border-white/10"
          />
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-500">
              <Headphones className="h-4 w-4" />
              {SITE.name}
            </Link>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#c9422d]">Welcome back</p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-stone-900">欢迎回来</h2>
          <p className="mt-2 text-sm text-stone-500">登录后继续你的声音收藏。</p>

          <div className="mt-8">
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}
