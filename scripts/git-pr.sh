#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

usage() {
  cat <<'EOF'
用法：
  git pr auth                 測試 Bitbucket API 認證
  git pr create [main]        從目前分支建立 PR（目標分支預設 main）
  git pr push [main]          push 目前分支並建立 PR

認證（擇一，建議 API Token）：
  export ATLASSIAN_EMAIL="你的 Atlassian Email"
  export ATLASSIAN_API_TOKEN="ATATT..."

完整流程：
  git checkout -b my-feature
  git add .
  git commit -m "feat: 新功能"
  git pr push
EOF
}

cmd="${1:-}"
shift || true

case "$cmd" in
  auth)
    exec "$script_dir/test-bitbucket-auth.sh"
    ;;
  create)
    dest="${1:-main}"
    exec "$script_dir/create-pr.sh" "" "$dest" ""
    ;;
  push)
    dest="${1:-main}"
    branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$branch" == "HEAD" ]]; then
      echo "無法判斷目前分支（可能在 detached HEAD）" >&2
      exit 1
    fi
    echo "→ git push -u origin ${branch}"
    git push -u origin "$branch"
    exec "$script_dir/create-pr.sh" "" "$dest" ""
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    echo "未知子指令：$cmd" >&2
    usage >&2
    exit 1
    ;;
esac
