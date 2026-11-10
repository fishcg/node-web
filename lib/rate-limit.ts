/**
 * 进程内固定窗口限流。
 *
 * 仅用于单实例部署的轻量防爆破；多实例/Serverless 场景需要换成 Redis 等共享存储。
 * 所有调用都通过 globalThis 共享同一个 Map，避免 Next 开发模式热更新后计数丢失。
 */

export interface RateLimitResult {
  /** 本次请求是否允许 */
  allowed: boolean;
  /** 窗口内允许的最大次数 */
  limit: number;
  /** 窗口内剩余可用次数（超限时为 0） */
  remaining: number;
  /** 当前窗口结束时间戳（毫秒） */
  resetAt: number;
  /** 距离窗口重置的毫秒数（未超限时为 0） */
  retryAfterMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as typeof globalThis & {
  __acgayRateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets = (globalStore.__acgayRateLimitBuckets ??= new Map<string, RateLimitBucket>());

/** 防止被随机 key 撑爆内存 */
const MAX_BUCKETS = 5_000;

function prune(now: number): void {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_BUCKETS) return;
  // 仍超量时，优先丢弃最早过期的键
  const overflow = buckets.size - MAX_BUCKETS;
  const oldest = [...buckets.entries()]
    .sort((left, right) => left[1].resetAt - right[1].resetAt)
    .slice(0, overflow);
  for (const [key] of oldest) buckets.delete(key);
}

/** 记一次请求并返回当前窗口状态。 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const max = Math.max(1, Math.trunc(limit));
  const window = Math.max(1_000, Math.trunc(windowMs));
  const now = Date.now();
  prune(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + window };
    buckets.set(key, bucket);
  } else {
    bucket.count += 1;
  }

  const allowed = bucket.count <= max;
  return {
    allowed,
    limit: max,
    remaining: Math.max(0, max - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterMs: allowed ? 0 : Math.max(0, bucket.resetAt - now),
  };
}

/** 清除某个 key（例如登录成功后清空失败计数）。 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** 组装稳定的限流 key，用户名统一小写避免大小写绕过。 */
export function rateLimitKey(scope: string, ip: string, username?: string): string {
  const parts = [scope, ip];
  if (username) parts.push(username.trim().toLowerCase());
  return parts.join(":");
}

/**
 * 取客户端 IP。部署在反向代理后时以 x-forwarded-for 首个地址为准。
 * 本地直连没有代理头时回退到 x-real-ip 或常量 "local"。
 */
export function getClientIp(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  return realIp || "local";
}
