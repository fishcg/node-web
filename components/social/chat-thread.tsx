"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";

import { formatChatDay, formatChatTime } from "@/components/social/format";
import { UserAvatar } from "@/components/social/user-avatar";
import type { ChatMessage, PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  messages: ChatMessage[];
  other: PublicUser;
  className?: string;
}

/** Scrollable conversation panel; sticks to the newest message on mount/send. */
export function ChatThread({ messages, other, className }: ChatThreadProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "max-h-[min(58vh,560px)] min-h-[36vh] overflow-y-auto overscroll-contain rounded-[24px] border border-line/80 bg-paper-warm/55 p-4 sm:p-5",
        className,
      )}
    >
      {messages.length === 0 ? (
        <div className="flex h-full min-h-[30vh] flex-col items-center justify-center text-center">
          <span className="grid size-12 place-items-center rounded-full border border-line bg-paper text-ink-muted">
            <MessageSquare className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="mt-3 font-serif text-lg text-ink">还没有消息</p>
          <p className="mt-1.5 max-w-xs text-sm leading-6 text-ink-muted">
            发第一条私信，和 @{other.username} 打个招呼吧。
          </p>
        </div>
      ) : (
        messages.map((message, index) => {
          const previous = index > 0 ? messages[index - 1] : null;
          const showDay =
            !previous ||
            previous.created.slice(0, 10) !== message.created.slice(0, 10);
          const showAvatar =
            !message.isMine && (!previous || previous.senderId !== message.senderId);

          return (
            <div key={message.id}>
              {showDay ? (
                <div className="my-4 flex items-center gap-3 text-[10px] tracking-[0.22em] text-ink-muted">
                  <span aria-hidden className="h-px flex-1 bg-line" />
                  {formatChatDay(message.created)}
                  <span aria-hidden className="h-px flex-1 bg-line" />
                </div>
              ) : null}

              <div
                className={cn(
                  "mt-2 flex items-end gap-2",
                  message.isMine ? "justify-end" : "justify-start",
                )}
              >
                {message.isMine ? null : showAvatar ? (
                  <UserAvatar
                    username={other.username}
                    avatar={other.avatar}
                    size={26}
                    className="mb-5"
                  />
                ) : (
                  <span aria-hidden className="mb-5 w-[26px] shrink-0" />
                )}

                <div
                  className={cn(
                    "flex max-w-[78%] flex-col",
                    message.isMine ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2.5 text-sm leading-6",
                      message.isMine
                        ? "rounded-br-md bg-ink text-paper"
                        : "rounded-bl-md border border-line/80 bg-paper text-ink",
                    )}
                  >
                    {message.body}
                  </div>
                  <span className="mt-1 text-[10px] tabular-nums text-ink-muted">
                    {formatChatTime(message.created)}
                    {message.isMine && message.readAt ? " · 已读" : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
