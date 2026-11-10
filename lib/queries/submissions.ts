import "server-only";

import { db } from "@/lib/db";
import type {
  PublicUser,
  SectionSlug,
  Submission,
  SubmissionStatus,
  SubmissionWithUser,
  UserRole,
} from "@/lib/types";
import { assetUrl } from "@/lib/utils";

interface SubmissionRow {
  id: number | string;
  subject: string | null;
  summary: string | null;
  author: string | null;
  url: string | null;
  photo: string | null;
  created: string | Date | null;
  status: number | string | null;
  review_reason: string | null;
  category_id: number | string | null;
  category_name: string | null;
  section: string | null;
}

interface PendingSubmissionRow extends SubmissionRow {
  user_id: number | string | null;
  username: string | null;
  avatar: string | null;
  role: string | null;
  user_created: string | Date | null;
}

const SUBMISSION_COLUMNS = {
  id: "m.id",
  subject: "m.subject",
  summary: "m.summary",
  author: "m.author",
  url: "m.url",
  photo: "m.photo",
  created: "m.created",
  status: "m.status",
  review_reason: "m.review_reason",
  category_id: "m.music_category_id",
  category_name: "c.name",
  section: "c.section",
} as const;

const PENDING_COLUMNS = {
  ...SUBMISSION_COLUMNS,
  user_id: "u.id",
  username: "u.username",
  avatar: "u.avatar",
  role: "u.role",
  user_created: "u.created",
} as const;

const SECTION_SLUGS = new Set<SectionSlug>(["asmr", "music", "audiobook", "talk"]);

function toInt(value: number | string | null | undefined): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toCreatedString(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function toSection(value: string | null | undefined): SectionSlug {
  return value && SECTION_SLUGS.has(value as SectionSlug) ? (value as SectionSlug) : "asmr";
}

function toStatus(value: number | string | null | undefined): SubmissionStatus {
  const status = toInt(value);
  if (status === 1) return "approved";
  if (status === 2) return "rejected";
  return "pending";
}

function toRole(value: string | null | undefined): UserRole {
  return value === "admin" ? "admin" : "user";
}

function mapSubmission(row: SubmissionRow): Submission {
  return {
    id: toInt(row.id),
    subject: row.subject ?? "",
    summary: row.summary ?? "",
    author: row.author ?? "",
    url: assetUrl(row.url ?? ""),
    photo: assetUrl(row.photo ?? ""),
    created: toCreatedString(row.created),
    status: toStatus(row.status),
    reviewReason: row.review_reason ?? "",
    categoryId: toInt(row.category_id),
    categoryName: row.category_name ?? "未分类",
    section: toSection(row.section),
  };
}

function mapSubmitter(row: PendingSubmissionRow): PublicUser {
  return {
    id: toInt(row.user_id),
    username: row.username?.trim() || "匿名用户",
    avatar: row.avatar ? assetUrl(row.avatar) || null : null,
    role: toRole(row.role),
    created: toCreatedString(row.user_created),
  };
}

function submissionsBase() {
  return db("lab_music as m").leftJoin("lab_category as c", "c.id", "m.music_category_id");
}

export async function getMySubmissions(uid: number): Promise<Submission[]> {
  if (!Number.isInteger(uid) || uid <= 0) return [];

  const rows = (await submissionsBase()
    .select(SUBMISSION_COLUMNS)
    .where("m.uid", uid)
    .orderBy("m.created", "desc")
    .orderBy("m.id", "desc")) as SubmissionRow[];

  return rows.map(mapSubmission);
}

export async function getSubmissionById(id: number): Promise<Submission | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const row = (await submissionsBase()
    .select(SUBMISSION_COLUMNS)
    .where("m.id", id)
    .first()) as SubmissionRow | undefined;

  return row ? mapSubmission(row) : null;
}

export async function getSubmissionWithUserById(
  id: number,
): Promise<SubmissionWithUser | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const row = (await submissionsBase()
    .leftJoin("lab_user as u", "u.id", "m.uid")
    .select(PENDING_COLUMNS)
    .where("m.id", id)
    .first()) as PendingSubmissionRow | undefined;

  return row ? { ...mapSubmission(row), submitter: mapSubmitter(row) } : null;
}

export async function getPendingSubmissions(): Promise<SubmissionWithUser[]> {
  const rows = (await submissionsBase()
    .leftJoin("lab_user as u", "u.id", "m.uid")
    .select(PENDING_COLUMNS)
    .where("m.status", 0)
    .orderBy("m.created", "desc")
    .orderBy("m.id", "desc")) as PendingSubmissionRow[];

  return rows.map((row) => ({
    ...mapSubmission(row),
    submitter: mapSubmitter(row),
  }));
}

export async function countPendingSubmissions(): Promise<number> {
  const row = (await db("lab_music")
    .where("status", 0)
    .count<{ count: number | string }[]>({ count: "*" })
    .first()) as { count: number | string } | undefined;

  return toInt(row?.count);
}
