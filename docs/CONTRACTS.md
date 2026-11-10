# 重构契约（所有 teammate 必读）

项目：`/Users/fish/Documents/M/www/node-web`，Next.js 16.4.6 App Router + TS + Tailwind 4。
旧代码已归档到 `legacy/`，**不要从 legacy import**，也不要修改 `legacy/`。
本地 MySQL 容器 `acgay-mysql` 已运行，数据库 `acgay`（user/password 见 `.env.local`），
已有 `lab_category` 6 行、`lab_music` 173 行、demo 用户 `demo / demo1234`、4 条收藏。
启动：`pnpm dev`（端口 3000）。检查：`pnpm typecheck`、`pnpm lint`、`pnpm build`。

## 视觉方向（已由 Lead 定稿，按此实现）

「暖白唱片店 + 深夜播放台」：
- 首页/列表：暖纸白 `#f7f3ec` 背景、ink `#1c1917`、珊瑚橙 `#ff5a3c`、雾紫 `#7c6cf0`。
- 播放页：深墨 `#0b0a0f`，封面模糊光晕，玻璃质感控制条。
- 标题用衬线（`font-serif`：Songti SC / Noto Serif SC），正文无衬线；大圆角 24-32px；细边框 `#e5ddd0`；不要用蓝紫渐变模板感。
- 移动优先：375px 起可读，底部 tab bar + mini player；桌面 `max-w-7xl`。
- 封面比例统一 `aspect-[4/3]` 或 `aspect-square`，用 `object-cover`；无封面时用 `COVER_FALLBACKS` 渐变 + 首字。
- 动效克制：hover 轻微上浮/缩放，`prefers-reduced-motion` 下关闭。

## 共享模块（Lead 已写好，可读但不要改）

- `lib/types.ts`：`Sound`、`PlayerTrack`、`SessionUser`、`PagedResult<T>`、`SectionSlug`。
- `lib/constants.ts`：`SITE`、`SECTIONS`、`SECTION_BY_SLUG`、`CATEGORY_LABELS`、`NAV_LINKS`、`PAGE_SIZE`、`COVER_FALLBACKS`。
- `lib/utils.ts`：`cn`、`assetUrl`、`ossImage`、`formatViews`、`formatDate`、`formatDuration`、`truncate`、`safeNextPath`。
- `lib/db.ts`（server only）、`lib/image-loader.ts`（next/image 自定义 loader）。
- `db/schema.sql`、`scripts/*`：已可跑 `pnpm db:init` / `pnpm db:seed` / `pnpm scrape`。

## 路由与页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页：hero + 精选 + 分区 rails + 继续收听 |
| `/category/[slug]` | slug 只允许 `asmr` `music` `audiobook` `talk`；?page= 分页 |
| `/search?q=` | 搜索 subject/author，分页 |
| `/sound/[id]` | 播放详情（深色沉浸） |
| `/music/play?id=` | 301/redirect 到 `/sound/[id]`，保持旧链接 |
| `/login` `/register` | 登录注册，表单 server action + `useActionState` |
| `/logout` | 仅 POST server action；登录页不要 GET 链接 |
| `/me` | 我的：资料、收藏数、最近收藏 |
| `/me/favorites` | 我的收藏，分页 |
| `/api/health` | GET 返回 `{ok:true}`，检查 DB |
| `not-found.tsx` / `error.tsx` | 404/500 品牌页 |

`/login?next=/me/favorites` 登录后回跳；`next` 必须用 `safeNextPath` 过滤。

## 后端契约（backend 负责实现）

`lib/queries/sounds.ts`（加 `import "server-only"`）：
```ts
getHomeData(): Promise<{
  featured: Sound[]; newest: Sound[]; sections: Record<SectionSlug, Sound[]>;
  totalSounds: number; totalCategories: number;
}>
getSectionPage(slug: SectionSlug, page: number): Promise<PagedResult<Sound>>
searchSounds(query: string, page: number): Promise<PagedResult<Sound>>
getSoundById(id: number): Promise<Sound | null>
getRelatedSounds(sound: Sound, limit?: number): Promise<Sound[]>
getFavoriteSounds(uid: number, page: number): Promise<PagedResult<Sound>>
getFavoriteIds(uid: number): Promise<Set<number>>
getCategories(): Promise<Category[]>
```
`lib/auth.ts`（`server-only`）：
```ts
getSessionUser(): Promise<SessionUser | null>
requireUser(nextPath?: string): Promise<SessionUser> // 未登录 redirect(`/login?next=...`)
```
`lib/actions/favorites.ts`：
```ts
export type ToggleFavoriteResult = { ok: true; favorited: boolean } | { ok: false; reason: "auth" | "error" };
export async function toggleFavoriteAction(soundId: number): Promise<ToggleFavoriteResult>
```
`lib/actions/auth.ts`：`loginAction` / `registerAction` / `logoutAction`，签名兼容 `useActionState`：
`(prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>`；成功时 `redirect(next)`。
`AuthFormState = { error?: string; fieldErrors?: Record<string, string>; values?: { username?: string } }`。

实现细节：
- Knex 参数化查询；联表 `lab_category` 拿 `categorySlug/categoryName/section`。
- `created` 是字符串；`photo`/`url` 用 `assetUrl()` 转绝对 URL；无图返回空串。
- 排序用 `created desc, id desc`；不要 `ORDER BY RAND()`。
- `getHomeData` 的 sections 每个取 `HOME_RAIL_SIZE` 条；空分区返回 `[]`。
- 收藏用唯一键 `(uid,music_id)`，`onConflict(...).ignore()` 防重复。
- 所有 server action 内重新鉴权、zod 校验；错误信息不泄露账号是否存在。
- 密码 bcrypt 12；登录成功 `session.userId/username` 后 `session.save()`。
- 登录限流：内存 Map，IP + 用户名，10 分钟 10 次；注册 1 小时 5 次（足够 demo）。

## 共享 UI / 组件归属

- **site-ui**：`app/layout.tsx`、`app/globals.css`、`app/page.tsx`、`app/category/**`、`app/search/**`、`app/me/**`、`app/not-found.tsx`、`app/error.tsx`、`components/layout/**`、`components/sound-card.tsx`、`components/section-rail.tsx`、`components/empty-state.tsx`、`components/favorite-button.tsx`（client）。
- **player**：`app/sound/**`、`app/music/play/**`、`components/player/**`、`lib/player-context.tsx`、`components/player/play-button.tsx`。
- 依赖方向：layout 引 `components/layout/header`、`components/player/player-provider` + `mini-player`；site-ui 与 player 都可用 `components/sound-card.tsx`、`components/favorite-button.tsx`、`lib/player-context.tsx`。
- **不要**修改别人 scope 内文件；需要接口变更先发消息给 Lead。
- `FavoriteButton` props：`{ musicId: number; initialFavorited: boolean; className?: string; size?: "sm"|"md" }`，未登录点击跳 `/login?next=`。
- `SoundCard` props：`{ sound: Sound; favorited?: boolean; priority?: boolean; variant?: "grid"|"rail" }`，卡片内播放按钮用 player 的 `PlayButton`。
- Player context 导出：`usePlayer()`，字段 `current: PlayerTrack | null`、`isPlaying`、`play(track, queue?)`、`toggle()`、`seek()`, `progress` 等；`PlayButton` props `{ track: PlayerTrack; className?: string; label?: string }`。
- 首页「继续收听」：localStorage key `acgay:recent`，存 `PlayerTrack[]`（最多 6 条），用 client component 渲染。

## 数据结构

`Sound`：`id subject summary author url photo created views replies categoryId categorySlug categoryName section top`。
分类：100 ASMR→asmr、101/102/104→music、103→audiobook、105→talk。
`/category/[slug]` 按 `lab_category.section = slug` 聚合。

## 验收

- `pnpm typecheck`、`pnpm lint`、`pnpm build` 全绿。
- 首页/分区/搜索/播放/登录/注册/收藏在 375px 与 1440px 均可操作。
- 登录 demo 后收藏切换、刷新保持；未登录点收藏跳登录并回跳。
- 播放音频使用真实 OSS `audio/mpeg`；切页不断播（根 layout 的 audio 元素）。
- 截图/验收报告由 infra QA 收集。
