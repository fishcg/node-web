"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";

import { sendMessageAction, type SocialFormState } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 1000;
const INITIAL_STATE: SocialFormState = {};

interface MessageFormProps {
  receiverId: number;
  className?: string;
}

/** Composer for a conversation; a successful action redirects to the thread. */
export function MessageForm({ receiverId, className }: MessageFormProps) {
  const [state, formAction, pending] = useActionState(
    sendMessageAction,
    INITIAL_STATE,
  );
  const [body, setBody] = useState("");
  const canSend = body.trim().length > 0 && body.length <= MAX_LENGTH && !pending;

  return (
    <form
      action={formAction}
      className={cn("paper-panel rounded-[24px] p-3.5 sm:p-4", className)}
    >
      <input type="hidden" name="receiverId" value={receiverId} />
      <label htmlFor="message-body" className="sr-only">
        私信内容
      </label>
      <textarea
        id="message-body"
        name="body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={MAX_LENGTH}
        placeholder="写点什么…"
        className="w-full resize-none rounded-2xl border border-line/80 bg-paper px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-coral/50 focus:ring-2 focus:ring-coral/15"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-4 text-ink-muted">
          {state.error ? (
            <span role="alert" className="text-red-600">
              {state.error}
            </span>
          ) : (
            <>仅你们两人可见 · 最多 1000 字</>
          )}
        </p>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[11px] tabular-nums",
              body.length > MAX_LENGTH - 80 ? "text-coral-deep" : "text-ink-muted",
            )}
          >
            {body.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-paper transition duration-300 hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="size-3.5" strokeWidth={1.9} aria-hidden />
            {pending ? "发送中…" : "发送"}
          </button>
        </div>
      </div>
    </form>
  );
}
