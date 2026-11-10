import "server-only";

import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { findSessionUser } from "@/lib/queries/users";
import type { SessionUser } from "@/lib/types";
import { safeNextPath } from "@/lib/utils";

export const SESSION_COOKIE_NAME = "acgay_session";

/** 只放最少的身份信息；用户资料每次从数据库重新读取。 */
export interface SessionData {
  userId?: number;
  username?: string;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 天，与 iron-session 默认一致
const DEV_SECRET = "acgay-local-development-session-secret-do-not-use-in-production";

function sessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set and at least 32 characters long");
    }
  }

  return {
    cookieName: SESSION_COOKIE_NAME,
    password: secret && secret.length >= 32 ? secret : DEV_SECRET,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

/** 读取（或按需创建）当前请求的加密会话。 */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/**
 * 读取当前登录用户；未登录、cookie 失效或账号被禁用时返回 null。
 * 用 react cache 保证同一次渲染只查一次库。
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession();
  if (!session.userId) return null;
  return findSessionUser(session.userId);
});

/** 服务端页面/action 的登录守卫，未登录时跳转登录页并带上回跳地址。 */
export async function requireUser(nextPath = "/me"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  redirect(`/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
}

/** 管理员守卫：未登录去登录页，已登录但不是管理员直接 404（不暴露后台存在）。 */
export async function requireAdmin(nextPath = "/admin"): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (user.role !== "admin") notFound();
  return user;
}
