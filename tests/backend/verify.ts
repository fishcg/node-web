/**
 * task-1 后端冒烟校验：直接连开发库验证查询、限流、校验与会话加密。
 * 运行：node --conditions=react-server --import tsx tests/backend/verify.ts
 * （react-server 条件让 server-only 解析为空模块，否则 tsx 下会抛错）
 */
import { loadLocalEnv } from "../../scripts/env";

const failures: string[] = [];

function check(name: string, ok: boolean, detail: unknown = ""): void {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail === "" ? "" : `  ${JSON.stringify(detail)}`}`);
  if (!ok) failures.push(name);
}

async function main(): Promise<void> {
  loadLocalEnv();

  const bcrypt = (await import("bcryptjs")).default;
  const ironSession = await import("iron-session");
  const { db } = await import("@/lib/db");
  const sounds = await import("@/lib/queries/sounds");
  const users = await import("@/lib/queries/users");
  const { checkRateLimit, rateLimitKey, resetRateLimit } = await import("@/lib/rate-limit");
  const { loginSchema, registerSchema } = await import("@/lib/validation");

  try {
    // ---------- sounds ----------
    const home = await sounds.getHomeData();
    check("home.featured <= 5", home.featured.length <= 5, home.featured.length);
    check("home.featured top 优先", home.featured[0]?.top === true, home.featured[0]?.id);
    check("home.newest <= 8", home.newest.length <= 8, home.newest.length);
    check("home.sections 每区 <= 6", Object.values(home.sections).every((items) => items.length <= 6));
    const totalRow = (await db("lab_music").where("status", 1).count({ total: "id" })) as Array<{
      total: string | number;
    }>;
    const directTotal = Number(totalRow[0]?.total ?? 0);
    const categoryRow = (await db("lab_category").count({ total: "id" })) as Array<{
      total: string | number;
    }>;
    check("home.totalSounds 与库一致", home.totalSounds === directTotal, {
      home: home.totalSounds,
      db: directTotal,
    });
    check(
      "home.totalCategories 与库一致",
      home.totalCategories === Number(categoryRow[0]?.total ?? 0),
      home.totalCategories,
    );
    check("home sections keys", Object.keys(home.sections).join(",") === "asmr,music,audiobook,talk");

    const asmr = await sounds.getSectionPage("asmr", 1);
    const asmrRow = (await db("lab_music as m")
      .join("lab_category as c", "c.id", "m.music_category_id")
      .where("m.status", 1)
      .where("c.section", "asmr")
      .count({ total: "m.id" })) as Array<{ total: string | number }>;
    const directAsmr = Number(asmrRow[0]?.total ?? 0);
    check("asmr total 与库一致", asmr.total === directAsmr, { page: asmr.total, db: directAsmr });
    check("asmr pageSize = 12", asmr.pageSize === 12 && asmr.items.length === Math.min(12, directAsmr));
    check("asmr totalPages", asmr.totalPages === Math.ceil(directAsmr / 12), asmr.totalPages);
    check("asmr all section", asmr.items.every((item) => item.section === "asmr"));

    const talk = await sounds.getSectionPage("talk", 1);
    check("talk 空分区 []", talk.total === 0 && talk.items.length === 0 && talk.totalPages === 0);

    const clamped = await sounds.getSectionPage("asmr", 999);
    check("page 越界收敛", clamped.page === clamped.totalPages, clamped.page);

    const searched = await sounds.searchSounds("VOCALOID", 1);
    check("search 有结果", searched.total > 0, searched.total);
    check("search 空词返回空", (await sounds.searchSounds("   ", 1)).total === 0);
    const likeEscaped = await sounds.searchSounds("100%", 1);
    check("search LIKE 特殊字符不报错", likeEscaped.total >= 0, likeEscaped.total);

    const sound = await sounds.getSoundById(848);
    check("getSoundById(848)", sound !== null && sound.id === 848, sound?.id);
    check("sound 字段完整", !!sound && typeof sound.subject === "string" && sound.section === "music");
    check("url 已解析为绝对地址", !!sound && sound.url.startsWith("https://"), sound?.url);
    check("url 无双重前缀", !!sound && !/aliyuncs\.com\/https?:\/\//i.test(sound.url), sound?.url);
    check("photo 无双重前缀", !!sound && !/aliyuncs\.com\/https?:\/\//i.test(sound.photo));
    check("getSoundById 不存在 -> null", (await sounds.getSoundById(999999)) === null);
    check("getSoundById 非法 -> null", (await sounds.getSoundById(-1)) === null);

    if (sound) {
      const related = await sounds.getRelatedSounds(sound);
      check(
        "related <= 6 且不含自身",
        related.length <= 6 && related.every((item) => item.id !== sound.id),
        related.length,
      );
      const one = await sounds.getRelatedSounds(sound, 1);
      check("related limit clamp", one.length === 1);
    }

    const favorites = await sounds.getFavoriteSounds(1, 1);
    check("favorites total = 4", favorites.total === 4, favorites.total);
    check("favorites items = 4", favorites.items.length === 4, favorites.items.map((item) => item.id));
    const favoriteIds = await sounds.getFavoriteIds(1);
    check("getFavoriteIds Set size = 4", favoriteIds instanceof Set && favoriteIds.size === 4, [...favoriteIds]);
    check("getFavoriteIds 空用户", (await sounds.getFavoriteIds(999999)).size === 0);

    const categories = await sounds.getCategories();
    check("categories length = 6", categories.length === 6, categories.length);
    check(
      "categories sort asc",
      categories.every((item, index) => index === 0 || categories[index - 1].sort <= item.sort),
    );

    // URL 真实可访问（仅抽一条；OSS 在境外时可能受网络影响）
    if (sound?.url) {
      try {
        const response = await fetch(sound.url, { method: "HEAD" });
        check("首条 url HEAD 200", response.status === 200, response.status);
      } catch (error) {
        check("首条 url HEAD 200", false, String(error));
      }
    }

    // ---------- users ----------
    const demo = await users.findUserByUsername("demo");
    check("demo 用户存在且 status=1", demo?.username === "demo" && demo.status === 1);
    check("demo 密码 demo1234 可校验", !!demo && (await bcrypt.compare("demo1234", demo.passwordHash)));
    check("不存在用户 -> null", (await users.findUserByUsername("__not_exists__")) === null);
    const sessionUser = await users.findSessionUser(1);
    check("findSessionUser(1)", sessionUser?.username === "demo", sessionUser);
    check("findSessionUser 不存在 -> null", (await users.findSessionUser(999999)) === null);

    // ---------- validation ----------
    check("login 空输入报错", !loginSchema.safeParse({ username: "", password: "" }).success);
    check(
      "register 密码不一致报错",
      !registerSchema.safeParse({ username: "abc", password: "12345678", confirmPassword: "87654321" })
        .success,
    );
    const registerOk = registerSchema.safeParse({
      username: "测试_user",
      password: "12345678",
      confirmPassword: "12345678",
    });
    check("register 合法输入通过", registerOk.success, registerOk.success ? "" : registerOk.error.issues);

    // ---------- rate limit ----------
    const key = rateLimitKey("verify", "127.0.0.1", "Demo");
    resetRateLimit(key);
    const first = checkRateLimit(key, 2, 60_000);
    const second = checkRateLimit(key, 2, 60_000);
    const third = checkRateLimit(key, 2, 60_000);
    check("限流前两次 allowed", first.allowed && second.allowed);
    check("限流第三次 blocked", !third.allowed && third.remaining === 0 && third.retryAfterMs > 0);
    resetRateLimit(key);
    check("reset 后恢复", checkRateLimit(key, 1, 60_000).allowed);
    resetRateLimit(key);

    // ---------- iron-session ----------
    const secret = process.env.SESSION_SECRET ?? "";
    const sealed = await ironSession.sealData(
      { userId: 1, username: "demo" },
      { password: secret, ttl: 60 },
    );
    const unsealed = (await ironSession.unsealData(sealed, {
      password: secret,
    })) as { userId?: number };
    check("iron-session seal/unseal", unsealed.userId === 1);
    let unsealError: string | undefined;
    const tampered = (await ironSession.unsealData(`${sealed.slice(0, -2)}xx`, {
      password: secret,
      onUnsealError: (reason) => {
        unsealError = reason;
      },
    })) as { userId?: number };
    // v9 的 unsealData 对非法 seal 返回 {} 而不是抛错
    check("iron-session 篡改后为空会话", !tampered.userId && unsealError === "invalid", {
      reason: unsealError,
    });

    // ---------- bcrypt cost ----------
    const hash = await bcrypt.hash("demo1234", 12);
    check("bcrypt cost = 12", bcrypt.getRounds(hash) === 12, bcrypt.getRounds(hash));
    check("bcrypt compare", await bcrypt.compare("demo1234", hash));
  } finally {
    await db.destroy();
  }
}

main()
  .catch((error) => {
    console.error("UNCAUGHT", error);
    failures.push("uncaught");
  })
  .finally(() => {
    console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `FAILED: ${failures.join("; ")}`}`);
    process.exitCode = failures.length === 0 ? 0 : 1;
  });
