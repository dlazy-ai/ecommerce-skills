---
name: flat-lay
description: 服装平铺图一键上身试穿。输入一张服装平铺图或真人上身图，配合一张「参考图」（决定模特姿势、拍摄角度、景别与场景）以及可选的固定「模特」，生成保持款式、颜色、面料纹理、印花与吊牌完全一致的模特上身商拍图。支持单件上身（单张衣服）与多件上身（上装图 + 下装图组合成整套 Look）；参考图可按 单图/套图、性别、年龄（婴儿/小童/大童/青少年/青年人/中年人/老年人）、肤色（欧美/非洲/亚洲/其他）、女装/男装/童装、国内/海外、电商/种草 等维度挑选；支持指定模特（性别/年龄/肤色/身材）以保证同一店铺多个 SKU 使用同一张脸；并提供通用、颜色饱和度优化、材质增强、崩坏问题优化、精准选区等专项生成策略。适用于电商详情页、主图、种草图的批量商拍替代真人拍摄。当用户需要「平铺图变模特图」「服装上身」「AI 试穿」「虚拟模特商拍」「一键做同款」时使用本技能。
---

# flat-lay — 服装图一键上身试穿

把一张**服装平铺图**变成**模特上身商拍图**，不用约模特、不用租场地、不用摄影棚。

本技能用 dLazy 的 `gpt-image-2` 实现：以「服装图 + 参考图」双图参考做图像编辑合成，服装保真、姿势场景照抄参考图。

---

## 生成效果示例

| 输入：服装平铺图 | 输入：参考图 |
| --- | --- |
| <img src="../../docs/flat-lay/garment-flatlay.jpg" width="300"> | <img src="../../docs/flat-lay/pose-reference.jpg" width="300"> |
| `garment-flatlay.jpg` — 军绿色麻花针织圆领毛衣，800×800 | `pose-reference.jpg` — 男青年正面站姿、浅灰墙棚拍，768×1024 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'E-commerce on-model product photography. Image 1 is the garment flat-lay: an olive-green cable-knit crewneck sweater. Image 2 is the pose/scene reference. Dress the model from image 2 in the garment from image 1, replacing the grey T-shirt. Keep the garment 100% faithful: identical olive-green color, cable-knit and diamond texture, oversized drop-shoulder fit, ribbed collar and cuffs, and the small woven label on the right cuff. Reproduce the reference exactly for pose, camera angle, crop, body proportions, lighting and the plain light-grey studio wall background. Photorealistic full-frame catalog shot, sharp fabric detail, natural soft light, no text or watermark.' \
  --images docs/flat-lay/garment-flatlay.jpg docs/flat-lay/pose-reference.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --save docs/flat-lay/example-output.jpg
```

**输出**

<img src="../../docs/flat-lay/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536，60 credits，约 60s。

麻花织法、菱形提花、落肩版型、袖口罗纹与右袖织标均被保留；姿势、景别、光线与浅灰背景照抄参考图。

---

## 一、能力边界

| 能力 | 说明 |
| --- | --- |
| 单件上身 | 上传 1 张单件衣服（上装 / 连衣裙 / 连体衣）平铺图或真人上身图 |
| 多件上身 | 分别上传「上装图」+「下装图」，合成为同一个模特身上的一整套 Look |
| 参考图 | 决定模特姿势、拍摄角度、景别、场景与光线；可用素材库，也可用自有商拍图 |
| 指定模特 | 可选。锁定同一张脸，保证同店铺多 SKU 视觉统一；不指定则由参考图中的模特形象决定 |
| 生成策略 | 通用 / 颜色饱和度优化 / 材质增强 / 崩坏问题优化 / 精准选区 |

**不做**：不改款式、不改颜色、不改印花、不修改吊牌文字；不用于伪造他人肖像的商业代言。

---

## 二、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**推荐的输入类型（✅）**

| 类型 | 说明 |
| --- | --- |
| 上装平铺图 | 纯色背景、平铺展开、完整可见 |
| 连体衣 / 连衣裙平铺图 | 单件整体 |
| 真人上身图 | 已有的真人商拍图，用于换姿势换场景 |

**会明显拉低效果的输入（❌）**

| 问题 | 说明 |
| --- | --- |
| 商品被遮挡 | 模特手臂、包袋、道具压住衣服主体 |
| 套装商品 | 一张图里上装+下装+鞋子，单件上身识别不了 → 请改用「多件上身」并拆成两张 |
| 商品不清晰 | 模糊、过曝、低分辨率、强色偏 |

---

## 三、参考图与模特的选择维度

**参考图**（决定姿势与场景，是出图风格的主导变量）

- 维度：`单图 / 套图`
- 类目：`女装 / 男装 / 童装`（多选）
- 地区：`国内 / 海外`（多选）
- 类型：`电商 / 种草`（多选）
- 筛选：性别 `男 / 女`；年龄 `婴儿 / 小童 / 大童 / 青少年 / 青年人 / 中年人 / 老年人`；肤色 `欧美人 / 非洲人 / 亚洲人 / 其他肤色`
- 也可直接用自有参考图（支持批量），或按图搜同类姿势

**模特**（可选，锁定人脸）

- 维度：性别 / 年龄 / 肤色 / 身材，或随机指定
- 指定模特会增加约 1 分钟生成时间

选择建议：

- 想要**款式还原优先** → 参考图选正面站姿、纯色背景、景别与商品一致（上装选半身，连衣裙选全身）。
- 想要**氛围种草优先** → 参考图选带场景的街拍 / 室内生活场景，接受轻微版型偏差。
- **多 SKU 批量** → 固定同一张参考图 + 同一个模特，只换服装图。

---

## 四、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（多图参考的图像编辑合成模型，最多 5 张参考图，支持 1024×1536 竖版商拍比例）。

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
| `--images` | `[服装图, 参考图]`（多件上身时 `[上装图, 下装图, 参考图]`） | 顺序即 prompt 中的 image 1 / 2 / 3 |
| `--size` | `1024x1536`（竖版 3:4，商拍主图）；平铺细节图用 `1024x1024` | 电商主图默认竖版 |
| `--quality` | `high` | 面料纹理与针织结构需要高质量档位 |
| `--imageFormat` | `jpeg` | 电商上架通用格式 |
| `--batch` | `2` ~ `4` | 一次多出几张挑图 |
| `--save` | `docs/flat-lay/output-<sku>.jpg` | 直接落盘，省一步下载 |

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
    "savedPath": "docs/flat-lay/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 单件上身（服装图 + 参考图）
dlazy gpt-image-2 \
  --prompt 'On-model e-commerce photo. Image 1 is the garment flat-lay, image 2 is the pose/scene reference. Dress the model from image 2 in the garment from image 1. Keep the garment identical in color, texture, print and fit. Copy the reference pose, camera angle, crop, lighting and background.' \
  --images docs/flat-lay/garment-flatlay.jpg docs/flat-lay/pose-reference.jpg \
  --size 1024x1536 --quality high

# complex call: 多件上身 + 指定模特 + 一次出 4 张挑图 + 直接落盘
dlazy gpt-image-2 \
  --prompt 'Full-look on-model e-commerce photo. Image 1 is the top flat-lay, image 2 is the bottom flat-lay, image 3 is the pose/scene reference, image 4 is the fixed model face. Dress the model in the top from image 1 and the bottom from image 2. Preserve both garments exactly: color, knit/weave texture, print placement, hem and cuff details. Reproduce image 3 for pose, camera angle, crop, lighting and background. Keep the face and body type from image 4 unchanged. Photorealistic catalog shot, no text, no watermark.' \
  --images docs/flat-lay/top.jpg docs/flat-lay/bottom.jpg docs/flat-lay/pose-reference.jpg docs/flat-lay/model-face.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --batch 4 --save docs/flat-lay/output-sku001.jpg

# 先估价不真跑
dlazy gpt-image-2 --dry-run --prompt '...' --images a.jpg b.jpg --size 1024x1536
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

## 五、Prompt 模板

把中括号内容替换后填入 `--prompt`。**英文 prompt 对服装保真更稳定**。

```text
E-commerce on-model product photography.
Image 1 is the garment flat-lay: [品类 + 颜色 + 面料，例：an olive-green cable-knit crewneck sweater].
Image 2 is the pose/scene reference.

Dress the model from image 2 in the garment from image 1, replacing the garment they are currently wearing.

Keep the garment 100% faithful: identical [颜色], [面料/织法纹理], [版型，例：oversized drop-shoulder fit],
[领口/袖口/下摆细节], and [印花/logo/吊牌位置].

Reproduce the reference exactly for pose, camera angle, crop, body proportions, lighting and background.

Photorealistic full-frame catalog shot, sharp fabric detail, natural soft light, no text or watermark.
```

**按生成策略追加的句子**

| 策略 | 追加到 prompt 末尾 |
| --- | --- |
| 通用（默认） | 不加 |
| 颜色饱和度优化 | `Match the garment color to image 1 exactly — same hue, saturation and brightness; do not boost or wash out the color.` |
| 材质增强 | `Emphasize fabric micro-texture: visible knit loops / weave grain / pile direction, realistic fiber sheen and soft shadow in the folds.` |
| 崩坏问题优化 | `Anatomy must be correct: five fingers per hand, symmetric shoulders, no extra limbs, no melted collar or warped sleeve seams.` |
| 精准选区 | `Change only the garment region. Keep the face, hair, hands, lower body, accessories and background pixel-identical to image 2.` |

---

## 六、执行流程

1. **校验输入**：尺寸 / 分辨率 / 格式，剔除遮挡、套装、模糊图（见第二节）。
2. **判断模式**：单件 → 1 张服装图；整套 → 上装图 + 下装图分开传。
3. **准备参考图**：选一张商拍图，维度对齐目标人群（性别/年龄/肤色/类目/国内海外/电商种草）。
4. **可选固定模特**：批量场景务必固定，保证多 SKU 同一张脸。
5. **写 prompt**：用第五节模板，把服装的颜色、织法、版型、细节写具体——**写得越具体，还原度越高**。
6. **`--dry-run` 估价**，确认 credits 后去掉该参数真跑。
7. **`--batch 2~4` 出多张挑图**，落盘到 `docs/flat-lay/`。
8. **质检**：颜色是否偏、纹理是否糊、印花位置是否移动、手指与领口是否崩坏。不合格 → 按第五节表格追加对应策略句子重跑。

---

## 七、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 颜色偏了 | 平铺图有色偏 / 模型自行调色 | 追加「颜色饱和度优化」句；prompt 里写死具体色名 |
| 纹理糊成一片 | `--quality medium`，或平铺图分辨率低 | 改 `--quality high`；换更清晰的平铺图 |
| 印花 / logo 位置移动 | prompt 未描述位置 | 明确写 `logo centered on left chest, 8cm wide` 之类 |
| 手指、领口崩坏 | 生成随机性 | 追加「崩坏问题优化」句 + `--batch 4` 挑图 |
| 背景 / 人脸被改动 | 模型重绘了整图 | 追加「精准选区」句 |
| 只上传套装图，识别不了单件 | 输入违规 | 拆成上装图 + 下装图，走多件上身 |
| 版型明显不对（宽松变紧身） | 参考图景别与品类不匹配 | 上装选半身参考图，连衣裙选全身参考图 |

---

## Tips

Visit https://dlazy.com for more information.
