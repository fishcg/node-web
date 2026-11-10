# Multi-stage build for the Next.js standalone server.
#
#   docker build -t acgay/node-web:2.0.0 .
#   docker run --rm -p 3000:3000 --env-file .env.local acgay/node-web:2.0.0
#
# The runtime image only contains .next/standalone, .next/static and public,
# so it stays small and does not need pnpm or dev dependencies at runtime.

# ---------------------------------------------------------------------------
# base: Node 24 + the pnpm version pinned in package.json
# ---------------------------------------------------------------------------
FROM node:24-alpine AS base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=1

# corepack ships with Node 24; pin the exact pnpm release used locally.
# Keep the pnpm store at /pnpm/store so the BuildKit cache mount below works.
RUN corepack enable && corepack install --global pnpm@10.26.2 \
    && pnpm config set store-dir /pnpm/store

WORKDIR /app

# ---------------------------------------------------------------------------
# deps: install dependencies from the lockfile only (best layer caching)
# ---------------------------------------------------------------------------
FROM base AS deps

# libc6-compat keeps the prebuilt binaries (if any) happy on musl.
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# builder: compile the Next.js app (output: "standalone")
# ---------------------------------------------------------------------------
FROM base AS builder

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so the
# public URL has to be known here. Override with --build-arg in production.
ARG NEXT_PUBLIC_SITE_URL=https://acgay.cn
ARG OSS_BASE_URL=https://acgay.oss-cn-hangzhou.aliyuncs.com

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    OSS_BASE_URL=$OSS_BASE_URL \
    NODE_ENV=production

# `public/` is optional in this repo; make sure the COPY below always works.
RUN mkdir -p public && pnpm build

# ---------------------------------------------------------------------------
# runner: minimal runtime, non-root user
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# Static assets are not traced by the standalone output and must be copied.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Works with plain `docker run` too; k8s overrides it with HTTP probes.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
