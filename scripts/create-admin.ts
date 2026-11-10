import bcrypt from "bcryptjs";

import { loadLocalEnv } from "./env";

loadLocalEnv();

async function main() {
  const [{ default: knex }, { getDbConfig }] = await Promise.all([
    import("knex"),
    import("../lib/db-config"),
  ]);
  const db = knex(getDbConfig());

  const username = (process.env.ADMIN_USERNAME ?? "admin").trim();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!/^[\w\u4e00-\u9fa5-]{2,32}$/.test(username)) {
    throw new Error("ADMIN_USERNAME must be 2-32 characters (letters, numbers, _, -, Chinese)");
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = (await db("lab_user").select("id").where({ username }).first()) as
    | { id: number | string }
    | undefined;

  let id: number;
  if (existing) {
    await db("lab_user").where({ id: existing.id }).update({
      password_hash: passwordHash,
      role: "admin",
      status: 1,
    });
    id = Number(existing.id);
    console.log(`[admin] updated existing user ${username} (id=${id}) and granted admin role`);
  } else {
    const [insertId] = await db("lab_user").insert({
      username,
      password_hash: passwordHash,
      role: "admin",
      status: 1,
    });
    id = Number(insertId);
    console.log(`[admin] created admin user ${username} (id=${id})`);
  }

  await db.destroy();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[admin] failed:", error);
    process.exit(1);
  });
