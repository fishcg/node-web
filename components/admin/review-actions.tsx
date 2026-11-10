import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

import {
  approveSubmissionAction,
  rejectSubmissionAction,
} from "@/lib/actions/admin";

export function ReviewActions({ id }: { id: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        action={approveSubmissionAction}
        className="flex flex-col rounded-[24px] border border-emerald-200/80 bg-emerald-50/40 p-5"
      >
        <input type="hidden" name="id" value={id} />
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-4" strokeWidth={1.8} aria-hidden />
          </span>
          <h2 className="font-serif text-lg text-ink">通过审核</h2>
        </div>
        <p className="mt-3 flex-1 text-sm leading-6 text-ink-muted">
          通过后声音会立即在站点公开，并向投稿者发送一条站内通知。
        </p>
        <button
          type="submit"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <ShieldCheck className="size-4" strokeWidth={1.8} aria-hidden />
          通过并发布
        </button>
      </form>

      <form
        action={rejectSubmissionAction}
        className="flex flex-col rounded-[24px] border border-line bg-paper-warm/60 p-5"
      >
        <input type="hidden" name="id" value={id} />
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-red-50 text-red-600">
            <XCircle className="size-4" strokeWidth={1.8} aria-hidden />
          </span>
          <h2 className="font-serif text-lg text-ink">驳回投稿</h2>
        </div>
        <label
          htmlFor={`reject-reason-${id}`}
          className="mt-3 text-sm font-medium text-ink"
        >
          驳回原因 <span className="text-coral">*</span>
        </label>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          会展示给投稿者，请写清楚需要修改的内容（1–500 个字符）。
        </p>
        <textarea
          id={`reject-reason-${id}`}
          name="reason"
          required
          minLength={1}
          maxLength={500}
          rows={4}
          placeholder="例如：音频中段有明显空白，请重新上传完整版本。"
          className="mt-2 w-full flex-1 resize-y rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-coral/60 focus:ring-2 focus:ring-coral/15"
        />
        <button
          type="submit"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
        >
          <XCircle className="size-4" strokeWidth={1.8} aria-hidden />
          确认驳回
        </button>
      </form>
    </div>
  );
}
