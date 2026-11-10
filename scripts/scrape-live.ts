import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE = "https://www.acgay.cn";
const OSS = "https://acgay.oss-cn-hangzhou.aliyuncs.com";
const OUTPUT = path.join(process.cwd(), "data", "live-sounds.json");
const USER_AGENT = "acgay-rebuild/2.0 (+https://www.acgay.cn; seed scraper)";

const HOME_GROUPS = [
  ["recommendSounds", "recommend"],
  ["newSounds", "new"],
  ["vocaloidSounds", "asmr"],
  ["hotSounds", "vocaloid"],
  ["lightSounds", "light"],
  ["otherSounds", "other"],
] as const;

type GroupName = (typeof HOME_GROUPS)[number][1];

interface RawSound {
  id?: number;
  subject?: string;
  summary?: string;
  author?: string;
  views?: number;
  view?: number;
  photo?: string;
  url?: string;
  created?: string;
  replies?: number;
}

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
  categoryName: string;
  section: string;
  top: number;
  groups: GroupName[];
}

async function fetchText(url: string, retries = 3): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "text/html" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    }
  }
  throw lastError;
}

function parseFish<T>(html: string): T | null {
  const match = html.match(/Fish\.getDate\('([\s\S]*?)'\)/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    // Some legacy pages HTML-escape quotes inside the injected JSON.
    try {
      return JSON.parse(match[1].replaceAll("&quot;", '"')) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Normalise an asset reference to the canonical form stored in MySQL:
 * OSS assets are relative (`cover/...`, `sound/...`), everything else stays
 * absolute. `assetUrl()` in lib/utils.ts applies the OSS prefix at render time.
 */
function canonicalAsset(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  // The legacy pages already return absolute OSS URLs. Strip the bucket so the
  // database does not accumulate `https://oss/https://oss/...` prefixes.
  if (trimmed.startsWith(`${OSS}/`)) return trimmed.slice(OSS.length + 1);
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\/(acgay|.*?\.aliyuncs)\./i, "https://$1.");
  }
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${SITE}${trimmed}`;
  return trimmed.replace(/^\/+/, "");
}

function assetPublicUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${OSS}/${value}`;
}

async function reachable(url: string): Promise<boolean> {
  if (!url) return false;
  const target = assetPublicUrl(url);
  if (!/^https?:\/\//i.test(target)) return false;
  if (target.startsWith("https://acgay.oss-cn-hangzhou.aliyuncs.com")) return true;
  try {
    const response = await fetch(target, {
      method: "HEAD",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function inferCategory(subject: string, groups: Set<GroupName>): number {
  if (groups.has("asmr")) return 100;
  if (groups.has("vocaloid")) return 101;
  if (groups.has("light")) return 102;

  if (/有声书|朗读|夜读|夜话|睡前故事|广播剧|小说|散文|读诗/i.test(subject)) return 103;
  if (
    /asmr|音声|耳语|助眠|白噪音|雨声|催眠|轻声|掏耳|口腔音|女友|男友|年上|妹妹|姐姐|耳边|心跳|低语|撒娇|哄睡/i.test(
      subject,
    )
  ) {
    return 100;
  }
  if (
    /vocaloid|初音|镜音|巡音|洛天依|乐正绫|言和|星尘|海伊|赤羽|utau|翻唱|原创曲|术力口|翻调/i.test(
      subject,
    )
  ) {
    return 101;
  }
  if (
    /轻音乐|纯音乐|钢琴|小提琴|吉他|大提琴|bgm|放松|专注|工作|学习|冥想|环境音|白噪声|海浪|森林|弹唱/i.test(
      subject,
    )
  ) {
    return 102;
  }
  if (/电台|闲聊|杂谈|播客|访谈|直播回放|唠嗑/i.test(subject)) return 105;
  return 104;
}

const CATEGORY_NAMES: Record<number, string> = {
  100: "ASMR / 中文音声",
  101: "VOCALOID / UTAU",
  102: "轻音乐 / BGM",
  103: "有声书",
  104: "音乐 / 其他",
  105: "杂谈 / 电台",
};

const CATEGORY_SECTIONS: Record<number, string> = {
  100: "asmr",
  101: "music",
  102: "music",
  103: "audiobook",
  104: "music",
  105: "talk",
};

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  // `otherSounds` is ordered by RAND() on every request. Fetching the
  // homepage a few times grows the local library beyond the first 48 items.
  const HOME_FETCHES = 6;
  const homePages = await mapLimit(Array.from({ length: HOME_FETCHES }), 3, async (_, index) => {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 250));
    return fetchText(`${SITE}/`);
  });

  const grouped = new Map<number, { item: RawSound; groups: Set<GroupName> }>();
  const groupIdSets = new Map<GroupName, Set<number>>();

  for (const [pageIndex, homeHtml] of homePages.entries()) {
    const home = parseFish<Record<string, RawSound[]>>(homeHtml);
    if (!home) {
      if (pageIndex === 0) throw new Error("Unable to parse Fish.getDate payload from homepage");
      console.warn(`  ! homepage fetch ${pageIndex + 1} had no payload, skipped`);
      continue;
    }
    for (const [key, name] of HOME_GROUPS) {
      const list = Array.isArray(home[key]) ? home[key] : [];
      const idSet = groupIdSets.get(name) ?? new Set<number>();
      groupIdSets.set(name, idSet);
      for (const item of list) {
        const id = Number(item.id);
        if (!id) continue;
        idSet.add(id);
        const existing = grouped.get(id);
        if (existing) {
          existing.groups.add(name);
        } else {
          grouped.set(id, { item, groups: new Set([name]) });
        }
      }
    }
  }

  const groupIds: Partial<Record<GroupName, number[]>> = {};
  for (const [name, idSet] of groupIdSets) groupIds[name] = [...idSet];

  console.log(
    `Found ${grouped.size} unique sounds across ${HOME_FETCHES} homepage fetches and ${HOME_GROUPS.length} rails`,
  );

  const ids = [...grouped.keys()];
  const details = await mapLimit(ids, 4, async (id) => {
    try {
      const html = await fetchText(`${SITE}/music/play?id=${id}`);
      const payload = parseFish<{ sound?: RawSound }>(html);
      return { id, sound: payload?.sound ?? null };
    } catch (error) {
      console.warn(`  ! play page ${id} failed: ${(error as Error).message}`);
      return { id, sound: null };
    }
  });

  const detailById = new Map(details.map((detail) => [detail.id, detail.sound]));
  const sounds: SeedSound[] = [];

  for (const [id, { item, groups }] of grouped) {
    const detail = detailById.get(id);
    const merged = { ...item, ...(detail ?? {}) };
    const subject = String(merged.subject ?? item.subject ?? "").trim();
    if (!subject || subject.toLowerCase() === "test") {
      console.warn(`  ! ${id} has no usable subject, skipped`);
      continue;
    }

    let photo = canonicalAsset(merged.photo ?? item.photo);
    if (photo && !(await reachable(photo))) {
      console.warn(`  ! ${id} cover is unreachable, using gradient fallback: ${photo}`);
      photo = "";
    }
    const url = canonicalAsset(merged.url ?? item.url);
    const categoryId = inferCategory(subject, groups);
    const created = String(merged.created ?? item.created ?? "").trim();

    sounds.push({
      id,
      subject,
      summary: String(merged.summary ?? "").trim(),
      author: String(merged.author ?? "").trim(),
      url,
      photo,
      created: created || "2025-03-01 00:00:00",
      views: Number(merged.views ?? merged.view ?? 0) || 0,
      replies: Number(merged.replies ?? 0) || 0,
      categoryId,
      categoryName: CATEGORY_NAMES[categoryId] ?? CATEGORY_NAMES[104],
      section: CATEGORY_SECTIONS[categoryId] ?? "talk",
      top: groups.has("recommend") ? 1 : 0,
      groups: [...groups],
    });
  }

  sounds.sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : b.id - a.id));

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(
    OUTPUT,
    `${JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        source: SITE,
        groups: groupIds,
        sounds,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const counts = new Map<number, number>();
  for (const sound of sounds) counts.set(sound.categoryId, (counts.get(sound.categoryId) ?? 0) + 1);
  console.log(`Wrote ${sounds.length} sounds to ${OUTPUT}`);
  for (const [categoryId, count] of [...counts].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${categoryId} ${CATEGORY_NAMES[categoryId]}: ${count}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
