import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";

import { ChatThread } from "@/components/social/chat-thread";
import { formatDateTime } from "@/components/social/format";
import { MessageForm } from "@/components/social/message-form";
import { UserAvatar } from "@/components/social/user-avatar";
import { requireUser } from "@/lib/auth";
import {
  getConversationMessages,
  getPublicUser,
  markConversationRead,
} from "@/lib/queries/social";
import { toPositiveInt } from "@/lib/utils";

export const metadata: Metadata = {
  title: "私信对话",
  description: "你和同好之间的私信。",
  robots: { index: false, follow: false },
};

export default async function ConversationPage({
  params,
}: PageProps<"/messages/[id]">) {
  const viewer = await requireUser("/messages");
  const otherId = toPositiveInt((await params).id);
  if (!otherId || otherId === viewer.id) notFound();

  const other = await getPublicUser(otherId);
  if (!other) notFound();

  const messages = await getConversationMessages(viewer.id, otherId);
  // Opening a conversation clears its unread badge; the header badge refetches
  // on this route change so the count updates without a manual reload.
  await markConversationRead(viewer.id, otherId);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} aria-hidden />
          私信箱
        </Link>
        <Link
          href={`/u/${other.id}`}
          className="inline-flex items-center gap-1 transition-colors duration-300 hover:text-ink"
        >
          查看主页
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>

      <header className="mt-4 flex items-center gap-3.5 rounded-[22px] border border-line/80 bg-paper-warm/60 px-4 py-3.5">
        <UserAvatar username={other.username} avatar={other.avatar} size={44} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
            {other.username}
            {other.role === "admin" ? (
              <ShieldCheck
                className="size-3.5 shrink-0 text-mist-deep"
                strokeWidth={1.9}
                aria-hidden
              />
            ) : null}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {messages.length > 0
              ? `${messages.length} 条消息 · 最近 ${formatDateTime(messages[messages.length - 1]?.created ?? "")}`
              : "还没有开始聊天"}
          </p>
        </div>
        <span className="ml-auto hidden rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] text-ink-muted sm:inline">
          私密对话
        </span>
      </header>

      <ChatThread messages={messages} other={other} className="mt-3" />
      <MessageForm receiverId={other.id} className="mt-3" />
      <p className="mt-3 text-center text-[11px] leading-5 text-ink-muted">
        私信只有你们两人可见 · 请友善交流
      </p>
    </div>
  );
}
