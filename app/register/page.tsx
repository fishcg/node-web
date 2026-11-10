import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones, Library, MessageCircleHeart, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { SITE } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";
import { getPublishedSoundCount } from "@/lib/queries/sounds";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "注册" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);
  const [user, publishedSounds] = await Promise.all([
    getSessionUser(),
    getPublishedSoundCount(),
  ]);
  if (user) redirect(nextPath);

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7f3ec] px-4 py-10 sm:px-6 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-[#7c6cf0]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#ff5a3c]/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#e5ddd0] bg-[#fffdf9] shadow-[0_40px_100px_-60px_rgba(42,32,24,0.55)] lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden bg-[#17131c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,108,240,0.5),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(255,90,60,0.4),transparent_50%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70">
              <Headphones className="h-4 w-4" />
              {SITE.name}
            </Link>
            <h1 className="mt-16 max-w-sm font-serif text-4xl leading-[1.2] tracking-tight">
              建一个只属于你的
              <br />
              声音书架。
            </h1>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/60">
              注册不需要邮箱，只要一个名字和密码。收藏会在所有设备上同步。
            </p>
          </div>

          <div className="relative space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <Library className="h-4 w-4 text-[#b9adff]" />
              {publishedSounds} 段声音，从音乐到睡前读物
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <MessageCircleHeart className="h-4 w-4 text-[#ff8f78]" />
              一个安静、没有弹幕的收听角落
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
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.24em] text-[#6f5bd8]">
            <Sparkles className="h-3.5 w-3.5" />
            Join the quiet
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-stone-900">创建账号</h2>
          <p className="mt-2 text-sm text-stone-500">只需要一个用户名和密码。</p>

          <div className="mt-8">
            <RegisterForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}
