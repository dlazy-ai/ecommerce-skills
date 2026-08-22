---
name: wear-everything
description: 鞋包等多类型商品一键穿戴。输入一张商品图（鞋、包、手表、眼镜、帽子、围巾、项链、耳饰等非服装类穿戴品），配合一张真人参考图并框定穿戴选区，生成商品被真人正确佩戴／穿着的商拍图。支持单视角图（一张商品图）与多视角图（同一商品多个角度合并识别）；参考图可按性别、年龄、肤色、类目、国内/海外、电商/种草等维度挑选，并可在参考图上编辑选区精确指定商品出现的位置（脸部、手腕、颈部、脚部、肩背）。商品的外形、材质、五金、logo、镜片色与纹理保持不变，只把它自然地「戴上去」。适用于配饰类目替代真人拍摄、快速产出佩戴场景主图与种草图。当用户需要「鞋子上脚」「包包上身」「眼镜试戴」「手表上手」「项链佩戴图」「配饰真人穿戴」时使用本技能。
---

# wear-everything — 鞋包配饰一键真人穿戴

把一张**鞋 / 包 / 手表 / 眼镜 / 帽子 / 围巾 / 项链 / 耳饰**的商品图，变成**真人正确佩戴**的商拍图。

和 [flat-lay](../flat-lay/skill.md) 的区别：flat-lay 处理「穿在身上的衣服」，本技能处理「戴在身上的东西」——商品只占画面的一小块区域，因此**选区（商品出现在参考图的哪个位置）**是成败关键。

---

## 生成效果示例

| 输入：商品图 | 输入：参考图 |
| --- | --- |
| <img src="../../docs/wear-everything/product-sunglasses.jpg" width="280"> | <img src="../../docs/wear-everything/model-reference.jpg" width="280"> |
| `product-sunglasses.jpg` — 玳瑁色方框墨镜，768×1024 | `model-reference.jpg` — 女青年正脸、夜景街拍，768×1024 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'On-model accessory product photography. Image 1 is the product: a pair of tortoise-brown rectangular sunglasses with dark grey lenses. Image 2 is the model/scene reference. Put the sunglasses from image 1 onto the face of the model in image 2, correctly seated on the nose bridge and ears with natural perspective, realistic lens reflections and a soft shadow on the cheekbones. Keep the product 100% faithful: identical frame shape, tortoise-brown acetate color and grain, hinge and temple design, lens tint. Change nothing else — face, hair, scarf, coat, bag chain, night street background, colour grading and crop must stay pixel-identical to image 2. Photorealistic, no text, no watermark.' \
  --images docs/wear-everything/product-sunglasses.jpg docs/wear-everything/model-reference.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/wear-everything/example-output.jpg
```

**输出**

<img src="../../docs/wear-everything/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536。墨镜按正确的鼻梁/耳挂关系落位，镜框玳瑁纹理与镜片色保留；模特五官、围巾千鸟格、夜景街道与色调保持原样。

---

## 1、能力边界

| 能力 | 说明 |
| --- | --- |
| 单视角图 | 上传 1 张商品图（正面或主视角） |
| 多视角图 | 上传同一商品的多个角度，帮助模型理解立体结构（鞋侧面+鞋底、包正面+内里） |
| 参考图 | 提供真人模特、姿势、场景与光线 |
| 选区 | 在参考图上框出商品该出现的位置（眼部 / 手腕 / 颈部 / 脚部 / 肩背 / 头顶） |
| 支持品类 | 鞋、包、手表、眼镜墨镜、帽子、围巾、项链、耳饰、腰带、手套等 |

**不做**：不改商品外形、颜色、五金、logo 与镜片色；不处理服装（用 [flat-lay](../flat-lay/skill.md)）；不用于伪造他人肖像代言。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**推荐的输入类型（✅）**

| 类型 | 说明 |
| --- | --- |
| 时尚皮鞋 | 单只或一双完整入画，主视角 |
| 优雅手表 | 表盘正面清晰，表带完整 |
| 珍珠项链 | 摊开或悬挂，链身完整 |
| 渔夫帽 | 帽型完整，纹理清晰 |
| 防晒墨镜 | 镜框展开，镜片颜色真实 |

**会明显拉低效果的输入（❌）**

| 问题 | 说明 |
| --- | --- |
| 商品不完整 | 只拍到一半的鞋、被裁掉链扣的项链 |
| 挂件过多 | 包上挂满吊饰、丝巾，模型分不清主体 |
| 商品不清晰 | 模糊、过曝、金属反光糊成一片 |

---

## 3、选区：本技能最重要的参数

原站在参考图上直接框选，本技能改用 **prompt 显式指定解剖位置 + 佩戴姿态**，等价且更可控：

| 品类 | 选区描述（写进 prompt） |
| --- | --- |
| 眼镜 / 墨镜 | `seated on the nose bridge and hooked over both ears, temples visible along the cheekbones` |
| 手表 | `on the left wrist, dial facing the camera, strap closed with the buckle on the underside` |
| 项链 | `around the neck, clasp at the nape, pendant centred on the collarbone` |
| 耳饰 | `on the visible earlobe, hanging naturally with correct scale` |
| 帽子 | `on the head, brim angle matching the head tilt, hair falling naturally around it` |
| 围巾 | `wrapped twice around the neck, fringe hanging over the chest` |
| 鞋 | `on both feet, soles contacting the ground with correct perspective and grounded shadows` |
| 包 | `held in the right hand / on the left shoulder, strap resting on the shoulder line with fabric compression` |

**必须同时写死「其他区域不许动」**，否则模型会顺手重绘人脸和背景：

```text
Change nothing else — face, hair, clothing, background, colour grading and crop
must stay pixel-identical to image 2.
```

---

## 4、参考图挑选维度

- 类目：`女装 / 男装 / 童装`；地区：`国内 / 海外`；类型：`电商 / 种草`
- 筛选：性别 `男 / 女`；年龄 `婴儿 / 小童 / 大童 / 青少年 / 青年人 / 中年人 / 老年人`；肤色 `欧美人 / 非洲人 / 亚洲人 / 其他肤色`

挑选建议：

- **必须露出穿戴部位**。戴眼镜要正脸或微侧脸；戴手表要手腕入画且不被袖口遮住；穿鞋要脚部完整不被裙摆挡住。
- **原图上最好没有同类商品**。参考图模特已经戴了另一副眼镜时，模型容易两副叠加——优先选空手空脸的参考图，或在 prompt 里明确 `replace the existing sunglasses`。
- 光线方向要和商品图接近，否则金属反光会不自然。

---

## 5、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（多图参考的图像编辑合成模型，最多 5 张参考图；配饰穿戴属于局部替换，需要强指令跟随与区域保持能力）。

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
| `--images` | `[商品图, 参考图]`；多视角时 `[商品图1, 商品图2, 参考图]` | 顺序即 prompt 中的 image 1 / 2 / 3 |
| `--size` | `1024x1536`（半身/全身佩戴）；`1024x1024`（手腕、耳饰等特写） | 按景别选 |
| `--quality` | `high`（金属、镜片、皮革反光）；`medium`（布类配饰） | 反光材质需要高档位 |
| `--imageFormat` | `jpeg` | 电商上架通用格式 |
| `--batch` | `2` ~ `4` | 佩戴位置有随机性，多出几张挑图 |
| `--save` | `docs/wear-everything/output-<sku>.jpg` | 直接落盘 |

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
    "savedPath": "docs/wear-everything/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 单视角（商品图 + 参考图）
dlazy gpt-image-2 \
  --prompt 'On-model accessory photo. Image 1 is the product, image 2 is the model/scene reference. Put the product from image 1 onto the model in image 2, seated on the nose bridge and hooked over both ears. Keep the product identical in shape, colour, material and logo. Change nothing else — face, hair, clothing, background and crop stay pixel-identical to image 2.' \
  --images docs/wear-everything/product-sunglasses.jpg docs/wear-everything/model-reference.jpg \
  --size 1024x1536 --quality high

# complex call: 多视角商品 + 一次出 4 张挑图 + 直接落盘
dlazy gpt-image-2 \
  --prompt 'On-model accessory photo. Image 1 is the product front view, image 2 is the product side view, image 3 is the model/scene reference. Put the shoes onto both feet of the model in image 3, soles contacting the ground with correct perspective and grounded shadows. Preserve the patent finish, brogue perforation, lacing and lug sole exactly. Change nothing else — the model, clothing, pose, background and colour grading stay identical to image 3. Photorealistic, no text, no watermark.' \
  --images docs/wear-everything/shoe-front.jpg docs/wear-everything/shoe-side.jpg docs/wear-everything/model-reference.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --batch 4 --save docs/wear-everything/output-sku001.jpg

# 先估价不真跑
dlazy gpt-image-2 --dry-run --prompt '...' --images a.jpg b.jpg --size 1024x1536 --quality high
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

## 6、Prompt 模板

```text
On-model accessory product photography.
Image 1 is the product: [品类 + 颜色 + 材质，例：a pair of tortoise-brown rectangular sunglasses with dark grey lenses].
Image 2 is the model / scene reference.

Put the product from image 1 onto the model in image 2, [选区描述，见第三节表格],
with natural perspective, correct scale, realistic [反光/投影描述] and a soft contact shadow.

Keep the product 100% faithful: identical [外形], [颜色与材质], [五金/镜片/纹理], [logo 位置].

Change nothing else — face, hair, clothing, accessories, background, colour grading
and crop must stay pixel-identical to image 2.

Photorealistic, no text, no watermark.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 佩戴位置偏了 | `The product must be anatomically correctly placed — re-check the [部位] alignment against the model's [参照点].` |
| 商品比例不对 | `Match real-world scale: the product's width must be about [X] of the [参照部位] width.` |
| 出现了两个同类商品 | `Remove the existing [同类商品] the model is wearing and replace it with the product from image 1.` |
| 人脸/背景被改动 | `Change only the [部位] region. Keep every other pixel identical to image 2.` |
| 金属/镜片反光假 | `Render physically plausible reflections: [环境] reflected on the [材质], consistent with the light direction in image 2.` |

---

## 7、执行流程

1. **校验输入**：尺寸 / 分辨率 / 格式；剔除不完整、挂件过多、模糊的商品图。
2. **判断视角**：结构简单（眼镜、项链）→ 单视角即可；结构复杂（鞋、包）→ 传 2~3 个角度。
3. **挑参考图**：确认穿戴部位完整露出、没有同类商品遮挡、光向与商品图接近。
4. **写选区**：从第三节表格取对应句子，务必同时写「其他区域不许动」。
5. **`--dry-run` 估价**，确认 credits 后真跑。
6. **`--batch 2~4` 出多张挑图**，落盘到 `docs/wear-everything/`。
7. **质检**：佩戴位置、商品比例、反光合理性、是否叠加了两个商品、人脸是否被改。

---

## 8、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 眼镜歪了 / 悬空 | 未写解剖位置 | 补第三节的选区句，明确鼻梁与耳挂关系 |
| 鞋子没踩在地上 | 缺少接地约束 | 追加 `soles contacting the ground with correct perspective and grounded shadows` |
| 商品尺寸明显偏大偏小 | 模型没有比例参照 | 追加比例句，给出与参照部位的宽度比 |
| 画面里出现两副眼镜 | 参考图模特原本就戴着 | 追加 `replace the existing …`，或换空脸参考图 |
| 人脸被换了 | 模型重绘整图 | 追加 `Change only the [部位] region. Keep every other pixel identical to image 2.` |
| 金属反光像塑料 | `--quality medium` | 改 `--quality high` |
| 包的内里结构错乱 | 只给了正面 | 改多视角图，补内里/侧面 |

---

## Tips

Visit https://dlazy.com for more information.
