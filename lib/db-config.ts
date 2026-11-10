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
    pool: {
      min: 0,
      max: 10,
      // MySQL defaults to UTC in the container; pin every app connection to
      // China time so CURRENT_TIMESTAMP defaults (messages, notifications)
      // match what users see.
      afterCreate: (
        connection: { query: (sql: string, callback: (error: Error | null) => void) => void },
        done: (error: Error | null, connection: unknown) => void,
      ) => {
        connection.query("SET time_zone = '+08:00'", (error) => {
          done(error, connection);
        });
      },
    },
    acquireConnectionTimeout: 10_000,
  };
}
