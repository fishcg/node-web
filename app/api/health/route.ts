import { db } from "@/lib/db";

/**
 * Liveness / readiness probe used by Docker, Compose and the k3s manifests.
 *
 * The handler is explicitly dynamic and uncached: a cached "ok" would keep a
 * broken database inside the load balancer rotation.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Keep probes snappy even when the pool is waiting on a dead server. */
const DB_PING_TIMEOUT_MS = 3_000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

async function pingDatabase(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.raw("select 1"),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("database ping timed out")),
          DB_PING_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  try {
    await pingDatabase();
    return Response.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    // Log the reason for operators, but never leak it to the probe response.
    console.error(
      "[health] database check failed:",
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      { ok: false },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
