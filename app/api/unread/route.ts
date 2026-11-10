import { getSessionUser } from "@/lib/auth";
import { getUnreadCounts } from "@/lib/queries/social";
import type { UnreadCounts } from "@/lib/types";

/** 未读数必须每次实时读取，不能被路由缓存。 */
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

const ZERO_COUNTS: UnreadCounts = { notifications: 0, messages: 0 };

export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json(ZERO_COUNTS, { headers: NO_STORE_HEADERS });
  }

  try {
    const counts = await getUnreadCounts(user.id);
    return Response.json(counts, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error(
      "[unread] failed to load counts:",
      error instanceof Error ? error.message : error,
    );
    // 徽标接口失败时返回零值，避免把错误细节暴露给客户端。
    return Response.json(ZERO_COUNTS, {
      status: 500,
      headers: NO_STORE_HEADERS,
    });
  }
}
