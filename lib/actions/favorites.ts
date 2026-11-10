"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; reason: "auth" | "error" };

/**
 * 切换收藏状态。
 * 依赖 lab_favorite 的 (uid, music_id) 唯一键，重复点击也不会产生脏数据。
 */
export async function toggleFavoriteAction(soundId: number): Promise<ToggleFavoriteResult> {
  if (!Number.isInteger(soundId) || soundId <= 0) {
    return { ok: false, reason: "error" };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "auth" };

  try {
    const existing = (await db("lab_favorite")
      .select("id")
      .where({ uid: user.id, music_id: soundId })
      .first()) as { id: number | string } | undefined;

    let favorited: boolean;

    if (existing) {
      await db("lab_favorite").where({ uid: user.id, music_id: soundId }).del();
      favorited = false;
    } else {
      // 只允许收藏存在且已发布的声音
      const sound = (await db("lab_music")
        .select("id")
        .where({ id: soundId })
        .where("status", 1)
        .first()) as { id: number | string } | undefined;
      if (!sound) return { ok: false, reason: "error" };

      await db("lab_favorite")
        .insert({ uid: user.id, music_id: soundId })
        .onConflict(["uid", "music_id"])
        .ignore();
      favorited = true;
    }

    revalidatePath("/me");
    revalidatePath("/me/favorites");
    return { ok: true, favorited };
  } catch (error) {
    console.error("[favorites] toggle failed", error);
    return { ok: false, reason: "error" };
  }
}
