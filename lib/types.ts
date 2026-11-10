export type SectionSlug = "asmr" | "music" | "audiobook" | "talk";

export interface Section {
  slug: SectionSlug;
  name: string;
  shortName: string;
  description: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  section: SectionSlug;
  description: string;
  sort: number;
}

export interface Sound {
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
  categorySlug: string;
  categoryName: string;
  section: SectionSlug;
  top: boolean;
}

export interface PlayerTrack {
  id: number;
  title: string;
  artist: string;
  cover: string;
  url: string;
  categoryName: string;
  section: SectionSlug;
}

export interface SessionUser {
  id: number;
  username: string;
  avatar: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
