#!/usr/bin/env bash
set -euo pipefail

REPO="${BITBUCKET_REPO:-}"
if [[ -z "$REPO" ]]; then
  remote_url=$(git remote get-url origin 2>/dev/null || true)
  if [[ "$remote_url" =~ bitbucket\.org[:/]([^/]+)/([^/.]+) ]]; then
    REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
  else
    REPO="kimberly_yen/master-hub"
  fi
fi

SOURCE_BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo PR-test)}"
DEST_BRANCH="${2:-main}"
TITLE="${3:-$(git log -1 --pretty=%s 2>/dev/null || echo "feat: update")}"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
body_file="$tmpdir/response.json"

resolve_auth() {
  if [[ -n "${ATLASSIAN_EMAIL:-}" && -n "${ATLASSIAN_API_TOKEN:-}" ]]; then
    BITBUCKET_AUTH_USER="$ATLASSIAN_EMAIL"
    BITBUCKET_AUTH_SECRET="$ATLASSIAN_API_TOKEN"
    return 0
  fi

  if [[ -n "${BITBUCKET_USERNAME:-}" && -n "${BITBUCKET_APP_PASSWORD:-}" ]]; then
    BITBUCKET_AUTH_USER="$BITBUCKET_USERNAME"
    BITBUCKET_AUTH_SECRET="$BITBUCKET_APP_PASSWORD"
    return 0
  fi

  cat >&2 <<'EOF'
缺少認證資訊。API Token（ATATT 開頭）請用：

  export ATLASSIAN_EMAIL="你的 Atlassian Email"
  export ATLASSIAN_API_TOKEN="ATATT..."

然後執行：git pr auth
EOF
  exit 1
}

resolve_auth

export DESCRIPTION="${PR_DESCRIPTION:-$(git log -1 --pretty=%B 2>/dev/null || echo "$TITLE")}"

payload=$(python3 -c '
import json, os, sys
print(json.dumps({
    "title": sys.argv[1],
    "description": os.environ["DESCRIPTION"],
    "source": {"branch": {"name": sys.argv[2]}},
    "destination": {"branch": {"name": sys.argv[3]}},
}))
' "$TITLE" "$SOURCE_BRANCH" "$DEST_BRANCH")

echo "→ 建立 PR：${SOURCE_BRANCH} → ${DEST_BRANCH}（${REPO}）" >&2

http_code=$(curl -sS -o "$body_file" -w "%{http_code}" -X POST \
  -u "${BITBUCKET_AUTH_USER}:${BITBUCKET_AUTH_SECRET}" \
  "https://api.bitbucket.org/2.0/repositories/${REPO}/pullrequests" \
  -H "Content-Type: application/json" \
  -d "$payload")

if [[ "$http_code" == "201" ]]; then
  url=$(python3 -c '
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)
print(data.get("links", {}).get("html", {}).get("href", ""))
' "$body_file")
  echo "PR 建立成功："
  echo "$url"
  exit 0
fi

echo "建立 PR 失敗（HTTP ${http_code}）" >&2
python3 -m json.tool "$body_file" 2>/dev/null || cat "$body_file" >&2
exit 1
