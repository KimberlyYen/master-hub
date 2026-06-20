#!/usr/bin/env bash
set -euo pipefail

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
body_file="$tmpdir/body.json"

bitbucket_request() {
  local url="$1"
  shift
  curl -sS -o "$body_file" -w "%{http_code}" \
    -u "${BITBUCKET_AUTH_USER}:${BITBUCKET_AUTH_SECRET}" \
    "$url" "$@"
}

resolve_auth() {
  if [[ -n "${ATLASSIAN_EMAIL:-}" && -n "${ATLASSIAN_API_TOKEN:-}" ]]; then
    BITBUCKET_AUTH_MODE="api_token"
    BITBUCKET_AUTH_USER="$ATLASSIAN_EMAIL"
    BITBUCKET_AUTH_SECRET="$ATLASSIAN_API_TOKEN"
    return 0
  fi

  if [[ -n "${BITBUCKET_USERNAME:-}" && -n "${BITBUCKET_APP_PASSWORD:-}" ]]; then
    BITBUCKET_AUTH_MODE="app_password"
    BITBUCKET_AUTH_USER="$BITBUCKET_USERNAME"
    BITBUCKET_AUTH_SECRET="$BITBUCKET_APP_PASSWORD"
    return 0
  fi

  cat >&2 <<'EOF'
缺少認證資訊。請擇一設定：

【方式 A】API Token（建議）
  export ATLASSIAN_EMAIL="你的 Atlassian Email"
  export ATLASSIAN_API_TOKEN="你的 API Token"

【方式 B】App Password（舊版，2025/09 後將停用）
  export BITBUCKET_USERNAME="你的 Bitbucket 使用者名稱"
  export BITBUCKET_APP_PASSWORD="你的 App Password"

注意：API Token 的 Username 必須是 Email；App Password 的 Username 必須是 Bitbucket 使用者名稱，兩者不可混用。
EOF
  exit 1
}

print_401_help() {
  cat >&2 <<EOF

401 常見原因：
1. Username 與 Token 類型不配對
   - API Token  → Username 填 Atlassian Email（不是 Kimberly）
   - App Password → Username 填 Bitbucket 使用者名稱（不是 Email）
2. Token 權限不足
   - 測試認證需：read:user:bitbucket
   - 建立 PR 需：write:pullrequest:bitbucket
3. Token 複製錯誤（多空格、少字元）或已過期
4. Token 所屬帳號沒有 kimberly_yen/master-hub 權限（需用 kimberly_yen1 那個帳號建立）

目前使用的認證模式：${BITBUCKET_AUTH_MODE}
目前使用的 Username：${BITBUCKET_AUTH_USER}
EOF
}

resolve_auth

http_code=$(bitbucket_request "https://api.bitbucket.org/2.0/user")

if [[ "$http_code" == "200" ]]; then
  python3 -c '
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)
name = data.get("display_name", "")
user = data.get("username", "")
print(f"認證成功：{name} ({user})")
print(f"認證模式：{sys.argv[2]}")
' "$body_file" "$BITBUCKET_AUTH_MODE"
  exit 0
fi

echo "認證失敗（HTTP ${http_code}）" >&2
python3 -m json.tool "$body_file" 2>/dev/null || cat "$body_file" >&2

if [[ "$http_code" == "401" ]]; then
  print_401_help
fi

exit 1
