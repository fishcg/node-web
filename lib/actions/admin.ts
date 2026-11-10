"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toPositiveInt } from "@/lib/utils";

interface SubmissionRow {
  id: number | string;
  uid: number | string;
  subject: string | null;
  status: number | string | null;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidateSubmissionPaths(id: number): void {
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/me/submissions");
  revalidatePath(`/sound/${id}`);
}

async function reviewSubmission(
  formData: FormData,
  decision: "approve" | "reject",
): Promise<void> {
  const admin = await requireAdmin("/admin/reviews");

  const id = toPositiveInt(formString(formData, "id"));
  if (id === null) redirect("/admin/reviews");

  const reason = formString(formData, "reason").trim();
  if (decision === "reject" && (reason.length < 1 || reason.length > 500)) {
    redirect(`/admin/reviews/${id}?error=reason`);
  }

  const submission = (await db("lab_music")
    .select("id", "uid", "subject", "status")
    .where("id", id)
    .first()) as SubmissionRow | undefined;

  // 已被其它管理员处理（或投稿不存在）时不做任何修改。
  if (!submission || Number(submission.status) !== 0) {
    redirect("/admin/reviews");
  }

  const title = decision === "approve" ? "投稿已通过" : "投稿未通过";
  const body =
    decision === "approve"
      ? `《${submission.subject ?? "未命名声音"}》已通过审核，现在可以播放了。`
      : `《${submission.subject ?? "未命名声音"}》未通过审核：${reason}`;
  const link =
    decision === "approve" ? `/sound/${submission.id}` : "/me/submissions";

  const changed = await db.transaction(async (trx) => {
    const updated = await trx("lab_music")
      .where({ id: submission.id, status: 0 })
      .update({
        status: decision === "approve" ? 1 : 2,
        review_reason: decision === "approve" ? "" : reason,
        reviewed_by: admin.id,
        reviewed_at: trx.fn.now(),
      });

    if (!updated) return false;

    await trx("lab_notification").insert({
      uid: submission.uid,
      type: "submission",
      title,
      body,
      link,
    });

    return true;
  });

  if (changed) {
    revalidateSubmissionPaths(Number(submission.id));
  }

  redirect(changed ? "/admin/reviews?done=1" : "/admin/reviews");
}

export async function approveSubmissionAction(formData: FormData): Promise<void> {
  await reviewSubmission(formData, "approve");
}

export async function rejectSubmissionAction(formData: FormData): Promise<void> {
  await reviewSubmission(formData, "reject");
}
