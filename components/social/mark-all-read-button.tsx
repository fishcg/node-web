"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

import { requestUnreadRefresh } from "@/components/unread-badges";
import { markNotificationsReadAction } from "@/lib/actions/social";

/** Marks every notification read, then refreshes both the page and the badges. */
export function MarkAllReadButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending || count === 0}
      onClick={() =>
        startTransition(async () => {
          await markNotificationsReadAction();
          requestUnreadRefresh();
          router.refresh();
        })
      }
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-paper px-4 text-sm text-ink-soft transition duration-300 hover:border-ink/25 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
    >
      <CheckCheck className="size-4" strokeWidth={1.8} aria-hidden />
      {pending ? "处理中…" : "全部标为已读"}
    </button>
  );
}
