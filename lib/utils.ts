import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const OSS_HOST = "acgay.oss-cn-hangzhou.aliyuncs.com";

/** Prefix relative legacy paths with the public OSS bucket. */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path.replace(/^http:\/\/acgay\.oss/i, "https://acgay.oss");
  if (path.startsWith("/")) return path;
  return `${process.env.OSS_BASE_URL ?? "https://acgay.oss-cn-hangzhou.aliyuncs.com"}/${path}`;
}

/** Append OSS image-processing parameters for CSS backgrounds and avatars. */
export function ossImage(url: string, width: number, quality = 78): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== OSS_HOST) return url;
    parsed.searchParams.set("x-oss-process", `image/resize,w_${width}/quality,q_${quality}`);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function formatViews(views: number): string {
  if (!Number.isFinite(views) || views <= 0) return "新上架";
  if (views >= 10000) return `${(views / 10000).toFixed(1)} 万`;
  return new Intl.NumberFormat("zh-CN").format(views);
}

/** Numeric metrics (play/comment counts) never turn a real zero into "新上架". */
export function formatMetric(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`;
  return new Intl.NumberFormat("zh-CN").format(value);
}

/** Deterministic date formatting (no locale / timezone hydration drift). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10).replaceAll("-", ".");
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function truncate(value: string, max = 60): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function initials(value: string): string {
  return value.trim().slice(0, 1).toUpperCase() || "A";
}

export function toPositiveInt(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** Only allow local, single-slash paths as post-login redirect targets. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  // Only same-origin absolute paths. Reject protocol-relative forms and
  // backslashes, which browsers normalize to "//" and would turn into an
  // open redirect (e.g. /\\evil.example).
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/";
  return value;
}

export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Shanghai",
    }).format(new Date()),
  );
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}
