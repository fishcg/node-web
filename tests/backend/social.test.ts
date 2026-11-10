/**
 * task-5 social 查询层聚焦测试。
 *
 * 运行（server-only 需要 react-server 条件，否则 tsx 下会抛错）：
 *   node --conditions=react-server --import tsx --test tests/backend/social.test.ts
 *
 * 测试会创建 3 个临时用户、2 条已发布 + 1 条待审核音频、关注/私信/通知数据，
 * 并在 after 钩子里按 uid 全部清理；不会触碰 demo/admin 的真实数据。
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { loadLocalEnv } from "../../scripts/env";

loadLocalEnv();

// 测试文件按 CJS 转译，不能使用 top-level await；db 在 before 里动态加载，
// 确保 loadLocalEnv() 先于 lib/db 读取 env。
let db: (typeof import("@/lib/db"))["db"];
let social: typeof import("@/lib/queries/social");

const suffix = `${Date.now().toString(36)}_${process.pid}`;
let userA = 0;
let userB = 0;
let userC = 0;

async function insertUser(label: string, created: string): Promise<number> {
  const [id] = await db("lab_user").insert({
    username: `st_${label}_${suffix}`.slice(0, 32),
    password_hash: "test-hash",
    status: 1,
    role: "user",
    created,
  });
  return Number(id);
}

async function insertMessage(input: {
  senderId: number;
  receiverId: number;
  body: string;
  created: string;
  readAt?: string | null;
}): Promise<number> {
  const [id] = await db("lab_message").insert({
    sender_id: input.senderId,
    receiver_id: input.receiverId,
    body: input.body,
    created: input.created,
    read_at: input.readAt ?? null,
  });
  return Number(id);
}

async function insertNotification(input: {
  uid: number;
  title: string;
  created: string;
  readAt?: string | null;
  type?: string;
}): Promise<number> {
  const [id] = await db("lab_notification").insert({
    uid: input.uid,
    type: input.type ?? "system",
    title: input.title,
    body: `${input.title} 的正文`,
    link: "/me/notifications",
    created: input.created,
    read_at: input.readAt ?? null,
  });
  return Number(id);
}

before(async () => {
  db = (await import("@/lib/db")).db;
  social = await import("@/lib/queries/social");

  userA = await insertUser("a", "2026-01-01 00:00:00");
  userB = await insertUser("b", "2026-01-01 00:00:00");
  userC = await insertUser("c", "2026-01-01 00:00:00");

  await db("lab_music").insert([
    {
      uid: userA,
      music_category_id: 100,
      subject: "测试音频 旧",
      url: "sound/test/social-old.mp3",
      photo: "cover/test/social-old.jpg",
      status: 1,
      created: "2026-01-01 10:00:00",
    },
    {
      uid: userA,
      music_category_id: 101,
      subject: "测试音频 新",
      url: "sound/test/social-new.mp3",
      photo: "cover/test/social-new.jpg",
      status: 1,
      created: "2026-01-02 10:00:00",
    },
    {
      uid: userA,
      music_category_id: 100,
      subject: "测试音频 待审核",
      url: "sound/test/social-pending.mp3",
      photo: "",
      status: 0,
      created: "2026-01-03 10:00:00",
    },
  ]);

  await db("lab_follow").insert({ follower_id: userB, following_id: userA });

  await insertMessage({
    senderId: userC,
    receiverId: userA,
    body: "from C",
    created: "2026-01-01 09:00:00",
  });
  await insertMessage({
    senderId: userA,
    receiverId: userB,
    body: "hello B",
    created: "2026-01-02 10:01:00",
  });
  await insertMessage({
    senderId: userB,
    receiverId: userA,
    body: "hi A",
    created: "2026-01-02 10:02:00",
  });
  await insertMessage({
    senderId: userB,
    receiverId: userA,
    body: "second",
    created: "2026-01-02 10:03:00",
  });
  await insertMessage({
    senderId: userA,
    receiverId: userB,
    body: "reply",
    created: "2026-01-02 10:04:00",
  });

  await insertNotification({
    uid: userA,
    title: "旧通知",
    created: "2026-01-01 09:00:00",
    readAt: "2026-01-01 10:00:00",
  });
  await insertNotification({
    uid: userA,
    title: "新通知",
    created: "2026-01-02 09:00:00",
  });
  await insertNotification({
    uid: userB,
    title: "B 的通知",
    created: "2026-01-02 09:00:00",
  });
});

after(async () => {
  const ids = [userA, userB, userC].filter((id) => id > 0);
  if (ids.length === 0) return;
  try {
    await db("lab_follow")
      .where(function () {
        this.whereIn("follower_id", ids).orWhereIn("following_id", ids);
      })
      .del();
    await db("lab_message")
      .where(function () {
        this.whereIn("sender_id", ids).orWhereIn("receiver_id", ids);
      })
      .del();
    await db("lab_notification").whereIn("uid", ids).del();
    await db("lab_music").whereIn("uid", ids).del();
    await db("lab_user").whereIn("id", ids).del();
    await db.destroy();
  } catch (error) {
    console.error("[social.test] cleanup failed", error);
    throw error;
  }
});

test("getPublicUser 返回公开字段，隐藏状态与密码", async () => {
  const user = await social.getPublicUser(userA);
  assert.ok(user);
  assert.equal(user.id, userA);
  assert.equal(user.username, `st_a_${suffix}`.slice(0, 32));
  assert.equal(user.avatar, null);
  assert.equal(user.role, "user");
  assert.equal(user.created, "2026-01-01 00:00:00");
  assert.deepEqual(Object.keys(user).sort(), ["avatar", "created", "id", "role", "username"]);

  assert.equal(await social.getPublicUser(0), null);
  assert.equal(await social.getPublicUser(999_999_999), null);
});

test("getUserProfile 统计关注/粉丝/已发布音频与 isSelf", async () => {
  const profile = await social.getUserProfile(userA, userB);
  assert.ok(profile);
  assert.equal(profile.followerCount, 1);
  assert.equal(profile.followingCount, 0);
  assert.equal(profile.soundCount, 2); // 待审核的 1 条不计入
  assert.equal(profile.isFollowing, true); // B 关注了 A
  assert.equal(profile.isSelf, false);

  const self = await social.getUserProfile(userA, userA);
  assert.ok(self);
  assert.equal(self.isSelf, true);
  assert.equal(self.isFollowing, false);

  assert.equal(await social.getUserProfile(999_999_999, userA), null);
});

test("isFollowing 读写一致，重复关注不抛错", async () => {
  assert.equal(await social.isFollowing(userB, userA), true);
  assert.equal(await social.isFollowing(userA, userB), false);
  assert.equal(await social.isFollowing(userA, userA), false);

  // 唯一键 + onConflict ignore：重复关注静默成功
  await db("lab_follow")
    .insert({ follower_id: userB, following_id: userA })
    .onConflict(["follower_id", "following_id"])
    .ignore();
  const rows = (await db("lab_follow")
    .where({ follower_id: userB, following_id: userA })
    .count({ total: "id" })) as Array<{ total: string | number }>;
  assert.equal(Number(rows[0]?.total), 1);

  const profileB = await social.getUserProfile(userB, userA);
  assert.ok(profileB);
  assert.equal(profileB.followingCount, 1);
  assert.equal(profileB.isFollowing, false); // A 还没有关注 B
});

test("getApprovedSoundsByUser 只返回已发布音频且按时间倒序", async () => {
  const sounds = await social.getApprovedSoundsByUser(userA);
  assert.equal(sounds.length, 2);
  assert.equal(sounds[0]?.subject, "测试音频 新");
  assert.equal(sounds[1]?.subject, "测试音频 旧");
  assert.ok(sounds.every((sound) => sound.section === "asmr" || sound.section === "music"));
  assert.ok(sounds[0]?.url.startsWith("https://"));
  assert.ok(sounds[0]?.photo.startsWith("https://"));
  assert.ok(sounds[0] && !sounds[0].url.includes("http://"));

  const limited = await social.getApprovedSoundsByUser(userA, 1);
  assert.equal(limited.length, 1);
  assert.equal(limited[0]?.subject, "测试音频 新");

  assert.deepEqual(await social.getApprovedSoundsByUser(0), []);
  assert.deepEqual(await social.getApprovedSoundsByUser(userB), []);
});

test("getConversations 返回每个对话的最新消息与未读数", async () => {
  const conversations = await social.getConversations(userA);
  assert.equal(conversations.length, 2);
  assert.equal(conversations[0]?.user.id, userB);
  assert.equal(conversations[0]?.lastMessage, "reply");
  assert.equal(conversations[0]?.lastAt, "2026-01-02 10:04:00");
  assert.equal(conversations[0]?.unread, 2);
  assert.equal(conversations[1]?.user.id, userC);
  assert.equal(conversations[1]?.lastMessage, "from C");
  assert.equal(conversations[1]?.unread, 1);

  assert.deepEqual(await social.getConversations(0), []);
  const forC = await social.getConversations(userC);
  assert.equal(forC.length, 1);
  assert.equal(forC[0]?.user.id, userA);
  assert.equal(forC[0]?.lastMessage, "from C");
  assert.equal(forC[0]?.lastAt, "2026-01-01 09:00:00");
  assert.equal(forC[0]?.unread, 0);
});

test("getConversationMessages 双向升序且 isMine 正确", async () => {
  const messages = await social.getConversationMessages(userA, userB);
  assert.equal(messages.length, 4);
  assert.deepEqual(
    messages.map((message) => message.body),
    ["hello B", "hi A", "second", "reply"],
  );
  assert.deepEqual(
    messages.map((message) => message.isMine),
    [true, false, false, true],
  );
  assert.equal(messages[0]?.readAt, null);
  assert.equal(messages[1]?.readAt, null);
  assert.deepEqual(await social.getConversationMessages(userA, userA), []);
  assert.deepEqual(await social.getConversationMessages(0, userB), []);
});

test("getUnreadCounts 与 markConversationRead 正确更新未读", async () => {
  const beforeCounts = await social.getUnreadCounts(userA);
  assert.deepEqual(beforeCounts, { notifications: 1, messages: 3 });
  assert.deepEqual(await social.getUnreadCounts(userB), { notifications: 1, messages: 2 });
  assert.deepEqual(await social.getUnreadCounts(0), { notifications: 0, messages: 0 });

  await social.markConversationRead(userA, userB);
  const afterCounts = await social.getUnreadCounts(userA);
  assert.deepEqual(afterCounts, { notifications: 1, messages: 1 });

  const messages = await social.getConversationMessages(userA, userB);
  const fromB = messages.filter((message) => !message.isMine);
  assert.ok(fromB.length === 2 && fromB.every((message) => message.readAt !== null));

  // 只标记 A 收到的 B 私信，不影响 B 的未读
  assert.deepEqual(await social.getUnreadCounts(userB), { notifications: 1, messages: 2 });
});

test("getNotifications 倒序且 markAllNotificationsRead 只影响本人", async () => {
  const notifications = await social.getNotifications(userA);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0]?.title, "新通知");
  assert.equal(notifications[0]?.readAt, null);
  assert.equal(notifications[1]?.title, "旧通知");
  assert.equal(notifications[1]?.readAt, "2026-01-01 10:00:00");
  assert.equal((await social.getNotifications(userA, 1)).length, 1);
  assert.equal((await social.getNotifications(userA, 999)).length, 2); // 上限 30
  assert.deepEqual(await social.getNotifications(0), []);

  await social.markAllNotificationsRead(userA);
  assert.deepEqual(await social.getUnreadCounts(userA), { notifications: 0, messages: 1 });
  assert.deepEqual(await social.getUnreadCounts(userB), { notifications: 1, messages: 2 });
  const after = await social.getNotifications(userA);
  assert.ok(after.every((notification) => notification.readAt !== null));
});

test("标记已读对无效/自身 id 安静返回", async () => {
  await social.markConversationRead(userA, userA);
  await social.markConversationRead(0, userB);
  await social.markAllNotificationsRead(0);
  assert.equal(await social.isFollowing(0, userB), false);
});
