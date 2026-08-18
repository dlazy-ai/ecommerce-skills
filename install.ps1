# 一键安装全部电商技能（Windows PowerShell）。
#
#   .\install.ps1                    # 装到当前项目，所有检测到的 agent
#   .\install.ps1 -Global            # 装到用户级（所有项目共用）
#   .\install.ps1 -Agent claude-code # 只装给指定 agent
#
# 本质上就是 `npx skills add <repo> --skill '*' -y`，脚本只是替你检查环境、拼参数。
#
# 若提示脚本被禁止执行，先运行：
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

param(
	[switch]$Global,
	[string]$Agent = "*"
)

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/dlazyai/ecommerce-skills"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
	Write-Error "需要 Node.js（18 及以上）：https://nodejs.org"
	exit 1
}

$major = [int](node -p "process.versions.node.split('.')[0]")
if ($major -lt 18) {
	Write-Error "Node.js 版本过低（当前 $(node -v)），请升级到 18 及以上"
	exit 1
}

$cliArgs = @("-y", "skills@latest", "add", $Repo, "--skill", "*", "--agent", $Agent, "-y")
if ($Global) { $cliArgs += "--global" }

Write-Host "正在从 $Repo 安装全部技能…"
npx @cliArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "装好了。用法：直接对 Agent 说想做什么，它会自己挑技能，比如"
Write-Host "  「把 docs/flat-lay/garment-flatlay.jpg 做成模特上身图」"
Write-Host "  「这批主图上架前帮我过一遍投前检测」"
Write-Host ""
Write-Host "更新：npx skills update"
Write-Host "卸载：npx skills remove"
