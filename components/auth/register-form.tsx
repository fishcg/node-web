"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

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
          placeholder="2-20 个字符"
          className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3.5 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#ff5a3c] focus:ring-4 focus:ring-[#ff5a3c]/10"
        />
        {state.fieldErrors?.username ? (
          <span className="mt-1.5 block text-xs text-red-600">{state.fieldErrors.username}</span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium tracking-wide text-stone-600">
            密码
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="至少 8 位"
            className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3.5 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#ff5a3c] focus:ring-4 focus:ring-[#ff5a3c]/10"
          />
          {state.fieldErrors?.password ? (
            <span className="mt-1.5 block text-xs text-red-600">{state.fieldErrors.password}</span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium tracking-wide text-stone-600">
            确认密码
          </span>
          <input
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="再输一次"
            className="w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3.5 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#ff5a3c] focus:ring-4 focus:ring-[#ff5a3c]/10"
          />
          {state.fieldErrors?.confirmPassword ? (
            <span className="mt-1.5 block text-xs text-red-600">
              {state.fieldErrors.confirmPassword}
            </span>
          ) : null}
        </label>
      </div>

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
        创建账号
        {!pending ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </button>

      <p className="text-center text-sm text-stone-500">
        已经有账号？
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="ml-1 font-medium text-[#c9422d] underline-offset-4 hover:underline"
        >
          直接登录
        </Link>
      </p>
    </form>
  );
}
