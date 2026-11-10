/**
 * 评论查询/写入/点赞聚焦测试。
 *
 * 运行：
 *   node --conditions=react-server --import tsx --test tests/backend/comments.test.ts
 *
 * 测试会创建 2 个临时用户、2 条临时音频（1 条发布、1 条待审）和评论，
 * 在 after 里按临时 id 清理，不会触碰真实声音的评论。
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { loadLocalEnv } from "../../scripts/env";

loadLocalEnv();

let db: (typeof import("@/lib/db"))["db"];
let comments: typeof import("@/lib/queries/comments");

const suffix = `${Date.now().toString(36)}_${process.pid}`;
let viewer = 0;
let author = 0;
let soundId = 0;
let pendingSoundId = 0;

async function insertUser(label: string): Promise<number> {
  const [id] = await db("lab_user").insert({
    username: `ct_${label}_${suffix}`.slice(0, 32),
    password_hash: "test-hash",
    status: 1,
    role: "user",
    created: "2026-01-01 00:00:00",
  });
  return Number(id);
}

async function insertSound(input: { uid: number; status: number; subject: string }): Promise<number> {
  const [id] = await db("lab_music").insert({
    uid: input.uid,
    music_category_id: 100,
    subject: input.subject,
    summary: "",
    author: "测试作者",
    url: "sound/test/comment.mp3",
    created: "2026-01-01 00:00:00",
    status: input.status,
    replies: 0,
  });
  return Number(id);
}

before(async () => {
  db = (await import("@/lib/db")).db;
  comments = await import("@/lib/queries/comments");

  viewer = await insertUser("viewer");
  author = await insertUser("author");
  soundId = await insertSound({ uid: author, status: 1, subject: "评论测试声音" });
  pendingSoundId = await insertSound({ uid: author, status: 0, subject: "待审核测试声音" });
});

after(async () => {
  if (!db) return;
  await db("lab_comment_like").whereIn("comment_id", db("lab_comment").select("id").where("music_id", soundId)).del();
  await db("lab_comment").whereIn("music_id", [soundId, pendingSoundId]).del();
  await db("lab_music").whereIn("id", [soundId, pendingSoundId]).del();
  await db("lab_user").whereIn("id", [viewer, author]).del();
});

test("发布评论会写入并递增 lab_music.replies", async () => {
  const created = await comments.createComment(soundId, author, "第一条评论，测试发布。");
  assert.ok(created);
  assert.equal(created?.body, "第一条评论，测试发布。");
  assert.equal(created?.likedByMe, false);

  const sound = await db("lab_music").where("id", soundId).first("replies");
  assert.equal(Number(sound?.replies), 1);
});

test("游标分页按最新在前返回，并带 nextCursor", async () => {
  for (let index = 2; index <= 4; index += 1) {
    await comments.createComment(soundId, author, `第${index}条评论`);
  }

  const first = await comments.getCommentPage(soundId, viewer, null, 2);
  assert.equal(first.items.length, 2);
  assert.equal(first.items[0]?.body, "第4条评论");
  assert.equal(first.items[1]?.body, "第3条评论");
  assert.ok(first.nextCursor);

  const second = await comments.getCommentPage(soundId, viewer, first.nextCursor, 2);
  assert.equal(second.items.length, 2);
  assert.equal(second.items[0]?.body, "第2条评论");
  assert.equal(second.nextCursor, null);
});

test("点赞是幂等切换，并批量返回 likedByMe", async () => {
  const page = await comments.getCommentPage(soundId, viewer, null, 20);
  const target = page.items[0];
  assert.ok(target);

  const liked = await comments.toggleCommentLike(target.id, viewer);
  assert.deepEqual(liked, { liked: true, likeCount: 1 });

  const likedPage = await comments.getCommentPage(soundId, viewer, null, 20);
  assert.equal(likedPage.items[0]?.likedByMe, true);
  assert.equal(likedPage.items[0]?.likeCount, 1);

  const unliked = await comments.toggleCommentLike(target.id, viewer);
  assert.deepEqual(unliked, { liked: false, likeCount: 0 });
});

test("待审核声音不能创建评论", async () => {
  const created = await comments.createComment(pendingSoundId, author, "不应出现");
  assert.equal(created, null);
  const page = await comments.getCommentPage(pendingSoundId, viewer);
  assert.equal(page.items.length, 0);
});
