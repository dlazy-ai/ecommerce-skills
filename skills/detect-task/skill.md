---
name: detect-task
description: 投前检测（企业功能）。在图片投放上架之前做自动质检：检测 AI 生成图的真实性与崩坏风险，输出风险等级（低/中/高风险）与命中的具体风险项（商品崩坏、人脸不自然、手部异常、肢体结构错误、文字乱码、光影矛盾、边缘融合痕迹、平台合规），平均每张约 1 秒完成，用于提升投放成功率、降低因图片问题被平台驳回或影响转化的风险。本技能把它落地为一条命令行质检环节：用视觉模型逐项判定并输出结构化中文报告，同时给出可直接追加到生成 prompt 的英文修正句，形成「生成 → 检测 → 重跑」闭环。适用于 AI 生图上架前的把关、批量出图后的抽样质检、把不合格图自动打回重跑。当用户需要「投前检测」「图片质检」「检查 AI 图有没有崩」「上架前把关」「AI 图真实性检测」时使用本技能。
---

# detect-task — 投放前 AI 图真实性检测

AI 生图上架前的**最后一道关**。判断这张图能不能直接投，崩在哪里，怎么修。

和其他技能的区别：本技能**不生成图片，输出的是判断**。它的价值在于把「生成 → 检测 → 重跑」闭起来——检测报告里直接给出该追加到 prompt 的修正句。

---

## 1、能力边界

| 输出 | 说明 |
| --- | --- |
| 风险等级 | `低风险` / `中风险` / `高风险` |
| 风险项逐条判定 | 8 项，每项给出 `通过` / `命中` + 一句证据 |
| 投放建议 | `建议投放` / `建议重跑` / `建议人工修图` |
| 修正建议 | 可直接追加到生成 prompt 的英文修正句 |

**8 项风险清单**

| # | 风险项 | 看什么 |
| --- | --- | --- |
| 1 | 商品崩坏 | 款式、织法、印花、logo 位置是否失真 |
| 2 | 人脸不自然 | 五官比例、皮肤质感、眼神 |
| 3 | 手部异常 | 手指数量与形态 |
| 4 | 肢体结构错误 | 肩线、四肢数量与朝向 |
| 5 | 文字乱码 | 画面内任何文字 |
| 6 | 光影矛盾 | 投影方向与光源是否一致 |
| 7 | 边缘融合痕迹 | 抠图边、鬼影、糊块 |
| 8 | 平台合规 | 是否含违规元素 |

**不做**：不替代人工终审（模型判断有误报漏报）；不做法律与平台规则的最终裁定；不用于给明显违规的图背书。

---

## 2、报告要能直接驱动重跑

检测的意义不是打分，而是**告诉生成环节要改什么**。所以报告的第 4 项必须是**可直接复制到 prompt 的英文句子**。

典型映射：

| 命中项 | 应追加到生成 prompt 的修正句 |
| --- | --- |
| 商品崩坏 | `Cross-check the garment against the reference: [关键特征] must match exactly.` |
| 人脸不自然 | `Photorealistic human face: correct facial proportions, natural skin pores and subsurface scattering, natural gaze.` |
| 手部异常 | `Hands anatomically correct — five distinct fingers per hand, natural knuckles, no fused or extra digits.` |
| 肢体结构错误 | `Correct anatomy: symmetric shoulders, two arms and two legs, no extra or missing limbs, no impossible joint angles.` |
| 文字乱码 | `No text anywhere in the image.` 或（需要文字时）`All text must be clear, correctly formed [语言] characters.` |
| 光影矛盾 | `Single consistent light source from [方向]; all shadows must fall in the same direction.` |
| 边缘融合痕迹 | `Blend all edges seamlessly; no cut-out halo, no ghosting, no blurred patches.` |
| 平台合规 | 视具体问题调整构图或去除违规元素 |

**闭环写法**：

```
生成 → detect-task → 命中项 → 取修正句 → 追加到原 prompt → 重跑 → 再检测
```

---

## 3、批量抽检

批量出图后不必全检（成本 3 credits/张，但人工看报告的时间是瓶颈）。建议：

| 场景 | 抽检比例 |
| --- | --- |
| 新规范段的首批 | 100% |
| 规范已验证的批次 | 10% ~ 20% 随机 |
| 带人物的图 | 提高到 30%（手和脸最容易崩） |
| 纯商品图无人物 | 5% 即可 |

批量脚本见第五节 command examples。把 `高风险` 的 SKU 自动打回重跑队列。

---

## 4、dLazy 工具调用

本技能使用 dLazy 的 **`claude-sonnet-5`**（具备图像理解能力的文本模型；本技能要的是**判断与结构化报告**而不是图片，需要能逐项审查画面并写出可执行的修正建议——单张约 3 credits）。

### Authentication

All requests require a dLazy API key. The recommended way to authenticate is:

```bash
dlazy login
```

This runs a device-code flow (also works in remote shells) and **automatically saves your API key** to the local CLI config — no manual copy/paste required.

#### Alternative: Set the Key Manually

If you already have an API key, you can save it directly:

```bash
dlazy auth set YOUR_API_KEY
```

The CLI saves the key in your user config directory (`~/.dlazy/config.json` on macOS/Linux, `%USERPROFILE%\.dlazy\config.json` on Windows), with file permissions restricted to your OS user account. You can also supply the key per-invocation via the `DLAZY_API_KEY` environment variable.

#### Getting Your API Key Manually

1. Sign in or create an account at [dlazy.com](https://dlazy.com)
2. Go to [dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key)
3. Copy the key shown in the API Key section

Each key is scoped to your dLazy organization and can be **rotated or revoked at any time** from the same dashboard.

### About & Provenance

- **CLI source code**: [github.com/dlazyai/cli](https://github.com/dlazyai/cli)
- **Maintainer**: dlazyai
- **npm package**: `@dlazy/cli` (pinned to `1.2.3` in this skill's install spec)
- **Homepage**: [dlazy.com](https://dlazy.com)

You can install on demand without persisting a global binary by running:

```bash
npx @dlazy/cli@1.2.3 <command>
```

Or, if you prefer a global install, the skill's `metadata.clawdbot.install` field declares the exact pinned version (`npm install -g @dlazy/cli@1.2.3`). Review the GitHub source before installing.

### How It Works

This skill is a thin client over the dLazy hosted API. When you invoke it:

- Prompts and parameters you provide are sent to the dLazy API endpoint (`api.dlazy.com`) for inference.
- Any local file paths you pass to image / video / audio fields are uploaded to dLazy's media storage (`files.dlazy.com`) so the model can read them — the same flow as any cloud-based generation API.
- Generated output URLs returned by the API are hosted on `files.dlazy.com`.

This is the standard SaaS pattern; the skill itself does not access network or filesystem resources beyond what the dLazy CLI already handles. See [dlazy.com](https://dlazy.com) for the full service terms.

### Usage

**CRITICAL INSTRUCTION FOR AGENT**:
Run the `dlazy claude-sonnet-5` command to get results.

```bash
dlazy claude-sonnet-5 -h

Options:
  --prompt <prompt>     Prompt
  --images [images...]  Images [image: url or local path] (max 10)
  --videos [videos...]  Videos [video: url or local path] (max 8)
  --dry-run             Print payload without executing the tool
  --no-wait             Return generateId immediately for async tasks
  --timeout <seconds>   Max seconds to wait for async completion (default:
                        "1800")
  --input <jsonOrFile>  Inline JSON or @path/to/file.json — merged under flag
                        values (flags win)
  --save <path>         Download the result asset to this local path (mkdir +
                        retry handled for you). A destination path — NOT a
                        response format; for stdout shape use --format
  --batch <n>           Fan-out N parallel runs (cloud tools only) (default:
                        "1")
  -h, --help            display help for command
```

> Any flag also accepts pipe references — `-` (auto-pick from upstream stdin), `@N` (n-th output), `@N.path` (jsonpath into output), `@*` (all primary values), `@stdin` / `@stdin:path` (whole envelope). See `dlazy --help` for details.

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[待检图]`（最多 10 张，可一次送多张同批图对比） | 单张检测最准；多张适合看整批一致性 |
| `--prompt` | 固定的质检 prompt（见第五节模板） | **整个项目用同一份**，否则报告不可比 |
| `--batch` | `1` | 检测不需要多样性 |
| `--no-wait` | 批量抽检时开启 | 先提交后统一收结果 |

**取结果**：文本模型的输出在 `result.data.texts[0]`（不是 `urls`）。

```bash
dlazy claude-sonnet-5 --prompt '...' --images a.jpg \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["data"]["texts"][0])'
```

> `dlazy --format text <tool>` 也可以把纯文本打到 stdout，注意 `--format` 是**全局**选项，必须写在子命令**之前**。

### Output Format

```json
{
  "ok": true,
  "result": {
    "tool": "claude-sonnet-5",
    "modelId": "claude-sonnet-5",
    "data": {
      "urls": [
        "https://files.dlazy.com/data/ai/20260817092703-057827edb8aa.jpg"
      ]
    },
    "savedPath": "docs/detect-task/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 单张检测
dlazy claude-sonnet-5 \
  --prompt '你是电商投放前的图片质检员。审查这张 AI 生成的商拍图能否直接投放，输出风险等级、8 项风险的逐条判定、投放建议，以及应追加到生成 prompt 的英文修正句。只输出报告。' \
  --images docs/detect-task/candidate.jpg \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["data"]["texts"][0])'

# complex call: 固定质检 prompt + 批量抽检 + 高风险自动打回
QC='你是电商投放前的图片质检员。审查这张 AI 生成的服装商拍图能否直接用于电商投放。全部用中文作答（第 4 项的 prompt 修正句除外）。严格按以下结构输出：
## 1. 风险等级
低风险 / 中风险 / 高风险（三选一）
## 2. 风险项逐条判定
用表格输出，三列：风险项 / 结论（通过 或 命中）/ 证据。风险项固定为这 8 条：商品崩坏、人脸不自然、手部异常、肢体结构错误、文字乱码、光影矛盾、边缘融合痕迹、平台合规。
## 3. 投放建议
建议投放 / 建议重跑 / 建议人工修图
## 4. 修正建议
若建议重跑或人工修图，给出应追加到生成 prompt 的英文修正句 1-3 条；若建议投放，写「无需修正」。
只输出报告，不要寒暄。'

mkdir -p docs/detect-task/reports
: > docs/detect-task/rerun-queue.txt

for f in docs/batch-image/out/*.jpg; do
  SKU=$(basename "$f" .jpg)
  dlazy claude-sonnet-5 --prompt "$QC" --images "$f" 2>/dev/null \
    | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["data"]["texts"][0])' \
    > "docs/detect-task/reports/${SKU}.md"
  if grep -q '高风险' "docs/detect-task/reports/${SKU}.md"; then
    echo "$SKU" >> docs/detect-task/rerun-queue.txt
  fi
done

echo "需要重跑：$(wc -l < docs/detect-task/rerun-queue.txt) 个 SKU"

# 先估价不真跑
dlazy claude-sonnet-5 --dry-run --prompt '...' --images a.jpg
```

### Error Handling

| Code | Error Type                         | Example Message                                                                                                          |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 401  | Unauthorized (No API Key)          | `ok: false, code: "unauthorized", message: "API key is missing or invalid"`                                              |
| 501  | Missing required parameter         | `error: required option '--prompt <prompt>' not specified`                                                                |
| 502  | Local file read error              | `Error: Image file/Video file not found: C:\path\to\your\file`                                                            |
| 503  | API request failed (no balance)    | `ok: false, code: "insufficient_balance"`                                                                                |
| 503  | API request failed (server error)  | `HTTP status code error (500 server crash)`                                                                              |
| 504  | Asynchronous task execution failed | `=== Generation Failed ===` / `{Specific error reason returned by backend, for example "Prompt violates safety policy"}`  |

> **AGENT CRITICAL INSTRUCTION**:
> 1. If the execution result returns `code: "insufficient_balance"`, you MUST explicitly inform the user that their credits are insufficient and guide them to recharge: [https://dlazy.com/dashboard/organization/settings?tab=credits](https://dlazy.com/dashboard/organization/settings?tab=credits)
> 2. If the execution result returns `code: "unauthorized"` or indicates missing API key, you MUST inform the user to get their API key from [https://dlazy.com/dashboard/organization/api-key](https://dlazy.com/dashboard/organization/api-key) and save it using `dlazy auth set <key>` and resume the task.

---

## 5、Prompt 模板

**这份 prompt 应该在整个项目里固定不变**，否则不同批次的报告没法比较。

```text
你是电商投放前的图片质检员。审查这张 AI 生成的[品类]商拍图能否直接用于电商投放。
全部用中文作答（第 4 项的 prompt 修正句除外）。严格按以下结构输出：

## 1. 风险等级
低风险 / 中风险 / 高风险（三选一）

## 2. 风险项逐条判定
用表格输出，三列：风险项 / 结论（通过 或 命中）/ 证据。
风险项固定为这 8 条：商品崩坏、人脸不自然、手部异常、肢体结构错误、
文字乱码、光影矛盾、边缘融合痕迹、平台合规。

## 3. 投放建议
建议投放 / 建议重跑 / 建议人工修图

## 4. 修正建议
若建议重跑或人工修图，给出应追加到生成 prompt 的英文修正句 1-3 条；
若建议投放，写「无需修正」。

只输出报告，不要寒暄。
```

**可选的加强项**

| 需求 | 追加到 prompt |
| --- | --- |
| 要和原商品图比对 | 多传一张原图，并写 `图1 是待检图，图2 是原始商品图，逐项比对商品保真度。` |
| 要打分便于排序 | `在风险等级后追加一个 0-100 的可投放分数。` |
| 要卡特定平台规则 | `额外检查以下平台规则：[规则清单]。` |
| 要机器可读 | `以 JSON 输出，字段为 risk_level / items[] / recommendation / fixes[]。` |

---

## 6、执行流程

1. **固定质检 prompt**（第五节模板），整个项目复用。
2. **单张检测**：取 `result.data.texts[0]` 得到报告。
3. **读第 3 项**：`建议投放` → 上架；`建议人工修图` → 转修图；`建议重跑` → 下一步。
4. **取第 4 项的修正句**，追加到原生成 prompt 末尾，重跑。
5. **再检测一次**——确认修正生效，别盲信一次重跑。
6. **批量场景**：按第四节的比例抽检，`高风险` 自动进重跑队列。
7. **人工终审**：模型有误报漏报，上架前仍需人眼扫一遍。

---

## 7、生成效果示例

| 输入：待检图 |
| --- |
| <img src="../../docs/detect-task/candidate.jpg" width="280"> |
| `candidate.jpg` — 由 [flat-lay](../flat-lay/skill.md) 生成的军绿毛衣模特上身图，1024×1536 |

实际执行的命令：

```bash
dlazy claude-sonnet-5 \
  --prompt '你是电商投放前的图片质检员。审查这张 AI 生成的服装商拍图能否直接用于电商投放。全部用中文作答（第 4 项的 prompt 修正句除外）。严格按以下结构输出：
## 1. 风险等级
低风险 / 中风险 / 高风险（三选一）
## 2. 风险项逐条判定
用表格输出，三列：风险项 / 结论（通过 或 命中）/ 证据。风险项固定为这 8 条：商品崩坏、人脸不自然、手部异常、肢体结构错误、文字乱码、光影矛盾、边缘融合痕迹、平台合规。
## 3. 投放建议
建议投放 / 建议重跑 / 建议人工修图
## 4. 修正建议
若建议重跑或人工修图，给出应追加到生成 prompt 的英文修正句 1-3 条；若建议投放，写「无需修正」。
只输出报告，不要寒暄。' \
  --images docs/detect-task/candidate.jpg \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["data"]["texts"][0])' \
  > docs/detect-task/example-report.md
```

**输出**：完整报告见 [`docs/detect-task/example-report.md`](../../docs/detect-task/example-report.md)，3 credits。摘要：

- **风险等级**：低风险
- **8 项判定**：7 项通过；`文字乱码` 命中（轻微）——左侧袖口的织标图案模糊不可辨
- **投放建议**：建议人工修图（仅需局部处理袖口小标签）
- **修正建议**：`clear and legible brand tag/logo embroidery on cuff, sharp fine detail, no blurry or garbled text`

这条修正句可以直接追加到 flat-lay 的原 prompt 末尾重跑——这就是闭环。

---

## 8、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 报告输出英文 | 未强制语言 | prompt 里写明「全部用中文作答」 |
| 拿不到结果 | 取错了字段 | 文本模型的结果在 `data.texts[0]`，不是 `urls` |
| `--format text` 报错 | 全局选项位置错 | `--format` 要写在子命令**之前** |
| 不同批次报告没法比 | 质检 prompt 每次都改 | 固定一份 prompt 全项目复用 |
| 明显崩坏没被检出 | 模型漏报 | 提高抽检比例；上架前人工终审 |
| 正常图被判高风险 | 模型误报 | 看第 2 项的证据描述再决定，不要只看等级 |
| 修正句不够具体 | 报告太笼统 | 追加「要和原商品图比对」的加强项，多传一张原图 |

---

## Tips

Visit https://dlazy.com for more information.
