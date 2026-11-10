import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { formatListTime } from "@/components/social/format";
import { UserAvatar } from "@/components/social/user-avatar";
import { requireUser } from "@/lib/auth";
import { getConversations, getUnreadCounts } from "@/lib/queries/social";

export const metadata: Metadata = {
  title: "私信",
  description: "你和同好之间的私信。",
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const [conversations, unread] = await Promise.all([
    getConversations(user.id),
    getUnreadCounts(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <nav
        aria-label="面包屑"
        className="flex items-center gap-2 text-xs text-ink-muted"
      >
        <Link
          href="/me"
          className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
          我的主页
        </Link>
        <span aria-hidden className="text-line-strong">
          /
        </span>
        <span className="text-ink-soft">私信</span>
      </nav>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-6">
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-ink-muted">
            <MessageSquare className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
            MESSAGES
          </p>
          <h1 className="mt-2.5 font-serif text-[clamp(1.9rem,5.4vw,2.8rem)] leading-tight text-ink">
            私信
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            共 {conversations.length} 个会话
            {unread.messages > 0 ? ` · ${unread.messages} 条未读` : ""}
          </p>
        </div>
        <Link
          href="/category/music"
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-paper px-4 py-2 text-xs text-ink-soft transition duration-300 hover:border-ink/25 hover:text-ink"
        >
          去认识同好
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        </Link>
      </header>

      {conversations.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="还没有私信"
            description="在别人的主页点「发私信」，或者从你喜欢的声音作者开始聊起。"
            icon={<MessageSquare className="size-6" strokeWidth={1.5} aria-hidden />}
            action={
              <Link
                href="/category/asmr"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
              >
                去 ASMR 区看看
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {conversations.map((conversation) => (
            <li key={conversation.user.id}>
              <Link
                href={`/messages/${conversation.user.id}`}
                className="group flex items-start gap-3.5 rounded-[22px] border border-line/80 bg-paper-warm/55 p-4 transition duration-300 hover:border-coral/35 hover:bg-paper-warm sm:items-center sm:p-5"
              >
                <UserAvatar
                  username={conversation.user.username}
                  avatar={conversation.user.avatar}
                  size={46}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {conversation.user.username}
                      {conversation.user.role === "admin" ? (
                        <span className="ml-1.5 text-[10px] font-normal tracking-wide text-mist-deep">
                          管理员
                        </span>
                      ) : null}
                    </p>
                    <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
                      {formatListTime(conversation.lastAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-ink-muted sm:text-[13px]">
                    {conversation.lastMessage}
                  </p>
                  {conversation.unread > 0 ? (
                    <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-medium text-coral-deep">
                      {conversation.unread} 条未读
                    </p>
                  ) : null}
                </div>
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-ink-muted transition duration-300 group-hover:translate-x-0.5 group-hover:text-coral-deep sm:mt-0"
                >
                  <ArrowUpRight className="size-4" strokeWidth={1.8} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {conversations.length > 0 ? (
        <p className="mt-6 text-center text-[11px] leading-5 text-ink-muted">
          私信只有你们两人可见 · 请友善交流
        </p>
      ) : null}
    </div>
  );
}
