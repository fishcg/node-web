import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import knex from "knex";
import { loadLocalEnv } from "./env";
import { getDbConfig } from "../lib/db-config";

loadLocalEnv();

interface SeedSound {
  id: number;
  subject: string;
  summary: string;
  author: string;
  url: string;
  photo: string;
  created: string;
  views: number;
  replies: number;
  categoryId: number;
  top: number;
}

interface SeedFile {
  scrapedAt: string;
  sounds: SeedSound[];
}

const OSS_BASE = (process.env.OSS_BASE_URL ?? "https://acgay.oss-cn-hangzhou.aliyuncs.com").replace(/\/+$/, "");

/** Keep MySQL canonical: OSS paths are relative, external URLs stay absolute. */
function canonicalAsset(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(`${OSS_BASE}/`)) return trimmed.slice(OSS_BASE.length + 1);
  return trimmed;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "1") {
    throw new Error("Refusing to seed a production database. Set ALLOW_PROD_SEED=1 to override.");
  }

  const raw = JSON.parse(
    await readFile(path.join(process.cwd(), "data", "live-sounds.json"), "utf8"),
  ) as SeedFile;

  // Short public-domain poetry readings generated with macOS `say`, shipped in
  // public/audio. They give the audiobook section real, playable content until
  // the owner uploads their own recordings.
  raw.sounds.push(
    {
      id: 9001,
      subject: "夜读 · 静夜思（公版诗歌朗读）",
      summary: "李白的二十个字，写尽深夜里每一次抬头看月亮。示例音频，公版诗歌。",
      author: "李白 / 示例朗读",
      url: "/audio/jingyesi.m4a",
      photo: "",
      created: "2025-03-01 22:00:00",
      views: 128,
      replies: 0,
      categoryId: 103,
      top: 0,
    },
    {
      id: 9002,
      subject: "晨读 · 春晓（公版诗歌朗读）",
      summary: "孟浩然笔下的春天，从一声鸟叫和一场夜雨开始。示例音频，公版诗歌。",
      author: "孟浩然 / 示例朗读",
      url: "/audio/chunxiao.m4a",
      photo: "",
      created: "2025-03-01 21:30:00",
      views: 96,
      replies: 0,
      categoryId: 103,
      top: 0,
    },
    {
      id: 9003,
      subject: "夜读 · 登鹳雀楼（公版诗歌朗读）",
      summary: "再往前走一步，就能看见更远的地方。示例音频，公版诗歌。",
      author: "王之涣 / 示例朗读",
      url: "/audio/denggueque.m4a",
      photo: "",
      created: "2025-03-01 21:00:00",
      views: 84,
      replies: 0,
      categoryId: 103,
      top: 0,
    },
  );

  const db = knex(getDbConfig());
  try {
    const rows = raw.sounds.map((sound) => ({
      id: sound.id,
      uid: 0,
      music_id: 0,
      music_category_id: sound.categoryId,
      subject: sound.subject,
      summary: sound.summary || null,
      author: sound.author || "",
      url: canonicalAsset(sound.url),
      created: sound.created,
      status: 1,
      top: sound.top ? 1 : 0,
      hot: 0,
      photo: canonicalAsset(sound.photo),
      views: sound.views || 0,
      replies: sound.replies || 0,
    }));

    // Local/demo seed is a full rebuild so stale scraper runs cannot leave
    // rows with old URL shapes behind. Production is guarded above.
    await db("lab_music").del();
    await db("lab_favorite").del();

    for (let index = 0; index < rows.length; index += 50) {
      await db("lab_music").insert(rows.slice(index, index + 50)).onConflict("id").merge();
    }
    console.log(`Sounds seeded (${rows.length} rows from ${raw.scrapedAt})`);

    const passwordHash = await bcrypt.hash("demo1234", 10);
    await db("lab_user")
      .insert({
        username: "demo",
        password_hash: passwordHash,
        email: null,
        avatar: null,
        status: 1,
      })
      .onConflict("username")
      .merge(["password_hash", "status"]);
    const demo = await db("lab_user").where({ username: "demo" }).first();
    console.log(`Demo user ready: demo / demo1234 (uid ${demo.id})`);

    const favoriteIds = raw.sounds
      .filter((sound) => sound.categoryId === 100 || sound.categoryId === 102)
      .slice(0, 4)
      .map((sound) => sound.id);

    if (favoriteIds.length && demo) {
      await db("lab_favorite")
        .insert(favoriteIds.map((musicId) => ({ uid: demo.id, music_id: musicId })))
        .onConflict(["uid", "music_id"])
        .ignore();
      console.log(`Demo favorites ready (${favoriteIds.length} sounds)`);
    }

    const counts = await db("lab_music")
      .join("lab_category", "lab_category.id", "lab_music.music_category_id")
      .select("lab_category.name")
      .count<{ name: string; total: number }[]>("lab_music.id as total")
      .groupBy("lab_category.name");
    console.table(counts);
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
