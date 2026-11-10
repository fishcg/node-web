/** Shared, dependency-free formatters for the social surfaces. */

function toDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `14:05` — chat bubble timestamp. */
export function formatChatTime(value: string): string {
  const date = toDate(value);
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** `2026.11.10` — day separator inside a conversation. */
export function formatChatDay(value: string): string {
  return value.slice(0, 10).replaceAll("-", ".");
}

/** `2026.11.10 14:05` — notifications and logs. */
export function formatDateTime(value: string): string {
  const time = formatChatTime(value);
  return time ? `${formatChatDay(value)} ${time}` : formatChatDay(value);
}

/** `14:05` for today, `11.09` for earlier days — conversation list rows. */
export function formatListTime(value: string): string {
  const date = toDate(value);
  if (!date) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return formatChatTime(value);
  return formatChatDay(value).slice(5);
}
