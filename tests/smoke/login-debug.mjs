import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/homebrew/lib/node_modules/playwright");

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();

page.on("console", (m) => console.log(`[console.${m.type()}]`, m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
page.on("response", async (res) => {
  if (res.request().method() === "POST") {
    console.log(`[POST ${res.status()}] ${res.url()}`);
    try {
      const body = await res.text();
      console.log("  body:", body.slice(0, 300).replace(/\s+/g, " "));
    } catch {}
  }
});

await page.goto(`${BASE}/login?next=/me`, { waitUntil: "networkidle" });
console.log("before URL:", page.url());
console.log("inputs:", await page.locator("input").count(), "buttons:", await page.locator("button").allInnerTexts());

const user = page.getByLabel(/用户名/);
const pass = page.getByLabel(/密码/);
await user.fill("demo");
await pass.fill("demo1234");

console.log("button:", await page.getByRole("button", { name: /登\s*录/ }).allInnerTexts());
await page.getByRole("button", { name: /登\s*录/ }).click();
await page.waitForTimeout(4000);
console.log("after URL:", page.url());
console.log("cookies:", (await context.cookies()).map((c) => `${c.name}=${c.value.slice(0, 10)}…`).join(", "));
const bodyText = await page.locator("body").innerText();
console.log("visible text (first 800):\n", bodyText.slice(0, 800));
await page.screenshot({ path: "tests/smoke/screenshots/login-debug.png", fullPage: false });

await browser.close();
