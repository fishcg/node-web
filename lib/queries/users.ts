import "server-only";

import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { assetUrl } from "@/lib/utils";

/** 登录校验所需的用户字段（含密码哈希，绝不外传）。 */
export interface AuthUser {
  id: number;
  username: string;
  passwordHash: string;
  status: number;
}

interface UserRow {
  id: number | string;
  username: string;
  password_hash?: string;
  avatar?: string | null;
  status?: number | string;
  role?: string | null;
}

export function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; errno?: unknown };
  return candidate.code === "ER_DUP_ENTRY" || candidate.errno === 1062;
}

export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  const row = (await db("lab_user")
    .select("id", "username", "password_hash", "status")
    .where({ username })
    .first()) as UserRow | undefined;

  if (!row) return null;
  return {
    id: Number(row.id),
    username: row.username,
    passwordHash: row.password_hash ?? "",
    status: Number(row.status ?? 0),
  };
}

/** 读取会话用户；账号被禁用/删除时返回 null。 */
export async function findSessionUser(id: number): Promise<SessionUser | null> {
  const row = (await db("lab_user")
    .select("id", "username", "avatar", "role")
    .where({ id })
    .where("status", 1)
    .first()) as UserRow | undefined;

  if (!row) return null;
  const avatar = assetUrl(row.avatar);
  return {
    id: Number(row.id),
    username: row.username,
    avatar: avatar || null,
    role: row.role === "admin" ? "admin" : "user",
  };
}

/** 创建用户；用户名重复时返回 null（唯一键冲突不算异常）。 */
export async function createUser(input: {
  username: string;
  passwordHash: string;
}): Promise<SessionUser | null> {
  try {
    const [insertId] = await db("lab_user").insert({
      username: input.username,
      password_hash: input.passwordHash,
      status: 1,
    });
    return {
      id: Number(insertId),
      username: input.username,
      avatar: null,
      role: "user",
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) return null;
    throw error;
  }
}

/** 登录成功后记录最近登录时间；失败只记录日志，不影响登录。 */
export async function touchLastLogin(id: number): Promise<void> {
  try {
    await db("lab_user").where({ id }).update({ last_login: db.fn.now() });
  } catch (error) {
    console.error("[users] failed to update last_login", error);
  }
}
