import "server-only";

import { randomBytes } from "node:crypto";

import OSS from "ali-oss";

export type UploadKind = "sound" | "cover";

const DEFAULT_BUCKET = "acgay";
const DEFAULT_REGION = "oss-cn-hangzhou";

const UPLOAD_PREFIX: Record<UploadKind, string> = {
  sound: "sound/uploads",
  cover: "cover/uploads",
};

const FALLBACK_EXTENSION: Record<UploadKind, string> = {
  sound: "mp3",
  cover: "jpg",
};

/** Extensions we are willing to keep from the original filename. */
const ALLOWED_EXTENSIONS: Record<UploadKind, ReadonlySet<string>> = {
  sound: new Set(["mp3", "m4a", "aac", "wav", "ogg", "oga", "flac", "webm", "opus", "mp4"]),
  cover: new Set(["jpg", "jpeg", "png", "webp"]),
};

/** Fallback extension when the filename has none (or something unexpected). */
const MIME_EXTENSION: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/webm": "webm",
  "audio/opus": "opus",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let client: OSS | null = null;

function getClient(): OSS {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET?.trim();

  if (!accessKeyId || !accessKeySecret) {
    throw new Error(
      "OSS 未配置：缺少 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET 环境变量",
    );
  }

  // 懒初始化：构建/类型检查阶段不读取凭据，首次上传时才创建客户端。
  client ??= new OSS({
    region: process.env.OSS_REGION?.trim() || DEFAULT_REGION,
    bucket: process.env.OSS_BUCKET?.trim() || DEFAULT_BUCKET,
    accessKeyId,
    accessKeySecret,
    secure: true,
  });

  return client;
}

function extensionFor(file: File, kind: UploadKind): string {
  const name = typeof file.name === "string" ? file.name : "";
  const dot = name.lastIndexOf(".");
  const fromName = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";

  if (fromName && ALLOWED_EXTENSIONS[kind].has(fromName)) return fromName;

  const fromMime = MIME_EXTENSION[file.type?.toLowerCase() ?? ""];
  if (fromMime && ALLOWED_EXTENSIONS[kind].has(fromMime)) return fromMime;

  return FALLBACK_EXTENSION[kind];
}

function randomSuffix(): string {
  return randomBytes(8).toString("hex");
}

/**
 * 上传投稿音频/封面到 OSS。
 *
 * 存储路径：`sound/uploads/YYYY/MM/<uid>-<random>.<ext>`，
 * 封面为 `cover/uploads/YYYY/MM/<uid>-<random>.<ext>`。
 * 返回不带前导斜杠的相对路径，展示时交给 `assetUrl()` 拼接。
 */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  uid: number,
): Promise<string> {
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new Error("uploadFile 需要合法的用户 id");
  }
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    throw new Error("uploadFile 需要非空文件");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const key = `${UPLOAD_PREFIX[kind]}/${year}/${month}/${uid}-${randomSuffix()}.${extensionFor(file, kind)}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await getClient().put(key, buffer, {
    mime: file.type || undefined,
  });

  return key;
}

/**
 * 删除一个由 `uploadFile` 创建的对象（失败回滚 / 测试清理用）。
 * 只允许删除投稿上传目录下的 key，避免误删站内其它资源。
 */
export async function deleteFile(key: string): Promise<void> {
  if (!key.startsWith("sound/uploads/") && !key.startsWith("cover/uploads/")) {
    throw new Error("deleteFile 只能删除投稿上传目录下的对象");
  }
  await getClient().delete(key);
}
