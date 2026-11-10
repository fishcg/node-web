import type { Knex } from "knex";

/**
 * Shared by the Next.js app (lib/db.ts) and the command line scripts.
 * Keeping this file free of `server-only` lets `tsx scripts/*.ts` reuse it.
 */
export function getDbConfig(): Knex.Config {
  return {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "acgay",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "acgay",
      charset: "utf8mb4",
      // Return DATETIME columns as "YYYY-MM-DD HH:mm:ss" strings so the
      // rendered markup stays stable across server / client boundaries.
      dateStrings: true,
      timezone: "+08:00",
    },
    pool: { min: 0, max: 10 },
    acquireConnectionTimeout: 10_000,
  };
}
