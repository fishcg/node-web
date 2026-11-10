"use client";

import { useActionState } from "react";
import { Check, UserPlus } from "lucide-react";

import { toggleFollowAction, type SocialFormState } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

const INITIAL_STATE: SocialFormState = {};

interface FollowButtonProps {
  targetId: number;
  /** Server-provided state; the server action revalidates this page. */
  following: boolean;
  className?: string;
}

export function FollowButton({
  targetId,
  following,
  className,
}: FollowButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleFollowAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className={cn("flex flex-col items-start gap-1.5", className)}>
      <input type="hidden" name="targetId" value={targetId} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={following}
        title={following ? "再次点击取消关注" : undefined}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition duration-300 disabled:cursor-wait disabled:opacity-65",
          following
            ? "border border-line-strong bg-paper text-ink hover:border-ink/25 hover:bg-paper-deep"
            : "bg-coral text-white shadow-[0_12px_28px_-14px_rgba(255,90,60,0.9)] hover:bg-coral-deep",
        )}
      >
        {following ? (
          <Check className="size-4" strokeWidth={2} aria-hidden />
        ) : (
          <UserPlus className="size-4" strokeWidth={1.9} aria-hidden />
        )}
        {pending ? "处理中…" : following ? "已关注" : "关注"}
      </button>
      {state.error ? (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
