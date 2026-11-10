"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageCircle } from "lucide-react";

import type { UnreadCounts } from "@/lib/types";
import { cn } from "@/lib/utils";

const UNREAD_REFRESH_EVENT = "acgay:unread-refresh";
const POLL_INTERVAL_MS = 30_000;

export const ZERO_UNREAD: UnreadCounts = { notifications: 0, messages: 0 };

/** Ask every mounted unread hook to refetch immediately (after read actions). */
export function requestUnreadRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT));
}

function isUnreadCounts(value: unknown): value is UnreadCounts {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.notifications === "number" &&
    typeof candidate.messages === "number"
  );
}

/**
 * Live unread counters. The server ships the initial value, then the hook
 * refetches on mount, on route changes, every 30s, and on explicit refreshes.
 */
export function useUnreadCounts(
  initial: UnreadCounts = ZERO_UNREAD,
): UnreadCounts {
  const [counts, setCounts] = useState<UnreadCounts>(() =>
    isUnreadCounts(initial) ? initial : ZERO_UNREAD,
  );
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/unread", { cache: "no-store" });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (active && isUnreadCounts(data)) {
          setCounts({
            notifications: Math.max(0, Math.trunc(data.notifications)),
            messages: Math.max(0, Math.trunc(data.messages)),
          });
        }
      } catch {
        // Keep the last known values; a transient failure should not flash badges.
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const onRefresh = (): void => void load();
    window.addEventListener(UNREAD_REFRESH_EVENT, onRefresh);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(UNREAD_REFRESH_EVENT, onRefresh);
    };
  }, [pathname]);

  return counts;
}

export function UnreadBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden
      className={cn(
        "absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-paper",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Header shortcuts: notifications (desktop) and messages, each with a badge. */
export function HeaderUnread({ initial }: { initial?: UnreadCounts }) {
  const counts = useUnreadCounts(initial);

  return (
    <>
      <Link
        href="/me/notifications"
        aria-label={
          counts.notifications > 0
            ? `通知，${counts.notifications} 条未读`
            : "通知"
        }
        className="relative hidden size-9 place-items-center rounded-full border border-transparent text-ink-soft transition duration-300 hover:border-line hover:bg-paper-warm hover:text-ink sm:grid"
      >
        <Bell className="size-[18px]" strokeWidth={1.7} aria-hidden />
        <UnreadBadge count={counts.notifications} />
      </Link>
      <Link
        href="/messages"
        aria-label={
          counts.messages > 0 ? `私信，${counts.messages} 条未读` : "私信"
        }
        className="relative grid size-9 place-items-center rounded-full border border-transparent text-ink-soft transition duration-300 hover:border-line hover:bg-paper-warm hover:text-ink"
      >
        <MessageCircle className="size-[18px]" strokeWidth={1.7} aria-hidden />
        <UnreadBadge count={counts.messages} />
      </Link>
    </>
  );
}
