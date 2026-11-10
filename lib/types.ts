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
  role: UserRole;
}

export type UserRole = "user" | "admin";

export interface PublicUser {
  id: number;
  username: string;
  avatar: string | null;
  role: UserRole;
  created: string;
}

export interface UserProfile extends PublicUser {
  followerCount: number;
  followingCount: number;
  soundCount: number;
  isFollowing: boolean;
  isSelf: boolean;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  created: string;
}

export interface ConversationSummary {
  user: PublicUser;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  body: string;
  readAt: string | null;
  created: string;
  isMine: boolean;
}

export interface UnreadCounts {
  notifications: number;
  messages: number;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Submission {
  id: number;
  subject: string;
  summary: string;
  author: string;
  url: string;
  photo: string;
  created: string;
  status: SubmissionStatus;
  reviewReason: string;
  categoryId: number;
  categoryName: string;
  section: SectionSlug;
}

export interface SubmissionWithUser extends Submission {
  submitter: PublicUser;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
