"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { createUser, findUserByUsername, touchLastLogin } from "@/lib/queries/users";
import { checkRateLimit, getClientIp, rateLimitKey, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validation";
import { safeNextPath } from "@/lib/utils";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: { username?: string };
}

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

/** 用户不存在时也做一次等价耗时的比较，避免通过响应时间枚举用户名。 */
const DUMMY_PASSWORD_HASH = "$2b$12$2iGoxPN08UJtCZd4Kglw7OBCr7mYzfNb7JdAiSDqzGXLdjQM1Gxea";
const BCRYPT_COST = 12;

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = z.flattenError(error);
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    const first = Array.isArray(messages) ? messages[0] : undefined;
    if (typeof first === "string" && first.length > 0) fieldErrors[field] = first;
  }
  return fieldErrors;
}

function invalidState(error: z.ZodError, username: string): AuthFormState {
  const fieldErrors = toFieldErrors(error);
  if (Object.keys(fieldErrors).length === 0) {
    return { error: "请检查输入后重试", values: { username } };
  }
  return { fieldErrors, values: { username } };
}

function retryMessage(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `尝试次数过多，请 ${minutes} 分钟后再试`;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = formString(formData, "username").trim();
  const password = formString(formData, "password");
  const next = safeNextPath(formData.get("next"));

  const parsed = loginSchema.safeParse({ username, password });
  if (!parsed.success) return invalidState(parsed.error, username);

  const ip = getClientIp(await headers());
  const limitKey = rateLimitKey("login", ip, parsed.data.username);
  const limit = checkRateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return { error: retryMessage(limit.retryAfterMs), values: { username } };
  }

  const user = await findUserByUsername(parsed.data.username);
  const hash =
    user?.passwordHash && user.passwordHash.startsWith("$2") ? user.passwordHash : DUMMY_PASSWORD_HASH;
  const passwordOk = await bcrypt.compare(password, hash);

  if (!user || user.status !== 1 || !passwordOk) {
    // 统一文案，不区分“用户不存在 / 密码错误 / 账号被禁用”
    return { error: "用户名或密码不正确", values: { username } };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  await touchLastLogin(user.id);
  resetRateLimit(limitKey);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = formString(formData, "username").trim();
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");
  const next = safeNextPath(formData.get("next"));

  const parsed = registerSchema.safeParse({ username, password, confirmPassword });
  if (!parsed.success) return invalidState(parsed.error, username);

  // 注册按 IP 限流：此时用户名还没通过唯一性校验，攻击者可任意更换用户名
  const ip = getClientIp(await headers());
  const limitKey = rateLimitKey("register", ip);
  const limit = checkRateLimit(limitKey, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!limit.allowed) {
    return { error: retryMessage(limit.retryAfterMs), values: { username } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);

  let user;
  try {
    user = await createUser({ username: parsed.data.username, passwordHash });
  } catch (error) {
    console.error("[auth] register failed", error);
    return { error: "注册失败，请稍后再试", values: { username } };
  }

  if (!user) {
    return { fieldErrors: { username: "这个用户名已被使用" }, values: { username } };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logoutAction(): Promise<never> {
  const session = await getSession();
  session.destroy();

  revalidatePath("/", "layout");
  redirect("/");
}
