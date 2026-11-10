"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      <label className="block">
        <span className="mb-2 block text-[13px] font-medium tracking-wide text-stone-600">
          用户名
        </span>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          autoFocus
          defaultValue={state.values?.username ?? ""}
          placeholder="demo"
          className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3.5 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#ff5a3c] focus:ring-4 focus:ring-[#ff5a3c]/10"
        />
        {state.fieldErrors?.username ? (
          <span className="mt-1.5 block text-xs text-red-600">{state.fieldErrors.username}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-[13px] font-medium tracking-wide text-stone-600">
          密码
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="至少 8 位"
          className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3.5 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#ff5a3c] focus:ring-4 focus:ring-[#ff5a3c]/10"
        />
        {state.fieldErrors?.password ? (
          <span className="mt-1.5 block text-xs text-red-600">{state.fieldErrors.password}</span>
        ) : null}
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff5a3c] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(255,90,60,0.8)] transition hover:bg-[#ef4b2e] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        登录
        {!pending ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </button>

      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 px-4 py-3 text-xs leading-relaxed text-stone-500">
        本地演示账号：<strong className="text-stone-700">demo</strong> /{" "}
        <strong className="text-stone-700">demo1234</strong>
      </div>

      <p className="text-center text-sm text-stone-500">
        还没有账号？
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="ml-1 font-medium text-[#c9422d] underline-offset-4 hover:underline"
        >
          注册一个
        </Link>
      </p>
    </form>
  );
}
