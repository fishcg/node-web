import "server-only";

import type { Knex } from "knex";

import {
  CATEGORY_LABELS,
  HOME_RAIL_SIZE,
  PAGE_SIZE,
  SECTIONS,
  SECTION_BY_ID,
} from "@/lib/constants";
import { db } from "@/lib/db";
import type { Category, PagedResult, SectionSlug, Sound } from "@/lib/types";
import { assetUrl } from "@/lib/utils";

const SECTION_SLUG_SET = new Set<SectionSlug>(SECTIONS.map((section) => section.slug));

const FEATURED_SIZE = 5;
const NEWEST_SIZE = 8;

const CATEGORY_COLUMNS = ["c.id", "c.slug", "c.name", "c.section", "c.description", "c.sort"] as const;

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

interface CategoryRow {
  id: number | string;
  slug: string;
  name: string;
  section: string | null;
  description: string | null;
  sort: number | string | null;
}

function isSectionSlug(value: string | null | undefined): value is SectionSlug {
  return !!value && SECTION_SLUG_SET.has(value as SectionSlug);
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

/**
 * 历史数据里部分 url/photo 是“OSS 前缀 + 完整绝对地址”的双重拼接，
 * 外层地址 404、内层才可访问。读取时剥掉重复前缀后再交给 assetUrl。
 */
function toAssetUrl(value: string | null | undefined): string {
  let path = (value ?? "").trim();
  if (/aliyuncs\.com/i.test(path)) {
    for (let depth = 0; depth < 4; depth += 1) {
      const match = /^https?:\/\/[^/\s]+\/(https?:\/\/.+)$/i.exec(path);
      if (!match) break;
      path = match[1];
    }
  }
  return assetUrl(path);
}

function resolveSection(value: string | null, categoryId: number): SectionSlug {
  if (isSectionSlug(value)) return value;
  return SECTION_BY_ID[categoryId] ?? "music";
}

function mapSound(row: SoundRow): Sound {
  const categoryId = toCount(row.category_id);
  return {
    id: toCount(row.id),
    subject: row.subject ?? "",
    summary: row.summary ?? "",
    author: row.author ?? "",
    url: toAssetUrl(row.url),
    photo: toAssetUrl(row.photo),
    created: toCreatedString(row.created),
    views: toCount(row.views),
    replies: toCount(row.replies),
    categoryId,
    categorySlug: row.category_slug ?? "",
    categoryName: row.category_name?.trim() || CATEGORY_LABELS[categoryId] || "",
    section: resolveSection(row.section, categoryId),
    top: toCount(row.top) === 1,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: toCount(row.id),
    slug: row.slug,
    name: row.name,
    section: isSectionSlug(row.section) ? row.section : "music",
    description: row.description ?? "",
    sort: toCount(row.sort),
  };
}

/** 已发布音频 + 分类联表（lab_music 没有外键，必须 left join）。 */
function soundsBase(): Knex.QueryBuilder {
  return db("lab_music as m")
    .leftJoin("lab_category as c", "c.id", "m.music_category_id")
    .where("m.status", 1);
}

function selectSounds(base: Knex.QueryBuilder): Knex.QueryBuilder {
  return base.select(SOUND_COLUMNS);
}

function newestFirst(query: Knex.QueryBuilder): Knex.QueryBuilder {
  return query.orderBy("m.created", "desc").orderBy("m.id", "desc");
}

async function countRows(query: Knex.QueryBuilder, column: string): Promise<number> {
  const rows = (await query.count({ total: column })) as Array<{ total?: string | number | null }>;
  return toCount(rows[0]?.total);
}

async function fetchSounds(query: Knex.QueryBuilder): Promise<Sound[]> {
  const rows = (await query) as SoundRow[];
  return rows.map(mapSound);
}

function emptyPage(): PagedResult<Sound> {
  return { items: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
}

async function paginate(
  totalQuery: Knex.QueryBuilder,
  rowsQuery: Knex.QueryBuilder,
  requestedPage: number,
): Promise<PagedResult<Sound>> {
  const total = await countRows(totalQuery, "m.id");
  const totalPages = Math.ceil(total / PAGE_SIZE);
  // 越界页码收敛到有效区间，空结果固定返回第 1 页
  const page =
    totalPages === 0
      ? 1
      : Math.min(Math.max(1, Math.trunc(requestedPage) || 1), totalPages);

  const rows =
    totalPages === 0
      ? []
      : ((await rowsQuery.limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE)) as SoundRow[]);

  return { items: rows.map(mapSound), total, page, pageSize: PAGE_SIZE, totalPages };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export interface HomeData {
  featured: Sound[];
  newest: Sound[];
  sections: Record<SectionSlug, Sound[]>;
  totalSounds: number;
  totalCategories: number;
}

export async function getHomeData(): Promise<HomeData> {
  const railQuery = (slug: SectionSlug) =>
    newestFirst(selectSounds(soundsBase().where("c.section", slug))).limit(HOME_RAIL_SIZE);

  const [featured, newest, asmr, music, audiobook, talk] = await Promise.all([
    fetchSounds(
      selectSounds(soundsBase())
        .orderByRaw("CASE WHEN m.top = 1 THEN 0 ELSE 1 END")
        .orderBy("m.created", "desc")
        .orderBy("m.id", "desc")
        .limit(FEATURED_SIZE),
    ),
    fetchSounds(newestFirst(selectSounds(soundsBase())).limit(NEWEST_SIZE)),
    fetchSounds(railQuery("asmr")),
    fetchSounds(railQuery("music")),
    fetchSounds(railQuery("audiobook")),
    fetchSounds(railQuery("talk")),
  ]);

  const [totalSounds, totalCategories] = await Promise.all([
    countRows(soundsBase(), "m.id"),
    countRows(db("lab_category"), "id"),
  ]);

  return {
    featured,
    newest,
    sections: { asmr, music, audiobook, talk },
    totalSounds,
    totalCategories,
  };
}

/** Number of published sounds, for lightweight marketing copy. */
export async function getPublishedSoundCount(): Promise<number> {
  return countRows(soundsBase(), "m.id");
}

export async function getSectionPage(
  slug: SectionSlug,
  page: number,
): Promise<PagedResult<Sound>> {
  if (!SECTION_SLUG_SET.has(slug)) return emptyPage();
  return paginate(
    soundsBase().where("c.section", slug),
    newestFirst(selectSounds(soundsBase().where("c.section", slug))),
    page,
  );
}

export async function searchSounds(query: string, page: number): Promise<PagedResult<Sound>> {
  const term = query.trim().slice(0, 100);
  if (!term) return emptyPage();

  const pattern = `%${escapeLike(term)}%`;
  const applyFilter = (builder: Knex.QueryBuilder) =>
    builder.where(function () {
      this.where("m.subject", "like", pattern)
        .orWhere("m.author", "like", pattern)
        .orWhere("m.summary", "like", pattern);
    });

  return paginate(
    applyFilter(soundsBase()),
    newestFirst(applyFilter(selectSounds(soundsBase()))),
    page,
  );
}

export async function getSoundById(id: number): Promise<Sound | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = (await selectSounds(soundsBase().where("m.id", id)).first()) as SoundRow | undefined;
  return row ? mapSound(row) : null;
}

export async function getRelatedSounds(sound: Sound, limit = 6): Promise<Sound[]> {
  const size = Math.min(Math.max(Math.trunc(limit) || 6, 1), 24);
  const rows = (await selectSounds(
    soundsBase().where("c.section", sound.section).whereNot("m.id", sound.id),
  )
    .orderByRaw("CASE WHEN m.music_category_id = ? THEN 0 ELSE 1 END", [sound.categoryId])
    .orderBy("m.created", "desc")
    .orderBy("m.id", "desc")
    .limit(size)) as SoundRow[];
  return rows.map(mapSound);
}

export async function getFavoriteSounds(uid: number, page: number): Promise<PagedResult<Sound>> {
  const totalQuery = db("lab_favorite as f").where("f.uid", uid);
  const rowsQuery = newestFirst(
    selectSounds(
      db("lab_music as m")
        .join("lab_favorite as f", "f.music_id", "m.id")
        .leftJoin("lab_category as c", "c.id", "m.music_category_id")
        .where("f.uid", uid)
        .where("m.status", 1),
    ),
  ).orderBy("f.created", "desc");

  const total = await countRows(totalQuery, "f.id");
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const resolvedPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const rows =
    totalPages === 0
      ? []
      : ((await rowsQuery.limit(PAGE_SIZE).offset((resolvedPage - 1) * PAGE_SIZE)) as SoundRow[]);

  return {
    items: rows.map(mapSound),
    total,
    page: resolvedPage,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

export async function getFavoriteIds(uid: number): Promise<Set<number>> {
  const rows = (await db("lab_favorite")
    .select("music_id")
    .where("uid", uid)) as Array<{ music_id: number | string }>;
  return new Set(rows.map((row) => toCount(row.music_id)));
}

export async function getCategories(): Promise<Category[]> {
  const rows = (await db("lab_category as c")
    .select(...CATEGORY_COLUMNS)
    .orderBy("sort", "asc")
    .orderBy("id", "asc")) as CategoryRow[];
  return rows.map(mapCategory);
}
