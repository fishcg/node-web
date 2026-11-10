import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile, uploadFile } from "@/lib/oss";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + MAX_COVER_BYTES + 1024 * 1024;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const fieldsSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(2, "标题至少需要 2 个字符")
    .max(100, "标题最多 100 个字符"),
  summary: z
    .string()
    .trim()
    .max(1000, "简介最多 1000 个字符"),
  author: z.string().trim().max(64, "作者最多 64 个字符"),
  categoryId: z.coerce
    .number()
    .int("分类不合法")
    .min(100, "分类不合法")
    .max(105, "分类不合法"),
});

function jsonError(
  message: string,
  status: number,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function cleanupUploads(keys: string[]): Promise<void> {
  await Promise.allSettled(keys.filter(Boolean).map((key) => deleteFile(key)));
}

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return jsonError("请先登录后再投稿", 401);
  }

  const rate = checkRateLimit(`submission:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rate.allowed) {
    return jsonError("投稿过于频繁，每小时最多 5 次，请稍后再试", 429, {
      "Retry-After": String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))),
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonError("上传内容过大：音频不能超过 100MB，封面不能超过 5MB", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("请求格式不正确，需要 multipart/form-data", 400);
  }

  const parsed = fieldsSchema.safeParse({
    subject: formString(formData, "subject"),
    summary: formString(formData, "summary"),
    author: formString(formData, "author"),
    categoryId: formString(formData, "categoryId"),
  });

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "请检查投稿内容", 400);
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size <= 0) {
    return jsonError("请选择要投稿的音频文件", 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return jsonError("音频不能超过 100MB", 400);
  }
  if (!audio.type.toLowerCase().startsWith("audio/")) {
    return jsonError("仅支持音频文件", 400);
  }

  const coverValue = formData.get("cover");
  let cover: File | null = null;
  if (coverValue instanceof File && coverValue.size > 0) {
    if (coverValue.size > MAX_COVER_BYTES) {
      return jsonError("封面不能超过 5MB", 400);
    }
    if (!ALLOWED_COVER_TYPES.has(coverValue.type.toLowerCase())) {
      return jsonError("封面仅支持 JPEG、PNG 或 WebP 图片", 400);
    }
    cover = coverValue;
  }

  let audioKey = "";
  let coverKey = "";

  try {
    audioKey = await uploadFile(audio, "sound", user.id);
    if (cover) {
      coverKey = await uploadFile(cover, "cover", user.id);
    }
  } catch (error) {
    await cleanupUploads([audioKey, coverKey]);
    console.error("[submissions] 上传 OSS 失败", error);
    return jsonError("上传失败，请稍后重试", 500);
  }

  try {
    const [insertId] = await db("lab_music").insert({
      uid: user.id,
      music_category_id: parsed.data.categoryId,
      subject: parsed.data.subject,
      summary: parsed.data.summary,
      author: parsed.data.author,
      url: audioKey,
      photo: coverKey,
      status: 0,
    });

    const id = Number(insertId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("数据库未返回有效的投稿 id");
    }

    return NextResponse.json(
      { ok: true, id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    await cleanupUploads([audioKey, coverKey]);
    console.error("[submissions] 保存投稿失败", error);
    return jsonError("投稿保存失败，请稍后重试", 500);
  }
}
