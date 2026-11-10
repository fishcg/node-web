import { readFile } from "node:fs/promises";
import path from "node:path";
import knex from "knex";
import { loadLocalEnv } from "./env";
import { getDbConfig } from "../lib/db-config";

loadLocalEnv();

const CATEGORIES = [
  {
    id: 100,
    slug: "asmr",
    name: "ASMR / 中文音声",
    section: "asmr",
    description: "耳畔的雨声、轻声与白噪音",
    sort: 10,
  },
  {
    id: 101,
    slug: "vocaloid",
    name: "VOCALOID / UTAU",
    section: "music",
    description: "初音、洛天依与虚拟歌手的歌",
    sort: 20,
  },
  {
    id: 102,
    slug: "light-music",
    name: "轻音乐 / BGM",
    section: "music",
    description: "钢琴、器乐、Lofi 与循环背景音",
    sort: 30,
  },
  {
    id: 103,
    slug: "audiobook",
    name: "有声书",
    section: "audiobook",
    description: "故事、散文与睡前读物",
    sort: 40,
  },
  {
    id: 104,
    slug: "other-music",
    name: "音乐 / 其他",
    section: "music",
    description: "翻唱、原创与其他音乐",
    sort: 35,
  },
  {
    id: 105,
    slug: "talk",
    name: "杂谈 / 电台",
    section: "talk",
    description: "闲聊、播客与电台",
    sort: 50,
  },
];

async function main() {
  const db = knex(getDbConfig());
  try {
    const schema = await readFile(path.join(process.cwd(), "db", "schema.sql"), "utf8");
    const statements = schema
      .replace(/^\s*--.*$/gm, "")
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await db.raw(statement);
    }
    console.log(`Schema ready (${statements.length} statements)`);

    await db("lab_category").insert(CATEGORIES).onConflict("id").merge();
    const [{ total }] = await db("lab_category").count<{ total: number }[]>("* as total");
    console.log(`Categories ready (${total} rows)`);
  } finally {
    await db.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
