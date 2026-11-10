import type { Section, SectionSlug } from "./types";

export const SITE = {
  name: "幻想の城",
  shortName: "AcGay",
  tagline: "带好耳机，世界属于你",
  description:
    "幻想の城是一个安静听声音的地方：音乐、ASMR、有声书与杂谈，收藏你喜欢的每一段声音。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const SECTIONS: Section[] = [
  {
    slug: "asmr",
    name: "ASMR / 音声",
    shortName: "ASMR",
    description: "耳畔的雨声、轻声与白噪音",
  },
  {
    slug: "music",
    name: "音乐",
    shortName: "音乐",
    description: "VOCALOID、器乐与循环 BGM",
  },
  {
    slug: "audiobook",
    name: "有声书",
    shortName: "有声书",
    description: "故事、散文与睡前读物",
  },
  {
    slug: "talk",
    name: "杂谈 / 其他",
    shortName: "杂谈",
    description: "主播闲聊、电台与未分类的声音",
  },
];

export const SECTION_BY_SLUG = new Map(SECTIONS.map((section) => [section.slug, section]));

export const SECTION_BY_ID: Record<number, SectionSlug> = {
  100: "asmr",
  101: "music",
  102: "music",
  103: "audiobook",
  104: "music",
  105: "talk",
};

export const CATEGORY_LABELS: Record<number, string> = {
  100: "ASMR / 中文音声",
  101: "VOCALOID / UTAU",
  102: "轻音乐 / BGM",
  103: "有声书",
  104: "音乐 / 其他",
  105: "杂谈 / 电台",
};

export const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/category/music", label: "音乐" },
  { href: "/category/asmr", label: "ASMR" },
  { href: "/category/audiobook", label: "有声书" },
  { href: "/category/talk", label: "杂谈" },
] as const;

export const PAGE_SIZE = 12;
export const HOME_RAIL_SIZE = 6;

export const COVER_FALLBACKS = [
  "from-[#ff9a76] via-[#ff6b4a] to-[#c9422d]",
  "from-[#8b7cf6] via-[#6f5bd8] to-[#3d2e91]",
  "from-[#4facfe] via-[#3a7bd5] to-[#1e3c72]",
  "from-[#43e97b] via-[#2bb673] to-[#166d4b]",
  "from-[#f6d365] via-[#f39c4a] to-[#c76b1e]",
] as const;
