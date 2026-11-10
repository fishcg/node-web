#!/usr/bin/env bash
# 生产构建 smoke 检查：对已启动的 `pnpm start` 逐条发请求并输出 Markdown 结果表。
#
#   pnpm build && pnpm start &          # 另开一个终端也行
#   tests/smoke/smoke.sh                # 默认 http://127.0.0.1:3000
#   tests/smoke/smoke.sh http://127.0.0.1:3100
#
# 退出码：全部通过为 0，否则为 1（方便 CI / 手动判断）。
set -u

BASE="${1:-http://127.0.0.1:${PORT:-3000}}"
PASS=0
FAIL=0

red() { printf '\033[31m%s\033[0m' "$1"; }
green() { printf '\033[32m%s\033[0m' "$1"; }

# 打印表头
printf '| # | 检查 | 请求 | 状态 | 结果 | 说明 |\n'
printf '| --- | --- | --- | --- | --- | --- |\n'

# check <名称> <path> <期望状态码(空格分隔)> [重定向目标前缀]
check() {
  local name="$1" path="$2" expected="$3" redirect_expect="${4:-}"
  local headers body code loc ok=1 note=""
  headers=$(mktemp)
  body=$(mktemp)

  code=$(curl -sS --max-time 15 -o "$body" -D "$headers" -w '%{http_code}' "$BASE$path" 2>/dev/null) || code="000"
  loc=$(awk 'BEGIN{IGNORECASE=1} /^location:/{sub(/\r$/,""); sub(/^[Ll]ocation:[[:space:]]*/,""); print}' "$headers" | tail -1)

  [[ " $expected " == *" $code "* ]] || ok=0
  if [[ -n "$redirect_expect" ]]; then
    [[ "$loc" == "$redirect_expect"* ]] || ok=0
    note="→ ${loc:-<无 Location>}"
  fi

  # 额外断言：健康检查必须带 no-store，页面必须是 HTML
  if [[ "$path" == "/api/health" ]]; then
    grep -qi '^cache-control:.*no-store' "$headers" || { ok=0; note+=" cache-control 缺少 no-store"; }
    grep -q '"ok":true' "$body" || { ok=0; note+=" 响应体缺少 ok:true"; }
  elif [[ "$expected" == "200"* && "$path" != "/api/health" ]]; then
    grep -qi '<html' "$body" || { ok=0; note+=" 响应不是 HTML"; }
  fi

  if [[ $ok -eq 1 ]]; then
    PASS=$((PASS + 1))
    printf '| %d | %s | `%s` | %s | ✅ PASS | %s |\n' "$((PASS + FAIL))" "$name" "$path" "$code" "$note"
    green "PASS" >/dev/null
  else
    FAIL=$((FAIL + 1))
    printf '| %d | %s | `%s` | %s | ❌ FAIL | 期望 %s %s |\n' "$((PASS + FAIL))" "$name" "$path" "$code" "$expected" "$note"
  fi

  rm -f "$headers" "$body"
}

# 等待服务就绪（最多 60 秒）
for i in $(seq 1 60); do
  if curl -fsS --max-time 2 "$BASE/api/health" >/dev/null 2>&1; then
    break
  fi
  if [[ $i -eq 60 ]]; then
    echo "服务在 60 秒内没有就绪：$BASE/api/health" >&2
    exit 1
  fi
  sleep 1
done

check "首页"                "/"                      "200"
check "分区-音乐"            "/category/music"        "200"
check "分区-ASMR 第 2 页"    "/category/asmr?page=2"  "200"
check "声音详情"             "/sound/848"             "200"
check "旧播放链接兼容"       "/music/play?id=848"     "307 308" "/sound/848"
check "登录页"               "/login"                 "200"
check "注册页"               "/register"              "200"
check "健康检查"             "/api/health"            "200"
check "未登录 /me 重定向"    "/me"                    "307 308" "/login"

echo
if [[ $FAIL -eq 0 ]]; then
  echo "结果：$PASS 项全部通过 ✅"
  exit 0
else
  echo "结果：$PASS 通过 / $FAIL 失败 ❌"
  exit 1
fi
