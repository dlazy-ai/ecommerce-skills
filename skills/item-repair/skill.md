---
name: item-repair
description: 一键提升商品图质感（商品精修）。一次上传同一商品的 1-4 张图，输出精修后的高质感商品图与多角度产品图。提供模板：平铺图精修（摊平、对称、去褶皱、匀光）、服装去皱（压平随机褶皱与折痕）、通用精修（去杂物、匀光、提纯背景）、自定义；并带材质增强开关。商品的款式、颜色、图案、五金与结构保持不变，只有褶皱、对称性、光照均匀度、背景纯净度与清晰度被改善。适用于把手机随手拍的商品图提升到可上架水平、批量清理仓库拍摄的平铺图、为主图位准备干净的精修素材。当用户需要「商品精修」「去褶皱」「平铺图精修」「提升商品图质感」「衣服压平」时使用本技能。
---

# item-repair — 一键提升商品图质感

把**随手拍的商品图**修成**可上架的精修图**：压平褶皱、摆正对称、匀光、提纯背景。

和 [material-enhancement](../material-enhancement/skill.md) 的分工：material-enhancement 修**面料纹理**（在模特图上），本技能修**摆放与光照**（在商品图上）。两者可以串起来用。

---

## 1、能力边界

| 模板 | 做什么 |
| --- | --- |
| 平铺图精修 | 摊平、左右对称、方正肩线、袖长对齐、去褶皱、匀光、纯净背景 |
| 服装去皱 | 只压平随机褶皱与折痕，保留结构性褶（褶裥、抽绳、垂坠） |
| 通用精修 | 去画面杂物、匀光、提纯背景、提升清晰度（非服装类目也适用） |
| 自定义 | 自己描述要修什么 |

| 附加 | 说明 |
| --- | --- |
| 多图输入 | 同一商品 1-4 张，模型综合多角度信息理解结构 |
| 材质增强 | 开关；开启后表面纹理更清晰（等价于 `--quality high`） |

**不做**：不改款式、颜色、图案、五金与结构；不压平结构性褶皱（褶裥、抽绳、荷叶边）；不用于把次品图修成正品图。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**输入建议**

| 做法 | 说明 |
| --- | --- |
| ✅ 同一商品多角度 | 1-4 张，正面 + 背面 + 细节，模型能更准地推断结构 |
| ✅ 商品完整入画 | 出画部分只能靠编 |
| ✅ 光线不要太杂 | 混合色温的光很难匀 |
| ❌ 商品有明显破损/污渍 | 修图不该掩盖商品缺陷 |
| ❌ 多个不同商品同框 | 一次只修一个商品 |

---

## 3、四个模板的 prompt 写法

| 模板 | prompt 主体 |
| --- | --- |
| 平铺图精修 | `Press out the random wrinkles and creases, straighten and symmetrise the silhouette, square the shoulders, align both sleeves evenly, tidy the collar and hem, and even out the lighting so there is no hot spot or colour cast.` |
| 服装去皱 | `Remove only the random wrinkles and packing creases. Preserve every structural fold — pleats, gathers, drawstring ruching and intentional drape must stay exactly as they are.` |
| 通用精修 | `Remove stray objects, dust and reflections from the frame, even out the lighting, purify the background to a clean seamless [颜色], and raise overall clarity.` |
| 自定义 | 自己写；建议保留下面的保真句 |

**保真句（四个模板都要带）**：

```text
Keep the [款式/图案/五金/结构] and the exact [颜色] unchanged and sharper than before.
```

**背景句**：`Pure white seamless background with a subtle soft contact shadow.`

**去皱的关键区分**：一定要写清「结构性褶皱不许动」，否则百褶裙会被压成一片平板。

---

## 4、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型 + `--quality high`；精修要求「结构与颜色零变化、摆放与光照重整」，且支持一次传 1-4 张同商品多视角）。

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
| `--images` | `[图1]` ~ `[图1, 图2, 图3, 图4]`（同一商品多视角） | 对应原站「同一商品 1-4 张」 |
| `--size` | `1024x1024`（平铺方图）/ `1024x1536`（长款竖版） | 平铺主图通常方图 |
| `--quality` | `high`（等价「材质增强」开启） | 精修的价值在细节 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` | 对称化结果有随机性 |
| `--save` | `docs/item-repair/output-<sku>-retouched.jpg` | 与原图分开归档 |

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
    "savedPath": "docs/item-repair/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 平铺图精修
dlazy gpt-image-2 \
  --prompt 'Studio retouch of a flat-lay garment photo. Press out the random wrinkles and creases, straighten and symmetrise the silhouette, square the shoulders, align both sleeves evenly, tidy the collar and hem, and even out the lighting. Keep the pattern, colour, ribbing and label unchanged and sharper than before. Pure white seamless background with a subtle soft contact shadow. No text.' \
  --images docs/item-repair/source-flatlay.jpg \
  --size 1024x1024 --quality high

# complex call: 同一商品 4 个视角一起传 + 服装去皱（保留结构褶）
dlazy gpt-image-2 \
  --prompt 'Studio retouch of a garment photo. Images 1-4 are the same product from different angles; use them together to understand the construction. Remove only the random wrinkles and packing creases from the main view. Preserve every structural fold — pleats, gathers, drawstring ruching and intentional drape must stay exactly as they are. Keep the style, colour, print placement, hardware and stitching unchanged and sharper than before. Even out the lighting with no hot spot or colour cast. Pure white seamless background with a subtle soft contact shadow. Photorealistic, print-ready, no text, no watermark.' \
  --images docs/item-repair/v1.jpg docs/item-repair/v2.jpg docs/item-repair/v3.jpg docs/item-repair/v4.jpg \
  --size 1024x1024 --quality high --imageFormat jpeg \
  --batch 2 --save docs/item-repair/output-sku001-retouched.jpg

# 批量精修仓库拍摄的平铺图
for f in docs/item-repair/raw/*.jpg; do
  dlazy gpt-image-2 \
    --prompt 'Studio retouch of a flat-lay garment photo. Press out random wrinkles, symmetrise the silhouette, square the shoulders, align both sleeves, tidy collar and hem, even out the lighting. Keep the pattern, colour, hardware and structure unchanged and sharper than before. Pure white seamless background with a subtle soft contact shadow. Photorealistic, print-ready, no text.' \
    --images "$f" --size 1024x1024 --quality high --imageFormat jpeg \
    --save "docs/item-repair/retouched/$(basename $f)"
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
Studio retouch of a [品类] product photo.
[多图时：Images 1-N are the same product from different angles; use them together
to understand the construction.]

[从第三节选一个模板的 prompt 主体]

Keep the [款式/图案/五金/结构] and the exact [颜色] unchanged and sharper than before.

Pure white seamless background with a subtle soft contact shadow.
Photorealistic, print-ready, no text, no watermark.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 结构褶皱被压平了 | `Do not flatten structural folds: [褶裥/抽绳/荷叶边] must remain fully three-dimensional.` |
| 修成了另一款 | `The silhouette, seam lines and hardware positions must match the source exactly.` |
| 背景没提纯 | `The background must be a single flat [颜色] with no gradient, texture or vignette.` |
| 商品被磨皮 | `Preserve fabric micro-texture; do not smooth the surface into plastic.` |
| 对称化过头、变形 | `Symmetrise only the layout, not the garment proportions.` |
| 缺陷被抹掉了 | `Do not remove holes, stains or damage — only fix wrinkles, layout and lighting.` |

---

## 6、执行流程

1. **选模板**（第三节）：平铺精修 / 只去皱 / 通用精修 / 自定义。
2. **多视角就一起传**：同一商品最多 4 张，模型能更准地理解结构。
3. **写保真句 + 背景句**；如果商品有结构性褶皱，务必加「不许压平」句。
4. **`--quality high`** → `--batch 2` 挑图，落盘到 `docs/item-repair/`。
5. **并排对比原图**：结构褶是否还在、五金位置是否没动、有没有被磨皮、商品缺陷有没有被不当抹除。
6. **需要面料纹理进一步提升**时，接 [material-enhancement](../material-enhancement/skill.md)。

---

## 7、生成效果示例

| 输入：原商品图 |
| --- |
| <img src="../../docs/item-repair/source-flatlay.jpg" width="280"> |
| `source-flatlay.jpg` — 军绿麻花针织毛衣平铺图（袖身有随机褶皱、左右不完全对称），800×800 |

实际执行的命令（平铺图精修 + 材质增强）：

```bash
dlazy gpt-image-2 \
  --prompt 'Studio retouch of a flat-lay garment photo. Clean up this olive-green cable-knit sweater to catalog standard: press out the random wrinkles and creases in the body and sleeves, straighten and symmetrise the silhouette, square the shoulders, align both sleeves evenly, tidy the collar and hem, and even out the lighting so there is no hot spot or colour cast. Keep the cable-knit and diamond stitch pattern, the exact olive-green colour, the ribbed collar/cuffs/hem and the woven cuff label unchanged and sharper than before. Pure white seamless background with a subtle soft contact shadow. Photorealistic, print-ready, no text, no watermark.' \
  --images docs/item-repair/source-flatlay.jpg \
  --size 1024x1024 --quality high --imageFormat jpeg \
  --save docs/item-repair/example-output.jpg
```

**输出**

<img src="../../docs/item-repair/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024，60 credits。随机褶皱被压平、肩线方正、两只袖子长度与角度对齐、下摆罗纹平整、光照均匀无高光斑；麻花与菱形织法、军绿色、罗纹结构与右袖织标保留且比原图更清晰，背景提纯为白底带柔和接地投影。

---

## 8、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 百褶/抽绳被压平 | 未区分结构褶 | 追加禁止压平结构褶句 |
| 修成了另一个款式 | 未锁定结构 | 追加轮廓/缝线/五金位置对齐句 |
| 表面被磨皮成塑料 | 过度平滑 | 追加保留微观纹理句；`--quality high` |
| 背景还是有渐变 | 未要求纯色 | 追加单色背景句 |
| 对称化把版型改窄了 | 过度对称 | 追加「只对称布局不改比例」句 |
| 商品的破损被抹掉 | 不当修图 | 追加禁止抹除缺陷句——这条是合规红线 |

---

## Tips

Visit https://dlazy.com for more information.
