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
| 新应用镜像 | `172.24.173.77:30500/node-web:080101a` |
| 新应用 Service | `node-web-next-service`，NodePort **30190** |
| 旧应用（保留） | Deployment `node-web`，Service `node-web-service`，NodePort 30089 |
| 生产数据库 | node1 Docker 容器 `test_mysql`（3307→3306），库 `acgay`，用户 `acgay_app` |
| k8s Secret | `node-web-secret`（DB、SESSION_SECRET、OSS/SITE URL） |
| nginx 配置 | `/etc/nginx/conf.d/default.conf`，`proxy_pass localhost:30190` |

## 数据

- 旧库 `fish` 未改动；切换前备份：`/root/backups/fish-lab-20261110.sql`。
- 新库 `acgay`：500 条声音（ASMR 96 / VOCALOID 78 / 轻音乐 62 / 有声书 3 / 音乐-其他 261），6 个分类，`lab_user` 初始为空。
- 切换后备份：`/root/backups/acgay-20261110.sql`。
- 迁移时已排除 `id=402` 的畸形外链、`id=603/604` 的 `/tem/` 与 test 行；旧 `status=0` 的 498 条已置为 1（旧站本身也未按 status 过滤，视觉目录保持一致）；外站 missevan 封面置空，由前端渐变 + 耳机图标兜底。

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

注意：`ARG APK_MIRROR` 必须在每个使用它的构建阶段重新声明（Dockerfile 已处理）；`NEXT_PUBLIC_SITE_URL` 在构建期内联，改域名必须重新构建。
