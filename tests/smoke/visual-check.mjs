// 375px 视觉 + 交互检查（QA 辅助脚本，不参与构建）
//   node tests/smoke/visual-check.mjs [base-url]
// 使用本机 Chrome（playwright 全局包 + system chrome），输出截图到 tests/smoke/screenshots/。
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/homebrew/lib/node_modules/playwright");

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:3100";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots");
mkdirSync(OUT, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const problems = [];
page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console.error: ${msg.text().slice(0, 300)}`);
});
page.on("pageerror", (err) => problems.push(`pageerror: ${err.message.slice(0, 300)}`));
page.on("requestfailed", (req) => {
  const url = req.url();
  const reason = req.failure()?.errorText ?? "";
  // 暂停音频会取消尚未完成的 range 请求，属于正常
  if (reason.includes("ERR_ABORTED")) return;
  if (url.startsWith(BASE) || url.includes("acgay.oss")) {
    problems.push(`requestfailed: ${reason} ${url.slice(0, 200)}`);
  }
});

async function shot(name, { scrollTo = 0 } = {}) {
  if (scrollTo) await page.evaluate((y) => window.scrollTo(0, y), scrollTo);
  await page.waitForTimeout(400);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${file}`);
}

/** 记录 375px 下的横向溢出与超出视口的控件。 */
async function checkOverflow(label) {
  const result = await page.evaluate(() => {
    const de = document.documentElement;
    const offenders = [];
    const viewport = window.innerWidth;
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.right > viewport + 1) {
        // 横向轮播/滚动容器的子元素超出视口是正常设计，跳过
        let scrollable = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === "auto" || ox === "scroll" || ox === "overlay") {
            scrollable = true;
            break;
          }
        }
        if (scrollable) continue;
        // 只记录被裁掉且可交互的元素
        if (el.closest("a, button, input, select, [role=button]")) {
          offenders.push(
            `${el.tagName.toLowerCase()} "${(el.textContent || "").trim().slice(0, 20)}" right=${Math.round(r.right)}`,
          );
        }
      }
      if (offenders.length >= 5) break;
    }
    return { scrollWidth: de.scrollWidth, viewport, offenders };
  });
  if (result.scrollWidth > result.viewport) {
    problems.push(`${label}: 页面横向溢出 ${result.scrollWidth}px > ${result.viewport}px`);
  }
  for (const o of result.offenders) problems.push(`${label}: 控件超出视口 ${o}`);
}

// 1. 首页
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await shot("home-375");
await checkOverflow("首页");
const homeH1 = await page.locator("h1").first().innerText();
console.log(`  首页 H1: ${homeH1.replace(/\s+/g, " ").slice(0, 80)}`);

// 2. 分区
await page.goto(`${BASE}/category/asmr`, { waitUntil: "networkidle" });
await shot("category-asmr-375");
await checkOverflow("分区页");
console.log(`  分区卡片数: ${await page.locator("article, a[href^='/sound/']").count()}`);

// 3. 详情页（先看首屏，再滚到播放控件）
await page.goto(`${BASE}/sound/848`, { waitUntil: "networkidle" });
await shot("sound-848-375");
await shot("sound-848-player-375", { scrollTo: 520 });
await checkOverflow("详情页");

// 3b. 播放真实音频
const playButton = page.getByRole("button", { name: /开始播放|暂停/ }).first();
if ((await playButton.count()) > 0) {
  await playButton.click();
  await page.waitForTimeout(4000);
  const audio = await page.evaluate(() => {
    const a = document.querySelector("audio");
    return a
      ? { paused: a.paused, currentTime: a.currentTime, duration: a.duration, error: a.error?.code ?? null }
      : null;
  });
  console.log(`  音频状态: ${JSON.stringify(audio)}`);
  if (!audio || audio.error || audio.currentTime <= 0) {
    problems.push(`音频未正常播放: ${JSON.stringify(audio)}`);
  }
  await playButton.click(); // 暂停，避免继续占用带宽
}

// 4. 登录流程（demo/demo1234）→ /me → /me/favorites
await page.goto(`${BASE}/login?next=/me`, { waitUntil: "networkidle" });
await page.getByLabel(/用户名/).fill("demo");
await page.getByLabel(/密码/).fill("demo1234");
await page.getByRole("button", { name: /登\s*录/ }).click();
await page.waitForFunction(() => window.location.pathname === "/me", null, { timeout: 15000 });
await page.waitForLoadState("networkidle");
const cookies = await context.cookies();
const hasSession = cookies.some((c) => c.name === "acgay_session");
console.log(`  登录后 URL: ${page.url()} / session cookie: ${hasSession}`);
if (!hasSession) problems.push("登录后没有 acgay_session cookie");
await shot("me-375");

await page.goto(`${BASE}/me/favorites`, { waitUntil: "networkidle" });
console.log(`  收藏页 URL: ${page.url()}`);
await shot("me-favorites-375", { scrollTo: 300 });

// 5. 搜索
await page.goto(`${BASE}/search?q=vocaloid`, { waitUntil: "networkidle" });
const searchCount = await page.locator("a[href^='/sound/']").count();
console.log(`  搜索结果链接数: ${searchCount}`);
await checkOverflow("搜索页");
await shot("search-375");

// 6. 退出登录（POST server action）
await page.goto(`${BASE}/me`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /退出登录/ }).click();
await page.waitForTimeout(2500);
const cookiesAfter = await context.cookies();
const stillLoggedIn = cookiesAfter.some((c) => c.name === "acgay_session");
console.log(`  退出后 URL: ${page.url()} / session cookie: ${stillLoggedIn}`);
if (stillLoggedIn) problems.push("退出登录后 acgay_session cookie 仍存在");
await shot("logout-375");

await browser.close();

console.log("\n问题汇总：");
if (problems.length === 0) console.log("  无 console/pageerror/requestfailed");
else for (const p of problems) console.log("  -", p);
