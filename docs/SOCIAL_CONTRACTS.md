# Social / submissions contracts (v1)

Foundation already in place: `lib/types.ts` types, `lab_user.role`, `lab_music.status` (0 pending / 1 approved / 2 rejected), `review_reason`, `reviewed_by`, `reviewed_at`, `lab_follow`, `lab_message`, `lab_notification`. Migration: `db/migrations/002_social.sql`.

All new code must use `import "server-only"` for DB/query modules, Knex (`@/lib/db`), `assetUrl()` for display URLs, and the existing zinc/cream design tokens. Do not add dependencies without Lead approval.

## backend-social (owner: backend)

Create:

### `lib/queries/social.ts`

```ts
getPublicUser(id: number): Promise<PublicUser | null>
getUserProfile(targetId: number, viewerId: number | null):
  Promise<UserProfile | null>            // counts follow/following/approved sounds + isFollowing/isSelf
getApprovedSoundsByUser(uid: number, limit = 12): Promise<Sound[]>
getConversations(userId: number): Promise<ConversationSummary[]>
getConversationMessages(viewerId: number, otherId: number): Promise<ChatMessage[]>
getNotifications(userId: number, limit = 30): Promise<NotificationItem[]>
getUnreadCounts(userId: number): Promise<UnreadCounts>
markConversationRead(viewerId: number, otherId: number): Promise<void>
markAllNotificationsRead(userId: number): Promise<void>
isFollowing(followerId: number, followingId: number): Promise<boolean>
```

`getConversations` returns the latest message per other participant, ordered newest first, with unread count of messages from the other user. `getConversationMessages` returns both directions ordered ascending and marks nothing (mark is separate). `getNotifications` newest first, max 30. Sound query: status=1 only, join category, photo/url via `assetUrl`.

### `lib/actions/social.ts` (`"use server"`)

```ts
export interface SocialFormState { error?: string }
toggleFollowAction(_prev: SocialFormState, formData: FormData): Promise<SocialFormState>
sendMessageAction(_prev: SocialFormState, formData: FormData): Promise<SocialFormState>
markNotificationsReadAction(): Promise<void>
```

- `toggleFollowAction`: requires session; `targetId` int; reject self; insert/delete `lab_follow`; `revalidatePath('/u/'+targetId)` + `/me`; return `{}`. Never throw for duplicate.
- `sendMessageAction`: requires session; `receiverId` int, `body` 1-1000 chars; reject self; insert; revalidate `/messages` and `/messages/receiverId`; `redirect('/messages/'+receiverId)` after revalidate.
- `markNotificationsReadAction`: requires session; set `read_at` for all uid rows; revalidate `/me/notifications` and `/api/unread`; no redirect.

### `app/api/unread/route.ts`

`GET` returns `{ notifications: number, messages: number }` (anonymous → both 0). `export const dynamic = "force-dynamic";` and `Cache-Control: no-store`. Use `getSessionUser()` and `getUnreadCounts`.

### ownership
Only these three paths + `tests/backend/social.test.ts`. Do not touch UI pages, `lib/types.ts`, `lib/auth.ts`, schema.

## submission-admin (owner: submission-admin)

Create:

### `lib/oss.ts`
Server-only `ali-oss` client. Env: `OSS_BUCKET`, `OSS_REGION`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`; default bucket `acgay`, region `oss-cn-hangzhou`. `uploadFile(file: File, kind: "sound"|"cover", uid: number): Promise<string>` stores `sound/uploads/YYYY/MM/<uid>-<random>.<ext>` or `cover/uploads/...`, returns relative path (no leading slash). 100MB audio / 5MB cover limits enforced in route.

### `lib/queries/submissions.ts`
```ts
getMySubmissions(uid: number): Promise<Submission[]>
getSubmissionById(id: number): Promise<Submission | null>
getPendingSubmissions(): Promise<SubmissionWithUser[]>
countPendingSubmissions(): Promise<number>
```
Only owner sees own pending/rejected; admin pages use pending. Map status 0/1/2 to `pending/approved/rejected`.

### `lib/actions/admin.ts` (`"use server"`)
```ts
approveSubmissionAction(formData: FormData): Promise<void>
rejectSubmissionAction(formData: FormData): Promise<void>
```
- `requireAdmin()`; id from form; fetch; if status !== 0 no-op.
- approve: status=1, review fields; notification title `投稿已通过`, body `《subject》已通过审核，现在可以播放了。`, link `/sound/{id}`, type `submission`.
- reject: status=2, review_reason from textarea 1-500 chars; notification title `投稿未通过`, body `《subject》未通过审核：{reason}`, link `/me/submissions`, type `submission`.
- `revalidatePath("/admin/reviews")`, `/admin`, `/me/submissions`, `/sound/{id}`; `redirect("/admin/reviews?done=1")`.

### `app/api/submissions/route.ts` (POST multipart)
- `getSessionUser()`; 401 if absent. Rate limit `submission:${uid}` 5/hour via existing `checkRateLimit`; 429 JSON.
- Fields: subject 2-100, summary ≤1000, author ≤64, categoryId 100-105, audio File (≤100MB, `audio/*`), cover optional (≤5MB, `image/jpeg|png|webp`). Use zod.
- Upload via `lib/oss.ts`; insert `lab_music` with uid, category, subject, summary, author, url, photo, status=0. Return `{ ok: true, id }`; JSON error `{ ok:false, error }` with appropriate status.
- `export const runtime = "nodejs"; export const dynamic = "force-dynamic";`

### Pages/components
- `app/submit/page.tsx`: `requireUser`, load categories, render `SubmissionForm`; hero copy + note “投稿后需审核，通过后才能播放”.
- `components/submission-form.tsx`: client; fields/title/summary/category/author/audio/cover; file accept; client-side size check; POST fetch; success message + link `/me/submissions`; errors readable.
- `app/admin/layout.tsx`: `requireAdmin`; sidebar/topbar to `/admin`, `/admin/reviews`, back to site.
- `app/admin/page.tsx`: pending count + quick link.
- `app/admin/reviews/page.tsx`: pending list, empty state.
- `app/admin/reviews/[id]/page.tsx`: preview audio `<audio controls src={assetUrl(url)}>`, cover, submitter, category, summary; approve form + reject form (textarea reason).
- `components/admin/*`: small status badge/action forms.

### ownership
These paths + `tests/backend/submissions.test.ts`. Do not touch `lib/types.ts`, `lib/auth.ts`, schema, social files.

## social-ui (owner: site-ui, start after backend+submission)

- `app/u/[id]/page.tsx`: profile hero, avatar/username/role, counts, approved sound grid (SoundCard), follow button (client `useActionState(toggleFollowAction)`), “发私信” link, own profile self view.
- `app/messages/page.tsx`: conversation list, unread dot/count, empty state; link to `/messages/[id]`.
- `app/messages/[id]/page.tsx`: `requireUser`; other user header; messages bubbles; client form `useActionState(sendMessageAction)` with textarea + submit; mark read (server-side `markConversationRead` at page load is acceptable); back link.
- `app/me/notifications/page.tsx`: list title/body/time/link; unread style; “全部标为已读” form action; empty state.
- `app/me/submissions/page.tsx`: own submissions; status labels “待审核/已通过/未通过”; reject reason in red callout; approved links to `/sound/[id]`; note.
- `components/unread-badges.tsx`: client; fetch `/api/unread` on mount + every 30s; render compact badges for notifications + messages; accepts `initial` counts; hide when 0.
- Modify `components/layout/header.tsx`: when logged in show notification + messages icons with badges; admin link for role admin; keep mobile fit (hide bell on <sm, messages icon remains; avatar/menu).
- Modify `components/layout/mobile-nav.tsx`: add a “消息” entry or badge on 我的 tab; don't break 4-column fit.
- Modify `app/me/page.tsx`: quick links to 投稿 / 我的投稿 / 消息 / 通知; counts.
- Use existing `EmptyState`, `SoundCard`, `formatDate`, `CoverFallback`; no new deps.

## acceptance
- `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.
- Local MySQL migration applied; demo user can submit (audio upload to OSS), sees pending; admin sees pending, reject with reason; user sees notification + reason; approve makes it playable; follow/unfollow persists; DM sends and unread badges update; anonymous cannot access admin or APIs.
- Mobile 390 no horizontal overflow.
