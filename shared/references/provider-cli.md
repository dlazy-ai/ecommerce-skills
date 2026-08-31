# 后端调用参考

技能正文只写「要生成什么」。认证、计费、错误码、输出结构这些每个技能都一样的东西放在这里，
**用到时再读**，不占技能的常驻上下文。

---

## 一、认证

### 默认后端 dLazy

```bash
dlazy login            # 设备码流程，远程 shell 也能用，自动写入本地配置
dlazy auth set <KEY>   # 已有 key 时直接写入
```

key 存在用户配置目录（macOS/Linux `~/.dlazy/config.json`，Windows `%USERPROFILE%\.dlazy\config.json`），
权限限本机用户。也可以每次调用用环境变量 `DLAZY_API_KEY` 传入。

手动获取：登录 [dlazy.com](https://dlazy.com) → [API Key 页面](https://dlazy.com/dashboard/organization/api-key)。
key 按组织隔离，可随时轮换或吊销。

### 其他后端

本技能库不锁定单一厂商。配好任意一家的 key 即可跑：

| 后端 | 环境变量 | 说明 |
| --- | --- | --- |
| `dlazy` | `dlazy login` 或 `DLAZY_API_KEY` | 默认，最省事 |
| `openai` | `OPENAI_API_KEY` | 走 `/v1/images/edits` 与 `/v1/images/generations` |
| `gemini` | `GEMINI_API_KEY` | Nano Banana 系列 |
| `fal` | `FAL_KEY` | |
| `replicate` | `REPLICATE_API_TOKEN` | |
| `ark` | `ARK_API_KEY` + `ARK_MODEL` | 火山方舟，模型 ID 需按开通情况填 |

选路优先级：`--provider` 参数 > `PROVIDER` 环境变量 > 第一个配了 key 的 > `dlazy`。

```bash
node scripts/gen.mjs --doctor     # 看当前哪个后端可用
```

各后端的模型 ID 可用 `GEN_MODEL_OPENAI` / `GEN_MODEL_GEMINI` / `GEN_MODEL_FAL` /
`GEN_MODEL_REPLICATE` / `GEN_MODEL_ARK` 覆盖。**厂商目录会变，以各家最新文档为准。**

---

## 二、两种调用方式

### 方式 A：统一入口（推荐）

```bash
node scripts/gen.mjs --task <技能名> --prompt '...' --images a.jpg b.jpg --save out.jpg
```

它负责：后端选路、默认尺寸档位、失败重试（429/5xx 指数退避）、落盘建目录、成本估算。

```bash
node scripts/gen.mjs --task flat-lay --prompt '...' --dry-run   # 不调用不计费，只看要发什么
node scripts/gen.mjs --help
```

### 方式 B：直接用 dLazy CLI

不想引入 Node 依赖时，技能正文里的 `dlazy ...` 命令可以原样执行，效果等价。

```bash
npx @dlazy/cli@1.2.3 <command>     # 不装全局二进制
```

- CLI 源码：[github.com/dlazy-ai/cli](https://github.com/dlazy-ai/cli) · npm 包 `@dlazy/cli`

---

## 三、数据流向

调用 dLazy 时：提示词与参数发往 `api.dlazy.com`；传入的本地图片会上传到 `files.dlazy.com`
供模型读取；产出 URL 同样托管在 `files.dlazy.com`。这是云端生成 API 的通用形态。
换成其他后端时，数据流向对应厂商，不经过 dLazy。

---

## 四、输出结构

`gen.mjs`（加 `--json`）：

```json
{
  "ok": true,
  "task": "flat-lay",
  "provider": "dlazy",
  "model": "gpt-image-2",
  "files": ["docs/flat-lay/output-sku001.jpg"],
  "texts": [],
  "estimatedCredits": 60,
  "elapsedMs": 58213
}
```

dLazy CLI 原生：

```json
{
  "ok": true,
  "result": {
    "tool": "gpt-image-2",
    "data": { "urls": ["https://files.dlazy.com/data/ai/....jpg"] },
    "savedPath": "docs/flat-lay/example-output.jpg"
  }
}
```

加 `--no-wait` 的异步任务不返回 `data`，返回 `task: { generateId, status }`，
用 `dlazy status <generateId> --wait` 轮询。

文本类模型（如质检）产出在 `result.data.texts[0]`：

```bash
dlazy claude-sonnet-5 --prompt '...' --images x.jpg \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["data"]["texts"][0])'
```

---

## 五、错误处理

| Code | 类型 | 示例 |
| --- | --- | --- |
| 401 | 未授权 / 无 key | `ok: false, code: "unauthorized"` |
| 501 | 缺必填参数 | `error: required option '--prompt <prompt>' not specified` |
| 502 | 本地文件读不到 | `Error: Image file not found: ...` |
| 503 | 余额不足 | `ok: false, code: "insufficient_balance"` |
| 503 | 服务端错误 | `HTTP status code error (500)` |
| 504 | 异步任务失败 | `=== Generation Failed ===` / `Prompt violates safety policy` |

**给 Agent 的硬性要求**

1. 命中 `insufficient_balance` → 明确告诉用户算力不足，并给出充值入口
   <https://dlazy.com/dashboard/organization/settings?tab=credits>
2. 命中 `unauthorized` / 缺 key → 告诉用户去 <https://dlazy.com/dashboard/organization/api-key>
   取 key，用 `dlazy auth set <key>` 存好再继续。
3. 用 `gen.mjs` 时，429 与 5xx 已自动重试；仍失败才向用户报错。
4. **不要**为了「跑通」而偷偷降级参数（尺寸、档位、批量），先问用户。
