#!/usr/bin/env bash
# 一键安装全部电商技能。
#
#   ./install.sh                  # 装到当前项目，所有检测到的 agent
#   ./install.sh -g               # 装到用户级（所有项目共用）
#   ./install.sh claude-code      # 只装给指定 agent
#   ./install.sh -g claude-code
#
# 本质上就是 `npx skills add <repo> --skill '*' -y`，脚本只是替你检查环境、拼参数。
set -euo pipefail

REPO="https://github.com/dlazyai/ecommerce-skills"

if ! command -v node >/dev/null 2>&1; then
	echo "需要 Node.js（18 及以上）：https://nodejs.org" >&2
	exit 1
fi

major=$(node -p "process.versions.node.split('.')[0]")
if [ "$major" -lt 18 ]; then
	echo "Node.js 版本过低（当前 $(node -v)），请升级到 18 及以上" >&2
	exit 1
fi

args=()
agent="*"
for a in "$@"; do
	case "$a" in
		-g|--global) args+=("--global") ;;
		-*) echo "未知参数：$a" >&2; exit 1 ;;
		*) agent="$a" ;;
	esac
done

echo "正在从 $REPO 安装全部技能…"
npx -y skills@latest add "$REPO" --skill '*' --agent "$agent" -y ${args[@]+"${args[@]}"}

cat <<'TIP'

装好了。用法：直接对 Agent 说想做什么，它会自己挑技能，比如
  「把 docs/flat-lay/garment-flatlay.jpg 做成模特上身图」
  「这批主图上架前帮我过一遍投前检测」

更新：npx skills update
卸载：npx skills remove
TIP
