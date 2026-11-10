import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  FileCheck2,
  MessageSquare,
  UserPlus,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/components/social/format";
import { MarkAllReadButton } from "@/components/social/mark-all-read-button";
import { requireUser } from "@/lib/auth";
import { getNotifications, getUnreadCounts } from "@/lib/queries/social";
import type { NotificationItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "通知",
  description: "投稿审核、关注与私信提醒。",
  robots: { index: false, follow: false },
};

function NotificationIcon({ type }: { type: string }) {
  const className = "size-[18px]";
  const strokeWidth = 1.7;

  if (type === "submission") {
    return <FileCheck2 className={className} strokeWidth={strokeWidth} aria-hidden />;
  }
  if (type === "follow") {
    return <UserPlus className={className} strokeWidth={strokeWidth} aria-hidden />;
  }
  if (type === "message") {
    return <MessageSquare className={className} strokeWidth={strokeWidth} aria-hidden />;
  }
  return <Bell className={className} strokeWidth={strokeWidth} aria-hidden />;
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const unread = !item.readAt;
  const body = (
    <>
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full border",
          unread
            ? "border-coral/25 bg-coral/10 text-coral-deep"
            : "border-line bg-paper text-ink-muted",
        )}
      >
        <NotificationIcon type={item.type} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-ink">{item.title}</p>
          <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
            {formatDateTime(item.created)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{item.body}</p>
      </div>
      {unread ? (
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" aria-hidden />
      ) : null}
    </>
  );

  const className = cn(
    "flex items-start gap-3.5 rounded-[22px] border p-4 transition duration-300 sm:p-5",
    unread
      ? "border-coral/25 bg-paper-warm shadow-[0_18px_38px_-32px_rgba(255,90,60,0.8)]"
      : "border-line/70 bg-paper-warm/40",
    item.link && "hover:border-coral/40 hover:bg-paper-warm",
  );

  if (item.link && item.link.startsWith("/")) {
    return (
      <Link href={item.link} className={cn("group", className)}>
        {body}
        <span
          aria-hidden
          className="mt-2 shrink-0 text-ink-muted transition duration-300 group-hover:translate-x-0.5 group-hover:text-coral-deep"
        >
          <ArrowUpRight className="size-4" strokeWidth={1.8} />
        </span>
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

export default async function NotificationsPage() {
  const user = await requireUser("/me/notifications");
  const [notifications, unread] = await Promise.all([
    getNotifications(user.id),
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
        <span className="text-ink-soft">通知</span>
      </nav>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line/80 pb-6">
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-[0.28em] text-ink-muted">
            <Bell className="size-3.5 text-coral" strokeWidth={1.8} aria-hidden />
            YOUR INBOX
          </p>
          <h1 className="mt-2.5 font-serif text-[clamp(1.9rem,5.4vw,2.8rem)] leading-tight text-ink">
            通知
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            共 {notifications.length} 条
            {unread.notifications > 0
              ? ` · ${unread.notifications} 条未读`
              : " · 全部已读"}
          </p>
        </div>
        <MarkAllReadButton count={unread.notifications} />
      </header>

      {notifications.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="还没有通知"
            description="投稿审核结果、关注和私信提醒会出现在这里。"
            icon={<Bell className="size-6" strokeWidth={1.5} aria-hidden />}
            action={
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition hover:bg-ink-soft"
              >
                去投稿
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {notifications.map((item) => (
            <li key={item.id}>
              <NotificationRow item={item} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[11px] text-ink-muted">
        只保留最近 30 条通知
      </p>
    </div>
  );
}
