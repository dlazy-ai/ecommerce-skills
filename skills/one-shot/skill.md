---
name: one-shot
description: 同一商品替换模特和背景。输入一张已有的模特图或人台图（衣服穿在真人或人形模特上的图），在保持商品本身完全不动的前提下，替换模特、替换背景，或两者同时替换。三种模式：换模特换背景 / 只换背景 / 只换模特。可指定目标模特（性别、年龄、肤色、身材），可选择参考图决定新的姿势与场景并调节参考图相似度（50% 相似 / 100% 相似），支持智能匹配模特位置与自动修手。适用于把一张已拍好的商拍图裂变成多个人群版本（国内/海外、不同年龄段、不同肤色），一次拍摄覆盖多个投放市场；也适用于人台图转真人图。当用户需要「换模特」「换背景」「同一件衣服换个人穿」「人台图变真人图」「一图多版本适配不同市场」时使用本技能。
---

# one-shot — 同一商品替换模特和背景

拿一张**已经拍好的模特图或人台图**，在**商品完全不动**的前提下换掉人、换掉背景，或两者都换。

和 [flat-lay](../flat-lay/skill.md) 的区别：flat-lay 从平铺图**造**一张模特图；本技能是把**已有**的模特图**裂变**成多个人群 / 场景版本——一次拍摄，覆盖国内海外、不同年龄段、不同肤色的投放需求。

---

## 生成效果示例

| 输入：原模特图 |
| --- |
| <img src="../../docs/one-shot/source-model.jpg" width="280"> |
| `source-model.jpg` — 男青年身穿灰色落肩短袖，浅灰棚拍背景，768×1024 |

实际执行的命令（换模特换背景）：

```bash
dlazy gpt-image-2 \
  --prompt 'Replace the model and the background of this e-commerce photo while keeping the garment untouched. Keep the grey oversized short-sleeve T-shirt exactly as it is: same slate-grey colour, same drop-shoulder cut, same white chest logo, same folds and hem. Replace the person with a different male model of similar build and age, and replace the plain studio wall with a sunlit outdoor city street with soft bokeh. Keep the same pose, camera angle, crop and framing. Photorealistic catalog shot, natural light, no text, no watermark.' \
  --images docs/one-shot/source-model.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/one-shot/example-output.jpg
```

**输出**

<img src="../../docs/one-shot/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536。灰色落肩短袖的颜色、版型、胸前 logo 与下摆弧线保持不变；模特换成另一位男青年，棚拍灰墙换成树影斑驳的街景，姿势与景别沿用原图。

---

## 1、能力边界

| 模式 | 说明 |
| --- | --- |
| 换模特换背景 | 人和场景全换，只留商品 |
| 只换背景 | 保留原模特（脸、身材、姿势），换掉环境 |
| 只换模特 | 保留原场景与构图，换掉人 |

| 附加能力 | 说明 |
| --- | --- |
| 指定模特 | 性别 / 年龄 / 肤色 / 身材，锁定同一张脸做多 SKU |
| 参考图 | 决定新的姿势与场景，支持套图 |
| 参考图相似度 | `50% 相似`（借风格，保留原构图）/ `100% 相似`（严格照抄参考图） |
| 智能匹配模特位置 | 自动对齐新模特与原商品的身体位置，避免衣服错位 |
| 自动修手 | 生成后自动修正手部结构 |
| 人台图转真人 | 输入人形模特（假人）图，输出真人上身图 |

**不做**：不改商品的款式、颜色、图案与版型；不做换脸到特定真人；不用于伪造他人肖像代言。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**输入类型**：模特图 **或** 人台图（衣服已经穿在真人 / 假人身上的图）。

**输入建议**

| 做法 | 说明 |
| --- | --- |
| ✅ 商品完整无遮挡 | 手臂、包袋压住衣服的地方换人后容易崩 |
| ✅ 商品在画面中占比够大 | 太小的商品换人时细节会被重绘丢失 |
| ✅ 光线均匀 | 强逆光、大面积阴影会让新模特的光影对不上 |
| ❌ 多人同框 | 模型分不清该换哪个人 |
| ❌ 商品被裁切 | 出画的部分只能靠猜，容易长出错误结构 |

---

## 3、三种模式怎么选

| 你的目标 | 选模式 | prompt 要写死的不变量 |
| --- | --- | --- |
| 同款衣服卖给欧美市场 | 换模特换背景 | 商品（款式/颜色/图案/版型/褶皱） |
| 同一套图换季节氛围 | 只换背景 | 商品 + 模特（脸/发型/身材/姿势） |
| 人台图转真人图 | 只换模特 | 商品 + 场景 + 构图 + 光线 |
| 一张图裂变成多年龄段版本 | 只换模特 | 商品 + 场景 + 姿势 + 景别 |

**「参考图相似度」的等价写法**

| 档位 | 写进 prompt |
| --- | --- |
| 50% 相似 | `Borrow the mood, colour grading and lighting style from image 2, but keep the original pose, camera angle and crop from image 1.` |
| 100% 相似 | `Reproduce image 2 exactly for pose, camera angle, crop, background and lighting.` |

**「自动修手」的等价写法**：`Hands must be anatomically correct — five distinct fingers per hand, natural knuckles, no fused or extra digits.`

**「智能匹配模特位置」的等价写法**：`Align the new body to the original garment: shoulder line, chest width, waist and hem must land on the same pixels as in image 1, so the garment does not shift or stretch.`

---

## 4、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；本技能的本质是「保商品、换其余」的定向替换，需要强区域保持与指令跟随）。

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
Run the `dlazy gpt-image-2` command to get results.

```bash
dlazy gpt-image-2 -h

Options:
  --prompt <prompt>            Prompt
  --images [images...]         Images [image: url or local path] (max 5)
  --size <size>                Size [default: auto] (choices: "1024x1024",
                               "1536x1024", "1024x1536", "2048x2048",
                               "2048x1152", "3840x2160", "2160x3840", "auto")
  --imageFormat <imageFormat>  Image Format [default: jpeg] (choices: "jpeg",
                               "png", "webp")
  --quality <quality>          Quality [default: medium] (choices: "low",
                               "medium", "high")
  --dry-run                    Print payload without executing the tool
  --no-wait                    Return generateId immediately for async tasks
  --timeout <seconds>          Max seconds to wait for async completion
                               (default: "1800")
  --input <jsonOrFile>         Inline JSON or @path/to/file.json — merged under
                               flag values (flags win)
  --save <path>                Download the result asset to this local path
                               (mkdir + retry handled for you). A destination
                               path — NOT a response format; for stdout shape
                               use --format
  --batch <n>                  Fan-out N parallel runs (cloud tools only)
                               (default: "1")
  -h, --help                   display help for command
```

> Any flag also accepts pipe references — `-` (auto-pick from upstream stdin), `@N` (n-th output), `@N.path` (jsonpath into output), `@*` (all primary values), `@stdin` / `@stdin:path` (whole envelope). See `dlazy --help` for details.

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[原模特图]`；带参考图时 `[原模特图, 参考图]`；固定模特时再追加 `模特脸图` | 顺序即 prompt 中的 image 1 / 2 / 3 |
| `--size` | 与原图比例一致（竖版 `1024x1536`，方图 `1024x1024`） | 换人不该改变构图比例 |
| `--quality` | `medium` 常规；`high` 保面料纹理 | 只换人时纹理容易被抹平 |
| `--imageFormat` | `jpeg` | 电商上架通用格式 |
| `--batch` | `3` ~ `4` | 换人随机性大，尤其手部 |
| `--save` | `docs/one-shot/output-<市场>-<sku>.jpg` | 按投放市场归档 |

### Output Format

```json
{
  "ok": true,
  "result": {
    "tool": "gpt-image-2",
    "modelId": "gpt-image-2",
    "data": {
      "urls": [
        "https://files.dlazy.com/data/ai/20260817092703-057827edb8aa.jpg"
      ]
    },
    "savedPath": "docs/one-shot/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 换模特换背景
dlazy gpt-image-2 \
  --prompt 'Replace the model and the background while keeping the garment untouched. Keep the garment exactly as it is: same colour, cut, logo, folds and hem. Replace the person with a different model of similar build, and replace the background with a sunlit outdoor city street with soft bokeh. Keep the same pose, camera angle, crop and framing.' \
  --images docs/one-shot/source-model.jpg \
  --size 1024x1536 --quality medium

# complex call: 只换模特 + 严格照抄参考姿势 + 固定模特脸 + 修手 + 出 4 张
dlazy gpt-image-2 \
  --prompt 'Replace only the model. Image 1 is the source photo, image 2 is the pose/scene reference, image 3 is the target model face. Keep the garment 100% identical to image 1 — same colour, knit texture, print placement, silhouette and hem. Reproduce image 2 exactly for pose, camera angle, crop, background and lighting. Use the face and body type from image 3. Align the new body to the original garment: shoulder line, chest width, waist and hem must land on the same pixels as in image 1. Hands must be anatomically correct — five distinct fingers per hand, no fused or extra digits. Photorealistic, no text, no watermark.' \
  --images docs/one-shot/source-model.jpg docs/one-shot/pose-ref.jpg docs/one-shot/model-face.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --batch 4 --save docs/one-shot/output-eu-sku001.jpg

# 先估价不真跑
dlazy gpt-image-2 --dry-run --prompt '...' --images a.jpg --size 1024x1536
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

```text
Replace [the model / the background / the model and the background] of this e-commerce photo
while keeping the garment untouched.

Keep the [商品描述] exactly as it is: same [颜色], same [版型/剪裁], same [印花/logo 位置],
same folds and hem.

Replace the person with [新模特描述：性别 / 年龄 / 肤色 / 身材].
Replace the background with [新场景描述].

Keep the same pose, camera angle, crop and framing.
Align the new body to the original garment: shoulder line, chest width, waist and hem
must land on the same pixels as in image 1.
Hands must be anatomically correct — five distinct fingers per hand, no fused or extra digits.

Photorealistic catalog shot, natural light, no text, no watermark.
```

**按模式裁剪模板**

| 模式 | 删掉哪句 / 加哪句 |
| --- | --- |
| 只换背景 | 删掉 `Replace the person with …`，加 `Keep the model identical — same face, hair, body and pose.` |
| 只换模特 | 删掉 `Replace the background with …`，加 `Keep the background, props, framing and lighting pixel-identical to image 1.` |
| 人台图转真人 | 加 `The source shows the garment on a headless mannequin. Replace the mannequin with a real human model of [描述], adding a natural head, neck, arms and hands. Keep the garment fit exactly as the mannequin shows it.` |

---

## 6、执行流程

1. **确认模式**：查第三节表格，明确哪些是不变量。
2. **校验输入**：商品是否完整无遮挡、是否单人、光线是否均匀。
3. **写不变量**：先把「保什么」写全（商品的颜色/版型/图案/褶皱），再写「换什么」。
4. **加位置对齐句 + 修手句**——这两条几乎每次都要，能显著降低返工率。
5. **有参考图时选相似度**：借氛围用 50% 档写法，严格复刻用 100% 档写法。
6. **`--dry-run` 估价** → 真跑 → `--batch 3~4` 挑图，落盘到 `docs/one-shot/`。
7. **质检**：商品是否被改（重点看图案位置和版型）、衣服是否错位、手部、光影是否统一。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 衣服跟着人一起变了 | 不变量写得不够具体 | 逐项写死颜色 / 版型 / 图案位置 / 下摆弧线 |
| 换人后衣服错位、被拉伸 | 新身体与原商品没对齐 | 加位置对齐句（第三节） |
| 手指崩坏 | 换人时手部重绘 | 加修手句 + `--batch 4` 挑图 |
| 只换背景却把人也换了 | 模式句不完整 | 补 `Keep the model identical — same face, hair, body and pose.` |
| 新背景光线和人对不上 | 未约束光向 | 追加 `Match the new background lighting to the light direction on the model in image 1.` |
| 面料纹理被抹平 | `--quality medium` | 改 `--quality high`，或换图后接 [material-enhancement](../material-enhancement/skill.md) |
| 人台图转真人后脖子/手很怪 | 缺少补全指令 | 用第五节人台图专用句，明确要求补出头颈与手臂 |

---

## Tips

Visit https://dlazy.com for more information.
