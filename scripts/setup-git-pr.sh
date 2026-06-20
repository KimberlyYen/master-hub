#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)

git config --local alias.pr '!bash -c '"'"'exec bash "$(git rev-parse --show-toplevel)/scripts/git-pr.sh" "$@"'"'"' -'

echo "已設定 git pr alias（僅此 repo）"
echo ""
echo "用法："
echo "  git pr auth"
echo "  git pr push"
echo ""
echo "若仍無法使用，可直接執行："
echo "  bash $root/scripts/git-pr.sh push"
