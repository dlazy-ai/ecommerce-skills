---
name: remove-watermark
description: 一键去除水印和文字。上传一张图，自动识别并去除画面中的水印、平台 logo、促销文字、价格角标、优惠券条、装饰边框与贴纸，并重建被覆盖区域的原始画面内容，无需手动涂抹选区。适用于把带营销文字的旧主图洗干净后复用、清理竞品图或素材图上的水印与角标、为后续技能（裂变套图、商品换背景、种草图）准备干净输入——因为输入图上的文字会被复制到每一张衍生图里。注意：模型是重建而非像素级修补，重建区域的内容为推断结果。当用户需要「去水印」「去文字」「去掉促销角标」「洗干净主图」「移除 logo」时使用本技能。
---

# remove-watermark — 一键去除水印和文字

把图上的**水印、文字、角标、优惠券条、装饰边框**去掉，并把被挡住的画面补回来。

最常见的用途是**给别的技能准备干净输入**：带文字的图丢给 [fission-pattern](../fission-pattern/skill.md) 或 [clothing-grass-planting](../clothing-grass-planting/skill.md)，那些文字会被复制到每一张衍生图里。

---

## 生成效果示例

| 输入：带水印文字的图 |
| --- |
| <img src="../../docs/remove-watermark/source-watermarked.jpg" width="280"> |
| `source-watermarked.jpg` — 家纺促销主图：红金边框 + 标题 + 活动时间 + 价格气泡 + 满减券条 + 多色可选角标 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Remove every piece of text, price tag, badge, ribbon and decorative promotional frame from this image, and reconstruct what was behind them. Delete the red-and-gold border frame, the large headline, the date line, the price bubble with the number, the coupon banner and the bottom-right colour label. Keep the photograph itself completely unchanged: same bedroom, same bed, same taupe and cream bedding set, same table lamp, same wall art, same perspective, same colour grading and same resolution. Inpaint the cleared areas so the room continues naturally — walls, headboard, floor and bedding must look seamless, with no ghosting, blur patches or leftover letter shapes. Clean product photo, absolutely no text.' \
  --images docs/remove-watermark/source-watermarked.jpg \
  --size 1024x1024 --quality medium --imageFormat jpeg \
  --save docs/remove-watermark/example-output.jpg
```

**输出**

<img src="../../docs/remove-watermark/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。红金边框、标题、活动时间、价格气泡、满减券条与角标全部清除，墙面、床头、地板与四件套接续自然，无字形残影；卧室、床品配色、台灯与墙上装饰画保留。

> 注意：对比原图可以看到房间透视被轻微重构了——这是重建而非像素级修补的正常结果。要严格保留原始像素请用专业修图工具。

---

## 1、能力边界

| 能去掉 | 说明 |
| --- | --- |
| 半透明水印 | 平台水印、店铺水印、防盗水印 |
| 促销文字 | 标题、卖点文案、活动时间 |
| 价格角标 | 圆形/异形价格气泡、满减角标 |
| 优惠券条 | 底部横条、色块条 |
| 装饰边框 | 边框、花纹、丝带 |
| 贴纸 | 表情、箭头、指示图形 |

**重要限制**：本技能是**重建**而不是像素级修补。被覆盖区域的内容是模型**推断**出来的，画面的其余部分也可能被轻微重绘（透视、纹理有细微变化）。要严格保留原始像素，请用专业修图工具。

**不做**：不用于抹除他人的版权水印后冒用图片；不用于抹除品牌标识后冒充自有商品；不用于去除法定标识（认证标、警示语、成分标）。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**输入建议**

| 做法 | 说明 |
| --- | --- |
| ✅ 文字区域背景简单 | 纯色墙、纯色台面上的文字最容易补 |
| ✅ 分辨率高 | 重建质量随原图分辨率提升 |
| ✅ 逐项列出要删的元素 | 只说「去水印」会漏掉边框和角标 |
| ⚠️ 文字压在商品主体上 | 商品被文字挡住的部分是推断的，要人工核对 |
| ❌ 文字覆盖面积超过一半 | 重建出来基本是新图，建议重新做图 |

---

## 3、逐项点名 + 保真锁定

去印的 prompt 是两个清单：**删除清单**和**保留清单**。

```text
【删除清单】Delete: the [边框描述], the [标题文字], the [日期行],
the [价格气泡], the [优惠券条], the [角标].
【保留清单】Keep the photograph itself completely unchanged: same [主体],
same [环境元素逐项], same perspective, same colour grading, same resolution.
【重建要求】Inpaint the cleared areas so the [场景] continues naturally —
[被遮挡的结构] must look seamless, with no ghosting, blur patches or leftover letter shapes.
【硬约束】absolutely no text anywhere in the output.
```

**`no ghosting, blur patches or leftover letter shapes` 这句很关键**——不写的话经常留下模糊的字形轮廓。

**保留清单要逐项列**，只写「保持画面不变」时模型会重构透视。

---

## 4、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；去印的本质是「区域清除 + 语义重建 + 其余保持」，需要能理解画面结构才能把被挡住的部分补得合理）。

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
| `--images` | `[原图]` | 单图输入 |
| `--size` | 与原图比例一致 | 去印不该改构图比例 |
| `--quality` | `high`（重建区域面积大）/ `medium`（只有小水印） | 重建质量与档位正相关 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` ~ `3` | 重建内容有随机性，挑一张最合理的 |
| `--save` | `docs/remove-watermark/output-<sku>-clean.jpg` | 洗干净的版本单独归档 |

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
    "savedPath": "docs/remove-watermark/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 去掉水印和文字
dlazy gpt-image-2 \
  --prompt 'Remove every piece of text, watermark, badge and decorative frame from this image and reconstruct what was behind them. Keep the photograph itself unchanged: same subject, same environment, same perspective, same colour grading. Inpaint the cleared areas so the scene continues naturally, with no ghosting, blur patches or leftover letter shapes. Absolutely no text.' \
  --images docs/remove-watermark/source-watermarked.jpg \
  --size 1024x1024 --quality medium

# complex call: 逐项点名 + 保真锁定 + 出 3 张挑最合理的重建
dlazy gpt-image-2 \
  --prompt 'Remove every piece of text, price tag, badge, ribbon and decorative promotional frame from this image, and reconstruct what was behind them. Delete: the red-and-gold border frame, the large headline, the date line, the price bubble with the number, the coupon banner and the bottom-right colour label. Keep the photograph itself completely unchanged: same bedroom, same bed, same bedding set, same table lamp, same wall art, same perspective, same colour grading and same resolution. Inpaint the cleared areas so the room continues naturally — walls, headboard, floor and bedding must look seamless, with no ghosting, blur patches or leftover letter shapes. Clean product photo, absolutely no text.' \
  --images docs/remove-watermark/source-watermarked.jpg \
  --size 1024x1024 --quality high --imageFormat jpeg \
  --batch 3 --save docs/remove-watermark/output-bedding-clean.jpg

# 批量洗图：作为其他技能的前置步骤
for f in docs/remove-watermark/raw/*.jpg; do
  dlazy gpt-image-2 \
    --prompt 'Remove all watermarks, text, badges and decorative frames; reconstruct the covered areas seamlessly. Keep the photograph unchanged in subject, perspective and colour grading. No ghosting, no blur patches, no leftover letter shapes. Absolutely no text.' \
    --images "$f" --size 1024x1024 --quality high --imageFormat jpeg \
    --save "docs/remove-watermark/clean/$(basename $f)"
done

# 先估价不真跑
dlazy gpt-image-2 --dry-run --prompt '...' --images a.jpg --size 1024x1024 --quality high
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
Remove every piece of text, watermark, badge, ribbon and decorative promotional frame
from this image, and reconstruct what was behind them.

Delete: the [边框], the [标题文字], the [日期/说明行], the [价格气泡],
the [优惠券条], the [角标/贴纸].

Keep the photograph itself completely unchanged: same [主体], same [环境元素逐项],
same perspective, same colour grading and same resolution.

Inpaint the cleared areas so the [场景] continues naturally — [被遮挡的结构逐项]
must look seamless, with no ghosting, blur patches or leftover letter shapes.

Clean product photo, absolutely no text.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 留下模糊字形 | `No residual glyph shapes, no smudged rectangles where text used to be.` |
| 只删了一部分 | 把漏掉的逐项补进删除清单，并追加 `Every one of the listed elements must be gone.` |
| 画面被重构了 | `Do not re-compose the photograph: keep the same camera angle, the same object positions and the same wall/floor lines.` |
| 重建区域纹理不接 | `Continue the existing [墙面/木纹/织物] texture across the cleared area with matching scale and direction.` |
| 商品被文字挡住的部分错了 | `Reconstruct the occluded part of the product from symmetry and the visible portion; do not invent new features.` |

---

## 6、执行流程

1. **列删除清单**：把画面里**每一个**文字/图形元素点名（边框、标题、日期、价格、券条、角标、贴纸）。
2. **列保留清单**：主体 + 环境元素逐项 + 透视 + 色调 + 分辨率。
3. **写重建要求**：明确哪些结构要接得上，并加「无字形残留」句。
4. **`--quality high`**（重建面积大时）→ `--batch 2~3` 挑最合理的一张。
5. **质检**：文字是否全清、有没有字形残影、透视是否被改、被挡住的商品部分是否合理。
6. **交付时说明**：重建区域是推断内容，需要像素级保真请走专业修图。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 留下模糊的字形轮廓 | 未写无残留约束 | 追加 `no residual glyph shapes` 句 |
| 只删掉了一部分元素 | 删除清单不全 | 逐项补齐 + `Every one of the listed elements must be gone.` |
| 透视/构图变了 | 未锁定构图 | 追加禁止重构构图句；这是本技能的固有局限 |
| 重建区域纹理断裂 | 未要求纹理接续 | 追加纹理接续句，指明纹理种类与方向 |
| 被文字挡住的商品补错了 | 那部分是推断的 | 追加对称推断句；关键部位人工核对 |
| 文字覆盖超过一半 | 超出能力边界 | 重新做图，别洗 |

---

## Tips

Visit https://dlazy.com for more information.
