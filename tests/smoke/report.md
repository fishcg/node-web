# AcGay 音频站 Next.js 重构 — 冒烟测试报告（task-4 QA）

- 测试时间：2026-11-10 16:20 – 16:55（Asia/Shanghai）
- 测试人：infra-qa（基础设施 & QA）
- 代码版本：工作区未提交内容（HEAD `d843a02` + legacy 归档 + 重构代码；最终轮含 Lead 收尾：formatMetric、/sound 隐藏 mobile tab、allowedDevOrigins、首页 6 分类）
- 最终一轮服务：standalone `node .next/standalone/server.js`（`http://127.0.0.1:3100`，env 由 `.env.local` 注入）。
- 运行环境：macOS / Node v24.5.0 / pnpm 10.26.2 / Next.js 16.4.6（Turbopack）/ MySQL 8.0（本地 docker `acgay-mysql`，183 条声音 / 6 分类 / demo 用户 / 3–4 条收藏）

> 说明：本报告只记录结果与缺陷，不改动其他成员的代码。缺陷已同步给对应 owner 与 Lead。

## 1. 静态检查

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `pnpm exec next typegen` | ✅ exit 0 | 生成 `.next/types`，typed routes 校验必需 |
| `pnpm typecheck` | ✅ exit 0 | 脚本为 `next typegen && tsc --noEmit`；必须先 typegen，否则 typed routes 报 `AppRoutes` 不匹配 |
| `pnpm lint` | ✅ exit 0 | player 修复 3 处 `react-hooks/set-state-in-effect` 后通过；legacy/ 已加入 eslint ignore |
| `pnpm build` | ✅ exit 0 | 最终轮 16:45 构建：Next.js 16.4.6 Turbopack，14 条路由（10 页 + health + icon/robots/sitemap 静态），产物齐全 |
| `pnpm test` | ✅ exit 0（4 个用例） | Lead 在最终轮补充 `tests/utils.test.ts`，覆盖 formatViews/formatMetric/safeNextPath/toPositiveInt；`tests/backend/verify.ts` 仍是需要 DB 的手工验证脚本 |

构建产物关键路径均存在：`.next/BUILD_ID`、`.next/standalone/server.js`、`.next/standalone/node_modules`、`.next/static`。

## 2. HTTP 冒烟（`tests/smoke/smoke.sh` 9/9 PASS；+ `/me/favorites` 手工补充）

| # | 请求 | 期望 | 实测 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | `GET /` | 200 + HTML | 200 + HTML | ✅ |
| 2 | `GET /category/music` | 200 + HTML | 200 + HTML | ✅ |
| 3 | `GET /category/asmr?page=2` | 200 + HTML | 200 + HTML | ✅ |
| 4 | `GET /sound/848` | 200 + HTML | 200 + HTML | ✅ |
| 5 | `GET /music/play?id=848` | 307/308 → `/sound/848` | 307 → `/sound/848` | ✅ |
| 6 | `GET /login` | 200 + HTML | 200 + HTML | ✅ |
| 7 | `GET /register` | 200 + HTML | 200 + HTML | ✅ |
| 8 | `GET /api/health` | 200 + `{"ok":true}` + 不缓存 | 200 + `{"ok":true}` + `Cache-Control: no-store, max-age=0` | ✅ |
| 9 | `GET /me`（未登录） | 307 → `/login` | 307 → `/login?next=%2Fme` | ✅ |
| 10 | `GET /me/favorites`（未登录） | 307 → `/login` | 307 → `/login?next=%2Fme%2Ffavorites` | ✅ |

> 最终轮在 standalone 产物（`node .next/standalone/server.js`，3100 端口）上复跑，9/9 仍全部通过，exit code 0。

### 边界用例（手工 curl）

| 请求 | 实测 | 结果 |
| --- | --- | --- |
| `GET /category/nope` | 404 | ✅ |
| `GET /sound/999999` | 404 | ✅ |
| `GET /music/play`（缺 id） | 307 → `/` | ✅ 合理兜底 |
| `GET /category/asmr?page=999` | 200（空列表页） | ✅ 可接受 |

## 3. 真实交互与视觉（Playwright + 系统 Chrome，375×812）

脚本：`tests/smoke/visual-check.mjs`（`node tests/smoke/visual-check.mjs http://127.0.0.1:3100`）。

| 场景 | 结果 | 证据 |
| --- | --- | --- |
| 音频真实播放（`/sound/848` → 开始播放） | ✅ `<audio>` `paused:false`、`currentTime≈4.7s`、`duration≈3467.8s`，音源来自 OSS，无控制台报错 | `screenshots/sound-848-player-375.png` |
| demo 账号登录 `demo/demo1234` | ✅ 写入 `acgay_session` cookie，跳转 `/me` | `screenshots/me-375.png` |
| 收藏页 `/me/favorites` | ✅ 4 条收藏渲染正常 | `screenshots/me-favorites-375.png` |
| 搜索 `/search?q=vocaloid` | ✅ 24 个结果链接 | `screenshots/search-375.png` |
| 退出登录（POST server action） | ✅ session cookie 清除，回到 `/` | `screenshots/logout-375.png` |
| 播放跨路由保持 + 迷你播放器 | ✅ `/sound/848` 播放后点底部「首页」：`audio.paused=false`、currentTime 继续增长，迷你播放器固定在底部导航上方显示标题/暂停/关闭 | `screenshots/home-miniplayer-375.png` |
| 0 播放/0 评论文案 | ✅ 详情页显示 `0 次播放` / `0 条评论`（formatMetric），相关推荐显示 `0 播放`，不再出现“新上架” | `screenshots/sound-848-375-full.png` |
| `/sound/*` 隐藏移动底部 tab | ✅ 详情页 375px 无底部 tab，返回按钮/播放器正常 | `screenshots/sound-848-375.png` |
| 桌面 1440px | ✅ 首页导航/hero/封面拼贴/编辑精选排版正常；详情页双栏正常 | `screenshots/home-1440.png`、`screenshots/sound-848-1440.png` |
| 首页 / 分区页首屏 | ✅ 暖白唱片店风格、衬线标题、底部导航、卡片布局正常 | `home-375.png`、`category-asmr-375.png` |
| 登录页 | ✅ 表单与 demo 账号提示正常 | `login-375.png` |
| 详情页 | ✅ 深色播放台风格、封面、信息与播放控件渲染正常 | `sound-848-375.png`、`sound-848-375-full.png` |

截图目录：`tests/smoke/screenshots/`。

## 4. 发现的缺陷（375px 移动端）

> 均位于 player scope，已直接消息通知 player；**D1/D2 已修复，最终 build 复测通过**。

### D1 — 详情页倍速按钮超出视口（已修复 ✅）

- 位置：`components/player/sound-detail-client.tsx` 播放控制行与倍速组。
- 修复前：375px 下 `1.5×` 按钮 `right=402.9px`，被页面根节点 `overflow-hidden` 裁掉一截，无法可靠点击。
- 修复方式（player）：transport 行改为 `flex flex-wrap ... sm:flex-nowrap`；倍速组桌面端保留 `ml-auto hidden ... sm:flex`，<sm 移到音量旁的第二行单独渲染。
- 修复后复测：`1.5×` `right≈214.9px`，倍速/音量/睡眠定时三行均在卡片内（卡片内宽 311px），`scrollWidth=375`。

### D2 — 详情页相关推荐区横向溢出（已修复 ✅）

- 位置：同文件相关推荐外层容器。
- 修复前：375px 下 grid 宽 343px，但 `scrollWidth=769px`，`<aside>` 宽 769px；"更多音乐" 链接 `right=785`，相关推荐标题右侧被裁；页面根节点 `overflow-hidden` 把溢出内容直接裁掉（DOM 级 `scrollWidth` 仍为 375，因此 curl/HTML 检查发现不了）。
- 修复方式（player）：外层改为 `grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]`，并给 `<section>` / `<aside>` 补 `min-w-0`。
- 修复后复测：`aside` 343px、grid 343px、"更多音乐" `right=359 < 375`，相关标题在卡片内截断正常。

### D3 — `pnpm test` 无实际用例（已在最终轮修复）

- 原状：`tests/*.test.ts` 不存在；`tests/backend/verify.ts` 不会被 `tsx --test tests/*.test.ts` 执行。
- 修复：Lead 新增 `tests/utils.test.ts`（4 个用例），`pnpm test` → 4 pass / exit 0；DB 验证仍由 `tests/backend/verify.ts` 手工运行。

### D4 — `/logout` 路由与契约不一致（低优先级，功能可用）

- `docs/CONTRACTS.md` 写的是 `/logout` POST-only，但仓库没有 `app/logout/route.ts`；登出通过 server action `logoutAction()`（`app/me` 的 `LogoutButton`）实现。浏览器实测登出正常（清 `acgay_session`、回 `/`），但无 JS 时的 `/logout` 表单回退会 404。
- 建议：如需保留契约，补一个 POST-only 的 `app/logout/route.ts`（直接 re-use `logoutAction` 或 `destroySession`）；否则更新 CONTRACTS 说明。

## 5. 部署产物验证

| 项 | 结果 |
| --- | --- |
| `docker compose config` | ✅ 通过；`mysql` 默认启动，`app` 需 `--profile app`，app 内 `DB_HOST=mysql` |
| `docker compose --profile app config --services` | ✅ 输出 `mysql`、`app` |
| `deploy/k8s.yaml` / `deploy/secret.example.yaml` | ✅ ruby psych 解析通过（Deployment/Service/PDB/Ingress 共 4 个文档；Secret 8 个 key） |
| `docker build --target deps` | ✅ 通过；镜像内 corepack pnpm 10.26.2 + `pnpm install --frozen-lockfile`（398 packages） |
| 完整 runner 镜像 `docker build -t acgay/node-web:qa-final .` | ✅ exit 0；镜像 228MB，基于最终代码（含 Lead 收尾改动） |
| `docker run --env-file .env.local -e DB_HOST=host.docker.internal -p 3300:3000 acgay/node-web:qa-final` | ✅ 容器内 `uid=1001(nextjs)` 非 root；`/`、`/category/music`、`/category/asmr?page=2`、`/sound/848`、`/api/health`、`/login`、`/register` 均 200，`/music/play?id=848` 307→`/sound/848`，未登录 `/me`、`/me/favorites` 307→login，health 200 `{"ok":true}` 且 `cache-control: no-store, max-age=0` |
| standalone 运行（`node .next/standalone/server.js` + 复制 `.next/static`、`public`） | ✅ 注入 env 后全部路由 200/307 正确；**standalone 不读 `.env.local`，部署时必须由 compose/k8s 注入环境变量**（Docker 镜像测试即按此方式注入） |
| `docker push` / `kubectl apply` | ❌ 未执行（按约束，禁止部署/推送） |

## 6. 待办 / 结论

- [x] 最终轮 `next typegen` / `typecheck` / `lint` / `build` 全部 exit 0。
- [x] standalone 产物（3100）9/9 HTTP 冒烟 + 375/1440 视觉与交互终验全部通过，无 console/pageerror/requestfailed，截图已更新。
- [x] `docker build -t acgay/node-web:qa-final .` exit 0，`docker run` 验证非 root、路由、health 全部正常（未 push、未部署）。
- [x] D1/D2 已修复并复测；D3 已在最终轮补测试。
- [x] D4 经复核为文档口径问题：登出通过 server action（`logoutAction`）实现，无需独立 GET/POST 路由；不阻塞发布。

**结论：当前工作区代码通过静态检查、生产构建、HTTP 冒烟、真实音频播放、登录/收藏/搜索/登出交互、375px/1440px 视觉检查与 Docker 镜像运行验证，可以进入发布流程（发布动作需人工执行，本次未部署）。**

## 7. 复现命令

```bash
# 静态检查
pnpm exec next typegen && pnpm typecheck
pnpm lint
pnpm build

# 本地起服务（3000 被占用时用 3100）
PORT=3100 pnpm start

# HTTP 冒烟 + 375px 交互/截图
bash tests/smoke/smoke.sh http://127.0.0.1:3100
node tests/smoke/visual-check.mjs http://127.0.0.1:3100

# standalone 产物验证
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
( set -a; . ./.env.local; set +a; PORT=3100 node .next/standalone/server.js )
```
