"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createComment, getCommentPage, toggleCommentLike } from "@/lib/queries/comments";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CommentItem, CommentPage } from "@/lib/types";

export interface CommentFormState {
  error?: string;
  comment?: CommentItem;
}

const COMMENT_RATE_LIMIT = 10;
const COMMENT_RATE_WINDOW_MS = 60_000;
const LIKE_RATE_LIMIT = 120;
const LOAD_RATE_LIMIT = 60;

function positiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function publishedSoundExists(soundId: number): Promise<boolean> {
  const row = await db("lab_music").where({ id: soundId, status: 1 }).first("id");
  return !!row;
}

/** 发表评论；成功后把新评论返回给客户端直接插入列表。 */
export async function createCommentAction(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录后再评论" };

  const soundId = positiveInt(formData.get("soundId"));
  const rawBody = formData.get("body");
  const body = typeof rawBody === "string" ? rawBody.trim() : "";

  if (!soundId) return { error: "声音不存在" };
  if (!body) return { error: "说点什么再发送吧" };
  if (body.length > 1000) return { error: "评论不能超过 1000 字" };

  const limit = checkRateLimit(
    `comment:${user.id}`,
    COMMENT_RATE_LIMIT,
    COMMENT_RATE_WINDOW_MS,
  );
  if (!limit.allowed) return { error: "评论太频繁，请稍后再试" };

  try {
    if (!(await publishedSoundExists(soundId))) {
      return { error: "这个声音还没有通过审核，暂时不能评论" };
    }

    const comment = await createComment(soundId, user.id, body);
    if (!comment) return { error: "评论失败，请稍后再试" };

    revalidatePath(`/sound/${soundId}`);
    return { comment };
  } catch (error) {
    console.error("[comments] create failed", error);
    return { error: "评论失败，请稍后再试" };
  }
}

/** 切换一条评论的点赞；客户端做乐观更新，失败时回滚。 */
export async function toggleCommentLikeAction(
  commentId: number,
): Promise<{ ok: true; liked: boolean; likeCount: number } | { ok: false; reason: "auth" | "error" }> {
  if (!Number.isSafeInteger(commentId) || commentId <= 0) {
    return { ok: false, reason: "error" };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "auth" };

  const limit = checkRateLimit(`comment-like:${user.id}`, LIKE_RATE_LIMIT, COMMENT_RATE_WINDOW_MS);
  if (!limit.allowed) return { ok: false, reason: "error" };

  try {
    const result = await toggleCommentLike(commentId, user.id);
    if (!result) return { ok: false, reason: "error" };
    return { ok: true, ...result };
  } catch (error) {
    console.error("[comments] toggle like failed", error);
    return { ok: false, reason: "error" };
  }
}

/** 加载更多旧评论（游标为上一页最后一条的 id）。 */
export async function loadMoreCommentsAction(
  soundId: number,
  cursor: number | null,
): Promise<{ ok: true; page: CommentPage } | { ok: false; error: string }> {
  if (!Number.isSafeInteger(soundId) || soundId <= 0) {
    return { ok: false, error: "声音不存在" };
  }
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor <= 0)) {
    return { ok: false, error: "分页参数不正确" };
  }

  const user = await getSessionUser();
  const limit = checkRateLimit(
    `comment-load:${user?.id ?? "guest"}`,
    LOAD_RATE_LIMIT,
    COMMENT_RATE_WINDOW_MS,
  );
  if (!limit.allowed) return { ok: false, error: "加载太频繁，请稍后再试" };

  try {
    if (!(await publishedSoundExists(soundId))) {
      return { ok: false, error: "声音不存在" };
    }
    const page = await getCommentPage(soundId, user?.id ?? null, cursor);
    return { ok: true, page };
  } catch (error) {
    console.error("[comments] load more failed", error);
    return { ok: false, error: "加载失败，请稍后再试" };
  }
}
