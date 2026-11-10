# 部署指南（Docker / Compose / k3s）

本地开发请看根目录 [README.md](../README.md)。本目录只关心生产部署，所有命令默认在仓库根目录执行。

> 本仓库**不包含**任何真实密钥；Secret 只在集群里创建，或使用未纳入 git 的 `deploy/secret.yaml`。

## 目录

- [`k8s.yaml`](./k8s.yaml)：Deployment（2 副本）+ Service + PodDisruptionBudget + Ingress（可选）
- [`secret.example.yaml`](./secret.example.yaml)：Secret 模板（填好后不要提交）
- [`.gitignore`](./.gitignore)：忽略 `secret.yaml`

## 1. 构建镜像

```bash
# 短 SHA 作为镜像 tag，回滚时"线上跑的哪一版"一目了然
TAG=$(git rev-parse --short HEAD)
REGISTRY=172.24.173.77:30500

# k3s 节点是 x86_64，Apple Silicon 上必须显式指定平台
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://acgay.cn \
  --build-arg OSS_BASE_URL=https://acgay.oss-cn-hangzhou.aliyuncs.com \
  -t "$REGISTRY/node-web:$TAG" .
```

`NEXT_PUBLIC_*` 会在 **构建时** 内联进客户端产物，改运行环境变量不会生效；
`depoloy/k8s.yaml` 里运行时的 `NEXT_PUBLIC_SITE_URL` 只影响服务端渲染的部分。
`OSS_BASE_URL` 同理：服务端渲染需要它，构建时也建议传一致的值。

Dockerfile 使用 Next.js `output: "standalone"`，运行镜像只包含
`.next/standalone`、`.next/static` 与 `public`，以非 root 用户 `nextjs:1001` 运行，
监听 `0.0.0.0:3000`。本地验证镜像：

```bash
docker run --rm -p 3000:3000 --env-file .env.local "$REGISTRY/node-web:$TAG"
curl -fsS http://localhost:3000/api/health   # {"ok":true}
```

## 2. 推送镜像

```bash
docker push "$REGISTRY/node-web:$TAG"
```

如果集群把内网仓库配置为 insecure registry，节点上需要在
`/etc/rancher/k3s/registries.yaml` 里登记；仓库开了鉴权则先创建 pull secret，
并在 `deploy/k8s.yaml` 中取消 `imagePullSecrets` 的注释。

## 3. 数据库准备、迁移与种子

生产使用 MySQL 8.0 + `utf8mb4`。首次准备：

```sql
CREATE DATABASE acgay DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'acgay'@'%' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON acgay.* TO 'acgay'@'%';
```

迁移与种子脚本依赖 `devDependencies` 里的 `tsx`，**不在运行镜像内**，
因此用一台能连到数据库的机器执行；集群内数据库先做端口转发：

```bash
kubectl port-forward svc/mysql 3306:3306
```

然后：

```bash
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=acgay DB_PASSWORD='<strong-password>' DB_NAME=acgay
pnpm install --frozen-lockfile
pnpm db:init      # 建表（幂等）+ 分类数据 upsert
pnpm db:seed      # data/live-sounds.json 的曲目 + demo 用户（幂等）
```

注意事项：

- `db/schema.sql` 只有 DDL，全部是 `CREATE TABLE IF NOT EXISTS`，可以重复执行；
  连接 Compose 的 MySQL 时用 `DB_PORT=3307`。
- `scripts/seed.ts` 在 `NODE_ENV=production` 时默认拒绝执行；确实要在生产演示环境
  灌种子数据，需显式 `ALLOW_PROD_SEED=1`。
- 迁移原则：**只做向后兼容的新增**（新表 / 新列 / 新索引）。删列、改类型必须拆成
  "扩展 → 回填 → 收缩" 多次发布，否则滚动发布期间新旧 Pod 会同时读同一份 schema。

## 4. 创建 Secret

```bash
kubectl create secret generic node-web-secret \
  --from-literal=DB_HOST=mysql.default.svc.cluster.local \
  --from-literal=DB_PORT=3306 \
  --from-literal=DB_USER=acgay \
  --from-literal=DB_PASSWORD='<strong-password>' \
  --from-literal=DB_NAME=acgay \
  --from-literal=SESSION_SECRET="$(openssl rand -hex 32)" \
  --from-literal=OSS_BASE_URL=https://acgay.oss-cn-hangzhou.aliyuncs.com \
  --from-literal=NEXT_PUBLIC_SITE_URL=https://acgay.cn
```

- 键名大小写敏感，必须与 `k8s.yaml` 的 `secretKeyRef.key` 完全一致。
- `SESSION_SECRET` 必须是 **≥ 32 字符** 的随机串（`openssl rand -hex 32` 得到 64 字符）。
- 修改 Secret 后必须重启 Pod 才会生效：

```bash
kubectl rollout restart deployment/node-web
```

## 5. 首次部署

```bash
kubectl apply -f deploy/k8s.yaml
kubectl rollout status deployment/node-web --timeout=180s
kubectl get pods -l app=node-web
kubectl get ingress node-web
```

验证：

```bash
curl -i https://acgay.cn/api/health          # 200 {"ok":true}
curl -I https://acgay.cn/                     # 200
```

## 6. 滚动发布（零停机）

`k8s.yaml` 的策略：2 副本、`maxSurge: 1`、`maxUnavailable: 0`，
再加 `preStop: sleep 5` 和 `/api/health` 就绪探针，保证新 Pod Ready 之后才摘旧 Pod。

日常发布只改镜像 tag（CI 里也是这一步）：

```bash
kubectl set image deployment/node-web \
  node-web=172.24.173.77:30500/node-web:$TAG
kubectl rollout status deployment/node-web --timeout=180s
```

发布后确认线上真的跑的是本次提交：

```bash
kubectl get deploy node-web -o jsonpath='{.spec.template.spec.containers[0].image}'; echo
```

健康检查本身不缓存（`/api/health` 每次 `select 1`）；就绪探针失败会自动把 Pod 从
Service endpoints 摘掉，但**不会**重启它（存活探针只探端口，避免 MySQL 抖动引发重启风暴）。

## 7. 回滚

```bash
kubectl rollout history deployment/node-web
kubectl rollout undo deployment/node-web                 # 回到上一版
kubectl rollout undo deployment/node-web --to-revision=3 # 回到指定版本
kubectl rollout status deployment/node-web --timeout=180s
```

也可以直接把镜像 tag 改回上一个已知good版本（`revisionHistoryLimit: 5` 保留 5 个历史版本）。

**回滚只回代码，不回数据库。** 如果本次发布包含不可逆的 DDL，代码回滚后数据仍可能是新结构；
这正是上面要求"只做向后兼容新增"的原因。需要回退数据时，按备份恢复演练执行。

## 8. 可选：不用 Ingress（外部 nginx / NodePort 范式）

如果集群前面已经有独立 nginx（或使用 NodePort + 反向代理），把 `k8s.yaml` 里的
Ingress 整段删除，并把 Service 改成 NodePort：

```bash
kubectl delete ingress node-web
kubectl patch service node-web -p '{"spec":{"type":"NodePort"}}'
kubectl get svc node-web   # 取 30000-32767 之间的 nodePort 填到 nginx upstream
```

NodePort 请先在集群里确认端口未被占用，别和其它站点撞车。

## 9. 排障

| 现象 | 排查 |
| --- | --- |
| `ImagePullBackOff` | registry 地址 / insecure registry 配置 / `imagePullSecrets` |
| Pod Ready 一直 `0/1` | `kubectl describe pod` + `kubectl logs`；`/api/health` 返回 503 说明连不上 DB |
| `CrashLoopBackOff` | 多半是 `SESSION_SECRET` 缺失或长度不足 32；`kubectl logs --previous` 看启动错误 |
| Ingress 502 | Service `targetPort`/端口名与容器 `containerPort` 不一致 |
| 页面显示 localhost 链接 | 构建时没传 `NEXT_PUBLIC_SITE_URL`，需要重新构建镜像 |
| 时间差 8 小时 | 容器 `TZ=Asia/Shanghai`；连接时区在 `lib/db-config.ts` 固定为 `+08:00` |

## 10. 上线红线

1. 密钥只进 Secret，不进 ConfigMap、不进 git、不进镜像。
2. 镜像 tag 用提交短 SHA，不用 `latest`。
3. 数据库迁移/种子**不要**塞进容器启动命令——多副本会并发执行。
4. 本指南里的 `docker push` / `kubectl apply` 都需要人工确认后再执行。
