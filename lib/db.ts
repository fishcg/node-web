import knex, { type Knex } from "knex";
import { getDbConfig } from "./db-config";

const globalForDb = globalThis as unknown as { __acgayDb?: Knex };

export const db: Knex = globalForDb.__acgayDb ?? knex(getDbConfig());

if (process.env.NODE_ENV !== "production") {
  globalForDb.__acgayDb = db;
}
