import "server-only";

import { db } from "@/lib/db";
import type { CommentItem, CommentPage, PublicUser } from "@/lib/types";
import { assetUrl } from "@/lib/utils";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 30;

interface CommentRow {
  id: number;
  sound_id: number;
  body: string;
  like_count: number;
  created: string;
  uid: number;
  username: string;
  avatar: string | null;
  role: PublicUser["role"];
  user_created: string;
}

const COMMENT_COLUMNS = {
  id: "c.id",
  sound_id: "c.music_id",
  body: "c.body",
  like_count: "c.like_count",
  created: "c.created",
  uid: "u.id",
  username: "u.username",
  avatar: "u.avatar",
  role: "u.role",
  user_created: "u.created",
} as const;

function toCommentItem(row: CommentRow, likedIds: Set<number>): CommentItem {
  return {
    id: Number(row.id),
    soundId: Number(row.sound_id),
    body: row.body,
    likeCount: Number(row.like_count),
    likedByMe: likedIds.has(Number(row.id)),
    created: String(row.created),
    author: {
      id: Number(row.uid),
      username: row.username,
      avatar: row.avatar ? assetUrl(row.avatar) : null,
      role: row.role,
      created: String(row.user_created),
    },
  };
}

async function getLikedIds(viewerId: number | null, commentIds: number[]): Promise<Set<number>> {
  if (!viewerId || commentIds.length === 0) return new Set();
  const rows = await db("lab_comment_like")
    .where("uid", viewerId)
    .whereIn("comment_id", commentIds)
    .pluck("comment_id");
  return new Set(rows.map(Number));
}

/**
 * 游标分页读取某个声音的评论。
 *
 * 只读一次评论表（join 作者），再按当前页的 comment id 批量查点赞集合，
 * 避免每条评论单独查一次点赞状态的 N+1。
 */
export async function getCommentPage(
  soundId: number,
  viewerId: number | null,
  cursor: number | null = null,
  limit = DEFAULT_LIMIT,
): Promise<CommentPage> {
  const pageSize = Math.min(Math.max(1, Math.trunc(limit)), MAX_LIMIT);

  let query = db("lab_comment as c")
    .join("lab_user as u", "u.id", "c.uid")
    .select(COMMENT_COLUMNS)
    .where("c.music_id", soundId)
    .where("c.status", 1)
    .where("u.status", 1);

  if (cursor && cursor > 0) {
    query = query.andWhere("c.id", "<", cursor);
  }

  const rows = (await query.orderBy("c.id", "desc").limit(pageSize + 1)) as CommentRow[];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const likedIds = await getLikedIds(viewerId, pageRows.map((row) => Number(row.id)));

  return {
    items: pageRows.map((row) => toCommentItem(row, likedIds)),
    nextCursor: hasMore && pageRows.length > 0 ? Number(pageRows[pageRows.length - 1].id) : null,
  };
}

/** 单条评论，用于发表评论后直接把新评论返回给客户端。 */
export async function getCommentById(commentId: number, viewerId: number | null): Promise<CommentItem | null> {
  const row = (await db("lab_comment as c")
    .join("lab_user as u", "u.id", "c.uid")
    .select(COMMENT_COLUMNS)
    .where("c.id", commentId)
    .where("c.status", 1)
    .where("u.status", 1)
    .first()) as CommentRow | undefined;

  if (!row) return null;
  const likedIds = await getLikedIds(viewerId, [Number(row.id)]);
  return toCommentItem(row, likedIds);
}

/**
 * 写入评论并原子累加 lab_music.replies。
 * 返回新评论 id；声音不存在或未发布时返回 null。
 */
export async function createComment(soundId: number, uid: number, body: string): Promise<CommentItem | null> {
  const newId = await db.transaction(async (trx) => {
    const sound = await trx("lab_music")
      .where({ id: soundId, status: 1 })
      .first("id");

    if (!sound) return null;

    const [insertedId] = await trx("lab_comment").insert({
      music_id: soundId,
      uid,
      body,
    });

    await trx("lab_music").where({ id: soundId, status: 1 }).increment("replies", 1);
    return Number(insertedId);
  });

  if (!newId) return null;
  return getCommentById(newId, uid);
}

/**
 * 切换评论点赞。返回最新点赞状态与计数；评论/声音不可见时返回 null。
 */
export async function toggleCommentLike(
  commentId: number,
  uid: number,
): Promise<{ liked: boolean; likeCount: number } | null> {
  return db.transaction(async (trx) => {
    const comment = await trx("lab_comment as c")
      .join("lab_music as m", "m.id", "c.music_id")
      .select("c.id", "c.like_count")
      .where("c.id", commentId)
      .where("c.status", 1)
      .where("m.status", 1)
      .first();

    if (!comment) return null;

    const result = await trx("lab_comment_like")
      .insert({ comment_id: commentId, uid })
      .onConflict(["comment_id", "uid"])
      .ignore();
    const insertedId = Number(Array.isArray(result) ? result[0] : result);
    const liked = insertedId > 0;

    if (liked) {
      await trx("lab_comment").where({ id: commentId }).increment("like_count", 1);
    } else {
      const removed = await trx("lab_comment_like")
        .where({ comment_id: commentId, uid })
        .delete();
      if (removed > 0) {
        await trx("lab_comment")
          .where({ id: commentId })
          .where("like_count", ">", 0)
          .decrement("like_count", 1);
      }
    }

    const latest = await trx("lab_comment").where({ id: commentId }).first("like_count");
    return {
      liked,
      likeCount: Number(latest?.like_count ?? 0),
    };
  });
}
