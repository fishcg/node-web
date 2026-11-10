import { existsSync } from "node:fs";

/**
 * Next.js loads .env.local by itself; standalone scripts do not.
 * Call this before importing anything that reads process.env at module scope.
 */
export function loadLocalEnv() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
}
