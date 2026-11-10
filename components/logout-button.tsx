"use client";

import { LogOut } from "lucide-react";
import { useActionState } from "react";
import { logoutAction } from "@/lib/actions/auth";

/**
 * POST-only logout. Server-rendered pages must never link to /logout with GET,
 * so the session is cleared through the auth server action.
 */
export function LogoutButton() {
  const [, formAction, pending] = useActionState(logoutAction, {});

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-warm px-4 py-2.5 text-sm text-ink-soft transition hover:border-coral/40 hover:bg-coral/5 hover:text-coral-deep disabled:opacity-60"
      >
        <LogOut className="size-4" strokeWidth={1.7} aria-hidden />
        {pending ? "正在退出…" : "退出登录"}
      </button>
    </form>
  );
}
