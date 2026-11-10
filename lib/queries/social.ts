import "server-only";

import type { Knex } from "knex";

import { CATEGORY_LABELS, SECTION_BY_ID, SECTIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import type {
  ChatMessage,
  ConversationSummary,
  NotificationItem,
  PublicUser,
  SectionSlug,
  Sound,
  UnreadCounts,
  UserProfile,
  UserRole,
} from "@/lib/types";
import { assetUrl } from "@/lib/utils";

const SECTION_SLUG_SET = new Set<SectionSlug>(SECTIONS.map((section) => section.slug));

const PUBLIC_USER_COLUMNS = ["id", "username", "avatar", "role", "created"] as const;

const SOUND_COLUMNS = {
  id: "m.id",
  subject: "m.subject",
  summary: "m.summary",
  author: "m.author",
  url: "m.url",
  photo: "m.photo",
  created: "m.created",
  views: "m.views",
  replies: "m.replies",
  category_id: "m.music_category_id",
  category_slug: "c.slug",
  category_name: "c.name",
  section: "c.section",
  top: "m.top",
} as const;

interface UserRow {
  id: number | string;
  username: string;
  avatar: string | null;
  role: string | null;
  created: string | Date | null;
}

interface SoundRow {
  id: number | string;
  subject: string | null;
  summary: string | null;
  author: string | null;
  url: string | null;
  photo: string | null;
  created: string | Date | null;
  views: number | string | null;
  replies: number | string | null;
  category_id: number | string | null;
  category_slug: string | null;
  category_name: string | null;
  section: string | null;
  top: number | string | null;
}

interface MessageRow {
  id: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  body: string;
  read_at: string | Date | null;
  created: string | Date | null;
}

interface NotificationRow {
  id: number | string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | Date | null;
  created: string | Date | null;
}

interface LatestMessageRow {
  id: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  body: string;
  created: string | Date | null;
}

function isValidId(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function toCount(value: number | string | null | undefined): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toCreatedString(value: string | Date | null): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function toId(value: number | string | null | undefined): number {
  return toCount(value);
}

function normalizeRole(value: string | null | undefined): UserRole {
  return value === "admin" ? "admin" : "user";
}

function isSectionSlug(value: string | null | undefined): value is SectionSlug {
  return !!value && SECTION_SLUG_SET.has(value as SectionSlug);
}

/** lab_user 行 → 对外公开资料；头像为空时返回 null。 */
function mapPublicUser(row: UserRow): PublicUser {
  return {
    id: toId(row.id),
    username: row.username,
    avatar: assetUrl(row.avatar ?? "") || null,
    role: normalizeRole(row.role),
    created: toCreatedString(row.created),
  };
}

/** lab_music + lab_category 行 → Sound（仅公开字段，不含投稿审核信息）。 */
function mapSound(row: SoundRow): Sound {
  const categoryId = toCount(row.category_id);
  return {
    id: toCount(row.id),
    subject: row.subject ?? "",
    summary: row.summary ?? "",
    author: row.author ?? "",
    url: assetUrl(row.url ?? ""),
    photo: assetUrl(row.photo ?? ""),
    created: toCreatedString(row.created),
    views: toCount(row.views),
    replies: toCount(row.replies),
    categoryId,
    categorySlug: row.category_slug ?? "",
    categoryName: row.category_name?.trim() || CATEGORY_LABELS[categoryId] || "",
    section: isSectionSlug(row.section) ? row.section : (SECTION_BY_ID[categoryId] ?? "music"),
    top: toCount(row.top) === 1,
  };
}

function mapMessage(row: MessageRow, viewerId: number): ChatMessage {
  return {
    id: toCount(row.id),
    senderId: toCount(row.sender_id),
    receiverId: toCount(row.receiver_id),
    body: row.body,
    readAt: row.read_at ? toCreatedString(row.read_at) : null,
    created: toCreatedString(row.created),
    isMine: toCount(row.sender_id) === viewerId,
  };
}

function mapNotification(row: NotificationRow): NotificationItem {
  return {
    id: toCount(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link ?? "",
    readAt: row.read_at ? toCreatedString(row.read_at) : null,
    created: toCreatedString(row.created),
  };
}

async function countRows(query: Knex.QueryBuilder, column: string): Promise<number> {
  const rows = (await query.count({ total: column })) as Array<{
    total?: string | number | null;
  }>;
  return toCount(rows[0]?.total);
}

async function fetchPublicUsers(ids: number[]): Promise<Map<number, PublicUser>> {
  if (ids.length === 0) return new Map();
  const rows = (await db("lab_user")
    .select(...PUBLIC_USER_COLUMNS)
    .whereIn("id", ids)) as UserRow[];
  return new Map(rows.map((row) => [toId(row.id), mapPublicUser(row)]));
}

export async function getPublicUser(id: number): Promise<PublicUser | null> {
  if (!isValidId(id)) return null;
  const row = (await db("lab_user")
    .select(...PUBLIC_USER_COLUMNS)
    .where({ id })
    .where("status", 1)
    .first()) as UserRow | undefined;
  return row ? mapPublicUser(row) : null;
}

export async function getUserProfile(
  targetId: number,
  viewerId: number | null,
): Promise<UserProfile | null> {
  const user = await getPublicUser(targetId);
  if (!user) return null;

  const [followerCount, followingCount, soundCount, following] = await Promise.all([
    countRows(db("lab_follow").where("following_id", targetId), "id"),
    countRows(db("lab_follow").where("follower_id", targetId), "id"),
    countRows(
      db("lab_music").where("uid", targetId).where("status", 1),
      "id",
    ),
    viewerId && viewerId !== targetId ? isFollowing(viewerId, targetId) : Promise.resolve(false),
  ]);

  return {
    ...user,
    followerCount,
    followingCount,
    soundCount,
    isFollowing: following,
    isSelf: viewerId === targetId,
  };
}

export async function getApprovedSoundsByUser(uid: number, limit = 12): Promise<Sound[]> {
  if (!isValidId(uid)) return [];
  const size = Math.min(Math.max(Math.trunc(limit) || 12, 1), 48);

  const rows = (await db("lab_music as m")
    .leftJoin("lab_category as c", "c.id", "m.music_category_id")
    .select(SOUND_COLUMNS)
    .where("m.uid", uid)
    .where("m.status", 1)
    .orderBy("m.created", "desc")
    .orderBy("m.id", "desc")
    .limit(size)) as SoundRow[];

  return rows.map(mapSound);
}

export async function getConversations(userId: number): Promise<ConversationSummary[]> {
  if (!isValidId(userId)) return [];

  // 每个对话取 id 最大的一条（即最新消息），避免把全部私信读进内存。
  const latestRows = (await db("lab_message")
    .select(db.raw("MAX(id) AS latest_id"))
    .where(function () {
      this.where("sender_id", userId).orWhere("receiver_id", userId);
    })
    .groupByRaw("IF(sender_id = ?, receiver_id, sender_id)", [userId])) as Array<{
    latest_id: number | string | null;
  }>;

  const latestIds = latestRows.map((row) => toId(row.latest_id)).filter((id) => id > 0);
  if (latestIds.length === 0) return [];

  const rows = (await db("lab_message")
    .select("id", "sender_id", "receiver_id", "body", "created")
    .whereIn("id", latestIds)
    .orderBy("created", "desc")
    .orderBy("id", "desc")) as LatestMessageRow[];

  const unreadRows = (await db("lab_message")
    .select("sender_id")
    .count({ unread: "id" })
    .where("receiver_id", userId)
    .whereNull("read_at")
    .groupBy("sender_id")) as Array<{
    sender_id: number | string;
    unread: number | string | null;
  }>;
  const unreadBySender = new Map(
    unreadRows.map((row) => [toId(row.sender_id), toCount(row.unread)]),
  );

  const otherIds = rows.map((row) =>
    toId(row.sender_id) === userId ? toId(row.receiver_id) : toId(row.sender_id),
  );
  const users = await fetchPublicUsers([...new Set(otherIds)]);

  const conversations: ConversationSummary[] = [];
  for (const row of rows) {
    const otherId =
      toId(row.sender_id) === userId ? toId(row.receiver_id) : toId(row.sender_id);
    const user = users.get(otherId);
    // 对方账号已被彻底删除时跳过该会话；禁用账号仍保留历史记录。
    if (!user) continue;
    conversations.push({
      user,
      lastMessage: row.body,
      lastAt: toCreatedString(row.created),
      unread: unreadBySender.get(otherId) ?? 0,
    });
  }
  return conversations;
}

export async function getConversationMessages(
  viewerId: number,
  otherId: number,
): Promise<ChatMessage[]> {
  if (!isValidId(viewerId) || !isValidId(otherId) || viewerId === otherId) return [];

  const rows = (await db("lab_message")
    .select("id", "sender_id", "receiver_id", "body", "read_at", "created")
    .where(function () {
      this.where({ sender_id: viewerId, receiver_id: otherId }).orWhere({
        sender_id: otherId,
        receiver_id: viewerId,
      });
    })
    .orderBy("created", "asc")
    .orderBy("id", "asc")) as MessageRow[];

  return rows.map((row) => mapMessage(row, viewerId));
}

export async function getNotifications(userId: number, limit = 30): Promise<NotificationItem[]> {
  if (!isValidId(userId)) return [];
  const size = Math.min(Math.max(Math.trunc(limit) || 30, 1), 30);

  const rows = (await db("lab_notification")
    .select("id", "type", "title", "body", "link", "read_at", "created")
    .where("uid", userId)
    .orderBy("created", "desc")
    .orderBy("id", "desc")
    .limit(size)) as NotificationRow[];

  return rows.map(mapNotification);
}

export async function getUnreadCounts(userId: number): Promise<UnreadCounts> {
  if (!isValidId(userId)) return { notifications: 0, messages: 0 };

  const [notifications, messages] = await Promise.all([
    countRows(
      db("lab_notification").where("uid", userId).whereNull("read_at"),
      "id",
    ),
    countRows(
      db("lab_message").where("receiver_id", userId).whereNull("read_at"),
      "id",
    ),
  ]);

  return { notifications, messages };
}

export async function markConversationRead(viewerId: number, otherId: number): Promise<void> {
  if (!isValidId(viewerId) || !isValidId(otherId) || viewerId === otherId) return;

  await db("lab_message")
    .where({ receiver_id: viewerId, sender_id: otherId })
    .whereNull("read_at")
    .update({ read_at: db.fn.now() });
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  if (!isValidId(userId)) return;

  await db("lab_notification")
    .where("uid", userId)
    .whereNull("read_at")
    .update({ read_at: db.fn.now() });
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  if (!isValidId(followerId) || !isValidId(followingId) || followerId === followingId) {
    return false;
  }

  const row = (await db("lab_follow")
    .select("id")
    .where({ follower_id: followerId, following_id: followingId })
    .first()) as { id: number | string } | undefined;
  return !!row;
}
