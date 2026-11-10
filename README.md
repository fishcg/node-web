# 幻想の城 · AcGay 音频站

> 带好耳机，世界属于你

一个安静听声音的地方：音乐、ASMR、有声书与杂谈。收藏你喜欢的每一段声音，戴上耳机就能离开世界一会儿。

线上地址：**https://www.acgay.cn**（2026-11-10 已切换；旧站保留可回滚，详见 [`deploy/production.md`](./deploy/production.md)）。

这个仓库是 **Next.js 16（App Router）+ React 19** 的重构版本：把原来的单页 Web 应用拆成可路由、可服务端渲染、可部署到 k3s 的现代站点，同时保留最初的暖白唱片店气质与深夜播放台氛围。旧版本完整归档在 [`legacy/`](#legacy-归档)，仅作参考，不参与构建。

---

## 功能

- **首页**：精选 × 最新 × 四个分区的横向推荐栏，移动端优先的 375px 布局
- **四个分区**：`/category/[slug]`（`asmr` / `music` / `audiobook` / `talk`），带分页
- **搜索**：标题 / 作者 / 简介关键词搜索，空结果有兜底提示
- **声音详情**：`/sound/[id]`，封面、统计、同分区相关推荐、收藏按钮
- **全局播放器**：跨页面不中断的底部播放台，播放队列取自当前列表；`/music/play?id=x` 兼容旧链接并 307 到详情页
- **账号**：登录 / 注册 / 登出（iron-session cookie 会话），`/me` 与 `/me/favorites` 需要登录
- **收藏**：登录用户可收藏 / 取消收藏，数据库唯一键保证幂等
- **健康检查**：`/api/health` 对数据库执行 `select 1`，供容器与 k8s 探针使用

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16.4（App Router、Server Components、Server Actions、standalone 输出） |
| UI | React 19.3、TypeScript 5、Tailwind CSS 4、lucide-react、sonner |
| 数据 | MySQL 8.0（utf8mb4）、Knex + mysql2，全部参数化查询 |
| 认证 | iron-session（cookie 加密会话）、bcryptjs（cost 12） |
| 校验 | zod；登录/注册带进程内限流（登录 10 次 / 10 分钟，注册 5 次 / 小时） |
| 工具链 | pnpm 10.26.2、ESLint、Node 内置 test runner（tsx 运行） |
| 部署 | 多阶段 Dockerfile、docker compose（MySQL）、k3s（Deployment + Service + Ingress），见 [`deploy/README.md`](./deploy/README.md) |

## 快速开始

前置要求：

- **Node.js ≥ 22**（推荐 24 LTS；Docker 镜像使用 `node:24-alpine`）
- **pnpm 10.26.2**：`corepack enable && corepack prepare pnpm@10.26.2 --activate`
- **MySQL 8.0**（本机已装，或用下面的 compose 起一个）

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 配置环境变量（.env.local 已被 git 忽略，不要提交真实密钥）
cp .env.example .env.local
#    至少确认 DB_* 与 SESSION_SECRET；SESSION_SECRET 用 `openssl rand -hex 32` 生成

# 3. 启动 MySQL（二选一）
#    a) 本机已有 MySQL 8.0：在 .env.local 里填好 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
#    b) 用 compose 起一个（映射到宿主 3307，避免和本机 3306 冲突）：
docker compose up -d mysql
#       然后把 .env.local 的 DB_PORT 改成 3307

# 4. 建表 + 灌数据（两个脚本都是幂等的，可重复执行）
pnpm db:init
pnpm db:seed

# 5. 启动开发服务器
pnpm dev          # http://localhost:3000
```

### Demo 账号

数据库种子会创建一个演示账号：

```text
用户名：demo
密码：  demo1234
```

登录后可以体验收藏、`/me`、`/me/favorites`。种子还会写入约 180 条曲目数据（见 `data/live-sounds.json`），足够把首页、分区、搜索、详情和播放器走一遍。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发服务器（Turbopack） |
| `pnpm build` | 生产构建（standalone 输出到 `.next/standalone`） |
| `pnpm start` | 以生产模式启动，默认 3000 端口 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | `tsc --noEmit` 类型检查 |
| `pnpm test` | Node 内置 test runner，运行 `tests/*.test.ts` |
| `pnpm db:init` | 执行 `db/schema.sql`（建表）并 upsert 分类数据 |
| `pnpm db:seed` | 写入曲目、demo 用户与示例收藏（幂等；生产环境默认拒绝执行） |
| `pnpm scrape` | 从线上站点抓取曲目列表，更新 `data/live-sounds.json` |

> `db:init` / `db:seed` 依赖 `devDependencies` 里的 `tsx`，不在运行镜像内；生产环境的迁移方式见 [`deploy/README.md`](./deploy/README.md)。

## 目录结构

```text
node-web/
├─ app/                     # App Router 路由
│  ├─ api/health/           # GET /api/health → select 1，200/503
│  ├─ category/[slug]/      # 四个分区列表 + 分页
│  ├─ search/               # 搜索
│  ├─ sound/[id]/           # 声音详情
│  ├─ music/play/           # 旧链接兼容，307 → /sound/[id]
│  ├─ login/ register/ logout/
│  ├─ me/ me/favorites/     # 登录后可见
│  ├─ layout.tsx            # 全局布局：导航、播放器 Provider
│  ├─ globals.css           # Tailwind 4 + 设计变量
│  ├─ not-found.tsx / error.tsx
│  ├─ robots.ts / sitemap.ts
├─ components/
│  ├─ layout/               # 头部、底部、导航
│  ├─ player/               # 播放台、队列、进度
│  ├─ auth/                 # 登录 / 注册表单
│  ├─ sound-card.tsx        # 声音卡片（封面兜底、统计）
│  ├─ favorite-button.tsx
│  └─ section-rail.tsx / empty-state.tsx
├─ lib/
│  ├─ db.ts / db-config.ts  # Knex 单例与连接配置
│  ├─ queries/              # 服务端查询（sounds / categories / favorites）
│  ├─ actions/              # Server Actions（auth / favorites）
│  ├─ auth.ts               # getSessionUser / requireUser
│  ├─ validation.ts / rate-limit.ts
│  ├─ player-context.tsx    # 全局播放器状态
│  ├─ types.ts / constants.ts / utils.ts / image-loader.ts
├─ db/schema.sql            # 建表 DDL（幂等）
├─ scripts/                 # db-init / seed / scrape / env
├─ data/live-sounds.json    # 种子/抓取数据（约 180 条）
├─ deploy/                 # k8s 清单、Secret 模板、部署与回滚指南
├─ tests/                  # 单元测试 + smoke 报告
├─ legacy/                 # 旧版归档（不参与构建）
├─ Dockerfile / docker-compose.yml / .dockerignore
└─ next.config.ts           # standalone、image loader 等
```

## 数据与数据库

- 数据表：`lab_category`（分区/分类）、`lab_music`（声音条目）、`lab_user`（账号）、`lab_favorite`（收藏，`(uid, music_id)` 唯一）。
- `db/schema.sql` 只含 DDL，全部 `CREATE TABLE IF NOT EXISTS`，可反复执行。
- `scripts/db-init.ts` 建表后 upsert 6 个分类（ASMR / VOCALOID / 轻音乐 / 有声书 / 音乐-其他 / 杂谈）。
- `scripts/seed.ts` 读取 `data/live-sounds.json` 写入曲目，再创建 `demo/demo1234` 与 4 条示例收藏；全部使用 `onConflict().ignore()/merge()`，重复执行安全。生产环境默认拒绝执行，需显式 `ALLOW_PROD_SEED=1`。
- 站点中封面与音频走 `OSS_BASE_URL`（默认阿里云 OSS bucket），空封面由 `COVER_FALLBACKS` 渐变兜底。

## 设计方向

暖白唱片店（纸张 `#f7f3ec`、墨色 `#1c1917`、珊瑚 `#ff5a3c`、紫罗兰 `#7c6cf0`、描边 `#e5ddd0`、大圆角 24–32）搭配深夜播放台（`#0b0a0f`）；衬线标题、移动优先 375px、桌面 `max-w-7xl` 居中。播放器页采用深色以"关灯听声音"。

## 测试与 QA

```bash
pnpm typecheck    # 类型
pnpm lint         # 规范
pnpm build        # 生产构建
pnpm test         # tests/*.test.ts
```

端到端 smoke（生产模式起服务后逐条 curl 关键路由、检查重定向与健康接口）的结果记录在 [`tests/smoke/report.md`](./tests/smoke/report.md)，包含命令、HTTP 状态与失败项。

## 部署

生产环境是 k3s（双节点） + 内网 registry + 外部 nginx；完整步骤、Secret 创建、滚动发布、数据库迁移与回滚见 **[`deploy/README.md`](./deploy/README.md)**。

```bash
# 构建（Apple Silicon 上要显式 --platform linux/amd64）
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://acgay.cn \
  -t 172.24.173.77:30500/node-web:$(git rev-parse --short HEAD) .

# 发布（CI 或人工）
kubectl set image deployment/node-web node-web=172.24.173.77:30500/node-web:<sha>
kubectl rollout status deployment/node-web
```

注意：`NEXT_PUBLIC_*` 是**构建期内联**的，换域名必须重新构建镜像；运行时 Secret 只影响服务端。

## legacy/ 归档

`legacy/` 保存重构前的单页应用（Express + fish-route 单页应用 + 旧 Dockerfile、`k8s.yaml`、`Makefile`），仅作迁移对照与视觉参考，已在 `.gitignore` 中忽略、不参与新项目构建。旧部署的 NodePort/registry 做法可以在 `deploy/README.md` 的“不用 Ingress”一节找到对应说明。

## 已知约定

- 不提交 `.env.local` / `.env` 与任何密钥；k8s Secret 只存在于集群（模板见 `deploy/secret.example.yaml`）。
- 数据库操作全部走 Knex 参数化查询，禁止字符串拼接 SQL。
- `app/music/play` 只做重定向，真正的播放态由全局播放器 Provider 维护。
