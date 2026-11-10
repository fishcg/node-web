/**
 * task-6 submission-admin 端到端测试。
 *
 * 覆盖真实链路（需要本地 dev server + MySQL + OSS 凭据，均在 .env.local 中）：
 *   - 未登录 401、非法分类 400、真实音频 public/audio/jingyesi.m4a 上传 201
 *   - 上传后 lab_music 为 status=0（pending），OSS 公网可读
 *   - 普通用户访问 /admin 系列 404，匿名 307，管理员 200
 *   - 管理员“通过”：status=1、通知行、/sound/:id 匿名 200
 *   - 管理员“驳回”：status=2、原因落库、通知行、/sound/:id 404
 *
 * 运行（server-only 需要 react-server 条件）：
 *   node --conditions=react-server --import tsx --test tests/backend/submissions.test.ts
 *
 * 测试会创建 1 个临时用户、2 条投稿、2 条通知与对应 OSS 对象；
 * after 钩子按 uid 清理 DB 行，并用 deleteFile 删除本次上传的 OSS 对象。
 * 同一用户投稿限流为 5 次/小时，本文件共发送 4 次投稿请求（1 次非法 + 2 次成功 + 1 次成功）。
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";

import { loadLocalEnv } from "../../scripts/env";

loadLocalEnv();

const BASE_URL = (process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const COOKIE_NAME = "acgay_session";
const AUDIO_PATH = "public/audio/jingyesi.m4a";
// 1x1 透明 PNG，仅用于验证 cover 上传链路。
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

type MusicRow = {
  id: number;
  uid: number;
  status: number;
  subject: string;
  url: string;
  photo: string;
  review_reason: string;
  reviewed_by: number | null;
  reviewed_at: string | Date | null;
  music_category_id: number;
};

type NotificationRow = {
  uid: number;
  type: string;
  title: string;
  body: string;
  link: string;
};

type ApiResponse = { ok?: boolean; id?: number; error?: string };

let db: (typeof import("@/lib/db"))["db"];
let submissions: typeof import("@/lib/queries/submissions");
let oss: typeof import("@/lib/oss");
let assetUrl: (typeof import("@/lib/utils"))["assetUrl"];

let audioBytes: Buffer;
let adminId = 0;
let userId = 0;
let userCookie = "";
let adminCookie = "";

const suffix = `${Date.now().toString(36)}${process.pid.toString(36)}`.slice(-20);
const username = `subtest_${suffix}`.slice(0, 32);
const subjectApproved = `投稿链路测试·通过 ${suffix}`;
const subjectRejected = `投稿链路测试·驳回 ${suffix}`;
const rejectReason = "自动化测试：音频与简介不符，请补充简介后重新提交。";

function cookieHeader(cookie: string): Record<string, string> {
  return { Cookie: `${COOKIE_NAME}=${cookie}` };
}

function request(
  path: string,
  init: { method?: string; cookie?: string; body?: FormData } = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (init.cookie) Object.assign(headers, cookieHeader(init.cookie));
  return fetch(`${BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    redirect: "manual",
  });
}

function extractActionId(html: string, kind: "approve" | "reject"): string {
  const forms = [...html.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/g)].map((match) => match[1]);
  const form = forms.find((body) =>
    kind === "reject" ? body.includes('name="reason"') : !body.includes('name="reason"'),
  );
  if (!form) throw new Error(`审核详情页缺少 ${kind} 表单`);
  const actionId = form.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  if (!actionId) throw new Error(`审核详情页 ${kind} 表单缺少 server action 标识`);
  return actionId;
}

async function submitReviewAction(
  id: number,
  actionId: string,
  reason?: string,
): Promise<Response> {
  const form = new FormData();
  form.set(actionId, "");
  form.set("id", String(id));
  if (reason !== undefined) form.set("reason", reason);
  return request(`/admin/reviews/${id}`, {
    method: "POST",
    cookie: adminCookie,
    body: form,
  });
}

async function createSubmission(input: {
  subject: string;
  categoryId?: number;
  cover?: boolean;
}): Promise<{ response: Response; payload: ApiResponse; id: number }> {
  const form = new FormData();
  form.set("subject", input.subject);
  form.set("summary", "投稿/审核自动化测试数据，after 钩子会删除。");
  form.set("author", "submission-test");
  form.set("categoryId", String(input.categoryId ?? 103));
  form.set("audio", new File([new Uint8Array(audioBytes)], "jingyesi.m4a", { type: "audio/mp4" }));
  if (input.cover) {
    form.set("cover", new File([new Uint8Array(PNG_BYTES)], "cover.png", { type: "image/png" }));
  }
  const response = await request("/api/submissions", {
    method: "POST",
    cookie: userCookie,
    body: form,
  });
  const payload = (await response.json()) as ApiResponse;
  return { response, payload, id: Number(payload.id ?? 0) };
}

async function getMusicRow(id: number): Promise<MusicRow> {
  const row = await db("lab_music").where({ id }).first();
  assert.ok(row, `lab_music 中找不到 id=${id}`);
  return row as MusicRow;
}

async function getApprovalNotification(id: number): Promise<NotificationRow> {
  const row = await db("lab_notification")
    .where({ uid: userId, link: `/sound/${id}` })
    .orderBy("id", "desc")
    .first();
  assert.ok(row, `找不到 link=/sound/${id} 的通知`);
  return row as NotificationRow;
}

async function getRejectNotification(): Promise<NotificationRow> {
  const rows = (await db("lab_notification")
    .where({ uid: userId, link: "/me/submissions" })
    .orderBy("id", "desc")) as NotificationRow[];
  const row = rows.find((item) => item.body.includes(subjectRejected));
  assert.ok(row, "找不到驳回通知");
  return row;
}

before(async () => {
  db = (await import("@/lib/db")).db;
  submissions = await import("@/lib/queries/submissions");
  oss = await import("@/lib/oss");
  ({ assetUrl } = await import("@/lib/utils"));

  const health = await fetch(`${BASE_URL}/api/health`).catch((error: unknown) => {
    throw new Error(`无法连接 ${BASE_URL}，请先启动 pnpm dev：${String(error)}`);
  });
  assert.equal(health.status, 200, `${BASE_URL}/api/health 未返回 200`);

  audioBytes = await readFile(AUDIO_PATH);
  assert.ok(audioBytes.length > 0, `${AUDIO_PATH} 为空`);

  const admin = await db("lab_user").where({ role: "admin", status: 1 }).orderBy("id", "asc").first();
  assert.ok(admin, "数据库中缺少启用的 admin 用户");
  adminId = Number(admin.id);

  const [insertedId] = await db("lab_user").insert({
    username,
    password_hash: "test-hash",
    status: 1,
    role: "user",
    created: db.fn.now(),
  });
  userId = Number(insertedId);
  assert.ok(userId > 0, "创建测试用户失败");

  const secret = process.env.SESSION_SECRET;
  assert.ok(secret, "SESSION_SECRET 未配置");
  const { sealData } = await import("iron-session");
  userCookie = await sealData({ userId, username }, { password: secret, ttl: 3600 });
  adminCookie = await sealData(
    { userId: adminId, username: String(admin.username) },
    { password: secret, ttl: 3600 },
  );
  assert.ok(userCookie.length > 0 && adminCookie.length > 0, "会话 cookie 生成失败");
});

after(async () => {
  if (!db) return;
  try {
    const rows = userId
      ? ((await db("lab_music").select("url", "photo").where({ uid: userId })) as Array<{
          url: string | null;
          photo: string | null;
        }>)
      : [];
    const objectKeys = new Set<string>();
    for (const row of rows) {
      if (row.url) objectKeys.add(row.url);
      if (row.photo) objectKeys.add(row.photo);
    }

    if (userId) {
      await db("lab_notification").where({ uid: userId }).del();
      await db("lab_music").where({ uid: userId }).del();
      await db("lab_user").where({ id: userId }).del();
    }
    await db.destroy();

    if (oss) {
      for (const key of objectKeys) {
        try {
          await oss.deleteFile(key);
        } catch (error) {
          console.error(`[submissions.test] 删除 OSS 对象失败: ${key}`, error);
        }
      }
    }
  } catch (error) {
    console.error("[submissions.test] cleanup failed", error);
    throw error;
  }
});

test("权限：匿名跳登录、普通用户 404、管理员可访问审核后台", async () => {
  for (const path of ["/admin", "/admin/reviews"]) {
    const anonymous = await request(path);
    assert.equal(anonymous.status, 307, `匿名访问 ${path} 应跳转登录`);
    assert.match(anonymous.headers.get("location") ?? "", /^\/login\?next=/);

    const normalUser = await request(path, { cookie: userCookie });
    assert.equal(normalUser.status, 404, `普通用户访问 ${path} 应为 404`);

    const admin = await request(path, { cookie: adminCookie });
    assert.equal(admin.status, 200, `管理员访问 ${path} 应为 200`);
  }
});

test("投稿 API：未登录 401、非法分类 400、真实音频上传 201 且为 pending", async () => {
  const anonymousForm = new FormData();
  anonymousForm.set("subject", "匿名投稿");
  anonymousForm.set("author", "anonymous");
  anonymousForm.set("categoryId", "103");
  anonymousForm.set("audio", new File([new Uint8Array(audioBytes)], "jingyesi.m4a", { type: "audio/mp4" }));
  const anonymous = await request("/api/submissions", { method: "POST", body: anonymousForm });
  assert.equal(anonymous.status, 401);
  assert.equal(((await anonymous.json()) as ApiResponse).ok, false);

  const invalid = await createSubmission({ subject: "非法分类", categoryId: 999 });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.payload.ok, false);

  const { response, payload, id } = await createSubmission({
    subject: subjectApproved,
    cover: true,
  });
  assert.equal(response.status, 201, JSON.stringify(payload));
  assert.equal(payload.ok, true);
  assert.ok(id > 0);

  const row = await getMusicRow(id);
  assert.equal(Number(row.uid), userId);
  assert.equal(Number(row.status), 0);
  assert.equal(row.subject, subjectApproved);
  assert.equal(Number(row.music_category_id), 103);
  assert.match(row.url, /^sound\/uploads\/\d{4}\/\d{2}\/\d+-[0-9a-f]+\.m4a$/);
  assert.ok(row.url.includes(`/${userId}-`), "音频对象名应包含投稿人 uid");
  assert.match(row.photo, /^cover\/uploads\/\d{4}\/\d{2}\/\d+-[0-9a-f]+\.png$/);

  for (const [key, expectedType] of [
    [row.url, /^audio\//],
    [row.photo, /^image\//],
  ] as const) {
    const head = await fetch(assetUrl(key), { method: "HEAD" });
    assert.equal(head.status, 200, `OSS 公网不可读: ${key}`);
    assert.match(head.headers.get("content-type") ?? "", expectedType);
  }

  const submission = await submissions.getSubmissionById(id);
  assert.ok(submission);
  assert.equal(submission.status, "pending");
  assert.equal(submission.subject, subjectApproved);
  assert.deepEqual(
    await submissions.getMySubmissions(userId).then((list) => list.some((item) => item.id === id)),
    true,
  );

  const pending = await submissions.getPendingSubmissions();
  const pendingItem = pending.find((item) => item.id === id);
  assert.ok(pendingItem, "待审列表应包含新投稿");
  assert.equal(pendingItem.submitter.username, username);
  assert.ok((await submissions.countPendingSubmissions()) >= 1);
});

test("管理员通过：303、status=1、通知行、/sound/:id 匿名可见", async () => {
  const pending = await db("lab_music").where({ uid: userId, status: 0 }).orderBy("id", "asc").first();
  assert.ok(pending, "找不到待审投稿");
  const id = Number(pending.id);

  const anonymousDetail = await request(`/admin/reviews/${id}`);
  assert.equal(anonymousDetail.status, 307);

  const normalUserDetail = await request(`/admin/reviews/${id}`, { cookie: userCookie });
  assert.equal(normalUserDetail.status, 404);

  const adminDetail = await request(`/admin/reviews/${id}`, { cookie: adminCookie });
  assert.equal(adminDetail.status, 200);
  const html = await adminDetail.text();
  assert.ok(html.includes(subjectApproved), "审核详情应展示投稿标题");
  assert.ok(html.includes(`src="${assetUrl(String(pending.url))}"`), "审核详情应使用公网音频地址试听");
  assert.ok(html.includes("通过并发布"));
  assert.ok(html.includes("确认驳回"));

  const response = await submitReviewAction(id, extractActionId(html, "approve"));
  assert.equal(response.status, 303, `审核通过应 303，实际 ${response.status}`);
  assert.equal(response.headers.get("location"), "/admin/reviews?done=1");

  const row = await getMusicRow(id);
  assert.equal(Number(row.status), 1);
  assert.equal(row.review_reason, "");
  assert.equal(Number(row.reviewed_by), adminId);
  assert.ok(row.reviewed_at, "reviewed_at 应写入");

  const notification = await getApprovalNotification(id);
  assert.equal(notification.type, "submission");
  assert.equal(notification.title, "投稿已通过");
  assert.equal(notification.body, `《${subjectApproved}》已通过审核，现在可以播放了。`);
  assert.equal(notification.link, `/sound/${id}`);

  const sound = await request(`/sound/${id}`);
  assert.equal(sound.status, 200, "通过后的音频详情页应匿名可见");
  assert.ok((await sound.text()).includes(subjectApproved));

  const queue = await request("/admin/reviews", { cookie: adminCookie });
  assert.equal((await queue.text()).includes(`href="/admin/reviews/${id}"`), false);
});

test("管理员驳回：303、status=2、原因与通知、/sound/:id 404", async () => {
  const { response: createResponse, payload, id } = await createSubmission({
    subject: subjectRejected,
    categoryId: 104,
    cover: true,
  });
  assert.equal(createResponse.status, 201, JSON.stringify(payload));

  const pendingRow = await getMusicRow(id);
  assert.equal(Number(pendingRow.status), 0);

  const adminDetail = await request(`/admin/reviews/${id}`, { cookie: adminCookie });
  assert.equal(adminDetail.status, 200);
  const html = await adminDetail.text();

  const countNotifications = async (): Promise<number> => {
    const row = await db("lab_notification").where({ uid: userId }).count({ count: "*" }).first();
    return Number(row?.count ?? 0);
  };
  const notificationsBefore = await countNotifications();

  // 空原因不应改变状态，也不应写通知。
  const emptyReason = await submitReviewAction(id, extractActionId(html, "reject"), "");
  assert.equal(emptyReason.status, 303);
  assert.match(emptyReason.headers.get("location") ?? "", /\?error=reason$/);
  assert.equal(Number((await getMusicRow(id)).status), 0, "空原因不应改变投稿状态");
  assert.equal(await countNotifications(), notificationsBefore, "空原因不应写通知");

  const response = await submitReviewAction(id, extractActionId(html, "reject"), rejectReason);
  assert.equal(response.status, 303, `驳回应 303，实际 ${response.status}`);
  assert.equal(response.headers.get("location"), "/admin/reviews?done=1");

  const row = await getMusicRow(id);
  assert.equal(Number(row.status), 2);
  assert.equal(row.review_reason, rejectReason);
  assert.equal(Number(row.reviewed_by), adminId);
  assert.ok(row.reviewed_at, "reviewed_at 应写入");

  const notification = await getRejectNotification();
  assert.equal(notification.type, "submission");
  assert.equal(notification.title, "投稿未通过");
  assert.equal(notification.body, `《${subjectRejected}》未通过审核：${rejectReason}`);
  assert.equal(notification.link, "/me/submissions");

  const sound = await request(`/sound/${id}`);
  assert.equal(sound.status, 404, "驳回后的音频不应公开展示");

  const detail = await request(`/admin/reviews/${id}`, { cookie: adminCookie });
  const detailHtml = await detail.text();
  assert.ok(detailHtml.includes("该投稿已驳回"));
  assert.ok(detailHtml.includes(rejectReason));
});
