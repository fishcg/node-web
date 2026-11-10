"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isFollowing, markAllNotificationsRead } from "@/lib/queries/social";
import { checkRateLimit } from "@/lib/rate-limit";

export interface SocialFormState {
  error?: string;
}

const MESSAGE_RATE_LIMIT = 20;
const MESSAGE_RATE_WINDOW_MS = 60_000;

function parseId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function activeUserExists(id: number): Promise<boolean> {
  const row = (await db("lab_user")
    .select("id")
    .where({ id })
    .where("status", 1)
    .first()) as { id: number | string } | undefined;
  return !!row;
}

export async function toggleFollowAction(
  _prev: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  const targetId = parseId(formData.get("targetId"));
  if (!targetId) return { error: "用户不存在" };
  if (targetId === user.id) return { error: "不能关注自己" };
  if (!(await activeUserExists(targetId))) return { error: "用户不存在" };

  try {
    const following = await isFollowing(user.id, targetId);
    if (following) {
      await db("lab_follow")
        .where({ follower_id: user.id, following_id: targetId })
        .del();
    } else {
      // 唯一键兜底：并发点击时重复插入被忽略，不抛错。
      await db("lab_follow")
        .insert({ follower_id: user.id, following_id: targetId })
        .onConflict(["follower_id", "following_id"])
        .ignore();
    }
  } catch (error) {
    console.error("[social] toggle follow failed", error);
    return { error: "操作失败，请稍后再试" };
  }

  revalidatePath(`/u/${targetId}`);
  revalidatePath("/me");
  return {};
}

export async function sendMessageAction(
  _prev: SocialFormState,
  formData: FormData,
): Promise<SocialFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  const receiverId = parseId(formData.get("receiverId"));
  if (!receiverId) return { error: "收件人不存在" };
  if (receiverId === user.id) return { error: "不能给自己发私信" };
  if (!(await activeUserExists(receiverId))) return { error: "收件人不存在" };

  const rawBody = formData.get("body");
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (body.length < 1) return { error: "请输入私信内容" };
  if (body.length > 1000) return { error: "私信内容不能超过 1000 字" };

  const limit = checkRateLimit(
    `social-message:${user.id}`,
    MESSAGE_RATE_LIMIT,
    MESSAGE_RATE_WINDOW_MS,
  );
  if (!limit.allowed) return { error: "发送太频繁，请稍后再试" };

  try {
    await db("lab_message").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      body,
    });
  } catch (error) {
    console.error("[social] send message failed", error);
    return { error: "发送失败，请稍后再试" };
  }

  revalidatePath("/messages");
  revalidatePath(`/messages/${receiverId}`);
  redirect(`/messages/${receiverId}`);
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  await markAllNotificationsRead(user.id);
  revalidatePath("/me/notifications");
  revalidatePath("/api/unread");
}
