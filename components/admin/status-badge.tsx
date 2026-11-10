import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import type { SubmissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: {
    label: "待审核",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "已通过",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "未通过",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-700",
  },
} as const;

export function StatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.8} aria-hidden />
      {config.label}
    </span>
  );
}
