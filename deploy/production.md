# 生产部署记录（2026-11-10）

## 线上地址

- **https://www.acgay.cn**（`acgay.cn` 目前没有 DNS 记录，统一用 `www`）
- 旧站未删除，仍以独立 Deployment 运行，可随时回滚流量。

## 当前拓扑

| 组件 | 位置 / 名称 |
| --- | --- |
| k3s 控制面 | node0 `120.27.204.155`（内网 `172.24.173.77`） |
| nginx / 证书 / MySQL | node1 `47.97.156.213`（内网 `172.24.173.76`） |
| 新应用 | Deployment `node-web-next`，1 副本，容器端口 8989 |
| 新应用镜像 | `172.24.173.77:30500/node-web:social-20261110-2015`（社交功能 + 时区修复） |
| 代码提交 | `ffbe9e5`（分支 `rebuild/nextjs`，已 push GitHub） |
| 新应用 Service | `node-web-next-service`，NodePort **30190** |
| 旧应用（保留） | Deployment `node-web`，Service `node-web-service`，NodePort 30089 |
| 生产数据库 | node1 Docker 容器 `test_mysql`（3307→3306），库 `acgay`，用户 `acgay_app` |
| k8s Secret | `node-web-secret`（DB、SESSION_SECRET、OSS/SITE URL；2026-11-10 补 `OSS_BUCKET`/`OSS_REGION`/`OSS_ACCESS_KEY_ID`/`OSS_ACCESS_KEY_SECRET`） |
| nginx 配置 | `/etc/nginx/conf.d/default.conf`，`proxy_pass localhost:30190` |

## 数据

- 旧库 `fish` 未改动；切换前备份：`/root/backups/fish-lab-20261110.sql`。
- 新库 `acgay`：500 条声音（ASMR 96 / VOCALOID 78 / 轻音乐 62 / 有声书 3 / 音乐-其他 261），6 个分类。
- 切换后备份：`/root/backups/acgay-20261110.sql`；社交功能上线前备份：`/root/backups/acgay-20261110-social.sql`。
- 2026-11-10 已执行 `db/migrations/002_social.sql`：`lab_user.role`、`lab_music.status/review_reason/reviewed_by/reviewed_at`，以及 `lab_follow`、`lab_message`、`lab_notification` 三张表。迁移在执行前已校验 information_schema；MySQL 不支持 `ADD COLUMN IF NOT EXISTS`，重跑前需先确认列/索引不存在。
- 生产账号：仅 `admin`（管理员，id 3）；管理员密码只在运维侧保管，不写入仓库。旧数据 `uid` 已统一归零；早期测试账号 `fish` 已删除。
- 社交功能上线 QA 的测试用户、投稿、关注、私信、通知与 OSS 测试对象已全部清理。
- 迁移时已排除 `id=402` 的畸形外链、`id=603/604` 的 `/tem/` 与 test 行；旧 `status=0` 的 498 条已置为 1（旧站本身也未按 status 过滤，视觉目录保持一致）；外站 missevan 封面置空，由前端渐变 + 耳机图标兜底。

## 社交功能与上传

- `/submit` 投稿：音频 ≤100MB、封面 ≤5MB（JPEG/PNG/WebP），文件上传到 OSS `sound/uploads/YYYY/MM/` 与 `cover/uploads/YYYY/MM/`；`/admin/reviews` 审核通过后才会公开，驳回必须填写原因（≤500 字）。
- `/messages` 私信、`/me/notifications` 通知、`/u/[id]` 关注；未读数由 `/api/unread` 提供，前端每 30s 轮询并支持 `acgay:unread-refresh` 事件即时刷新。
- 生产 nginx 已配置 `client_max_body_size 200M`，大于应用层 100MB 上限，上传不需要再改 nginx。
- Knex 连接池在 `afterCreate` 中执行 `SET time_zone = '+08:00'`（`lib/db-config.ts`），保证 `CURRENT_TIMESTAMP` 写库为中国时间；生产 `test_mysql` 容器本身仍是 UTC，查询时看到的会话 `NOW()` 可能比北京时间慢 8 小时，以应用写入值为准。

## 回滚

流量回滚（最快，约 1 分钟）：

```bash
ssh root@47.97.156.213
cp /root/nginx-default.conf.bak-20261110 /etc/nginx/conf.d/default.conf
nginx -t && systemctl reload nginx
curl -s https://www.acgay.cn/ | head
```

旧应用 `node-web` 与 NodePort 30089 一直在线，因此回滚只改 nginx 上游，不涉及数据库。

应用回滚（新应用内部）：

```bash
kubectl -n default set image deployment/node-web-next web=172.24.173.77:30500/node-web:<previous-tag>
kubectl -n default rollout status deployment/node-web-next
```

## 构建与发布

内网 registry `172.24.173.77:30500` 对 Mac 不可直连，当前在 node1 上构建：

```bash
# node1
cd /root/node-web-build
DOCKER_BUILDKIT=1 docker build \
  --build-arg NODE_IMAGE=172.24.173.77:30500/node:24.13.0-alpine \
  --build-arg APK_MIRROR=mirrors.aliyun.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://www.acgay.cn \
  --build-arg OSS_BASE_URL=https://acgay.oss-cn-hangzhou.aliyuncs.com \
  -t node-web:<tag> .
docker tag node-web:<tag> 172.24.173.77:30500/node-web:<tag>
docker push 172.24.173.77:30500/node-web:<tag>

# node0
kubectl -n default set image deployment/node-web-next web=172.24.173.77:30500/node-web:<tag>
kubectl -n default rollout status deployment/node-web-next
```

注意：`ARG APK_MIRROR` 必须在每个使用它的构建阶段重新声明（Dockerfile 已处理）；`NODE_IMAGE` 由 Dockerfile 顶部 `ARG NODE_IMAGE=node:24-alpine` 提供，生产构建传入内网 registry 的 `node:24.13.0-alpine`；`NEXT_PUBLIC_SITE_URL` 在构建期内联，改域名必须重新构建。

镜像标签：`social-20261110-2015`（最终上线）；`social-20261110-2010` 是同一代码在时区修复前的构建，已弃用，不要回滚到它。上一个稳定版本为 `080101a`。
