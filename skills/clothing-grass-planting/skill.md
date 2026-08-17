---
name: clothing-grass-planting
description: 相同穿搭改模特场景姿势（种草图）。上传一张已有的穿搭图，保持整套穿搭完全不变，把模特、场景与姿势换成社交平台种草风格：街拍、咖啡馆、居家、旅行等真实生活场景，自然抓拍姿态与氛围光影。可用参考图决定新的模特、场景与姿势，也可用自定义提示词描述。上衣、下装、鞋、包、配饰的颜色、图案、材质与版型全部保持不变，只有人、地点、动作和光线改变。适用于同一套穿搭铺满小红书/抖音/Instagram 的多篇种草笔记、把棚拍电商图转成生活化种草图、一套衣服产出多个博主风格版本。当用户需要「种草图」「街拍风」「生活场景图」「同一套穿搭换场景」「电商图转种草图」时使用本技能。
---

# clothing-grass-planting — 相同穿搭改模特场景姿势

**穿搭不动，人 / 场景 / 姿势全换**，换成社交平台的种草风格。

和 [one-shot](../one-shot/skill.md) 的区别：one-shot 面向电商主图（保持棚拍规范、构图不动），本技能面向**内容种草**——要的是生活感、抓拍感、氛围光，构图和景别都可以变。

---

## 1、能力边界

| 保持不变 | 会改变 |
| --- | --- |
| 上衣 / 下装 / 鞋 / 包 / 配饰的颜色、图案、材质、版型与搭配关系 | 模特身份、姿势与动作、场景与背景、光线与色调、机位与景别 |

| 控制方式 | 说明 |
| --- | --- |
| 参考图 | 照抄某张种草图的模特、场景、姿势与光线 |
| 自定义提示词 | 用文字描述目标场景与动作 |

**不做**：不改穿搭的任何一件单品；不生成特定真人的换脸图；不用于伪造他人肖像代言或伪造使用体验。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**输入建议**

| 做法 | 说明 |
| --- | --- |
| ✅ 全身或大半身穿搭图 | 种草图通常要看到整套搭配 |
| ✅ 每件单品都清晰可辨 | 看不清的单品换场景后会被重绘 |
| ✅ 单人 | 多人同框模型分不清主体 |
| ❌ 商品被严重遮挡 | 挡住的部分换姿势后必然变形 |
| ❌ 已带滤镜/文字贴纸 | 会被一起带进新图，先洗干净 |

---

## 3、种草图的场景配方

种草图的说服力来自「像是随手拍的」。四个要素缺一不可：

| 要素 | 写法示例 |
| --- | --- |
| 场景 | `a sunlit tree-lined street outside a coffee shop` / `a bright bedroom with sheer curtains` / `a seaside boardwalk at golden hour` |
| 动作 | `hand in her hair` / `mid-stride walking toward the camera` / `sitting on a step holding a coffee cup` |
| 光线 | `warm dappled daylight through leaves` / `soft window light with visible haze` / `low golden-hour backlight with rim glow` |
| 相机语言 | `shallow depth of field, shot on 50mm, slight film grain, natural colour grading` |

**一套穿搭铺多篇笔记**：固定穿搭描述段，只换这四个要素 → 一套衣服出 5 个场景版本，覆盖不同内容主题（通勤 / 约会 / 旅行 / 居家 / 运动）。

**穿搭锁定句**（必写，逐件点名）：

```text
Keep every garment detail faithful: same [上装描述], same [下装描述],
same [鞋], same [包], same [配饰] — colour, pattern, texture and fit unchanged.
```

---

## 4、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；本技能要「整套穿搭逐件保真 + 人和环境全换」，是对指令跟随要求最高的一类任务）。

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
| `--images` | `[原穿搭图, 场景/模特参考图]`；纯文字描述场景时只传原图 | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | `1024x1536`（社交平台竖版） | 小红书/抖音以 3:4、9:16 为主 |
| `--quality` | `medium` 常规；`high` 面料是卖点时 | 种草图对纹理要求略低于主图 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `3` ~ `4` | 姿势与手部随机性大 |
| `--save` | `docs/clothing-grass-planting/output-<场景>.jpg` | 按内容主题归档 |

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
    "savedPath": "docs/clothing-grass-planting/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 用参考图换模特+场景+姿势
dlazy gpt-image-2 \
  --prompt 'Lifestyle social-commerce photo. Image 1 shows the outfit to keep. Image 2 is the model, pose, scene and lighting reference. Put the complete outfit from image 1 onto the model from image 2. Keep every garment detail faithful — colour, pattern, texture and fit unchanged. Reproduce image 2 for model identity, pose, camera angle, crop, background and colour grading. Photorealistic influencer-style photo, no text, no watermark.' \
  --images docs/clothing-grass-planting/source-outfit.jpg docs/clothing-grass-planting/scene-reference.jpg \
  --size 1024x1536 --quality medium

# complex call: 一套穿搭铺 5 个内容场景（纯文字描述场景）
SRC=docs/clothing-grass-planting/source-outfit.jpg
OUTFIT='Keep the complete outfit from the source image faithful: same light-grey textured sleeveless knit mini dress with mock neckline, same pearl choker, same cream-and-tan tote bag, same silver pointed heels — colour, pattern, texture and fit unchanged.'
CAM='Photorealistic influencer-style photo, shallow depth of field, shot on 50mm, slight film grain, natural colour grading, no text, no watermark.'
for S in street cafe home travel commute; do
  case $S in
    street)  SCENE='on a sunlit tree-lined street, mid-stride walking toward the camera, warm dappled daylight through the leaves' ;;
    cafe)    SCENE='sitting at a marble cafe table holding a coffee cup, soft window light with visible haze' ;;
    home)    SCENE='standing by a bright bedroom window with sheer curtains, hand resting on the frame, soft diffused morning light' ;;
    travel)  SCENE='on a seaside boardwalk at golden hour, hair moving in the wind, low backlight with rim glow' ;;
    commute) SCENE='in a modern office lobby, walking past glass panels, cool even daylight' ;;
  esac
  dlazy gpt-image-2 \
    --prompt "Lifestyle social-commerce photo. Replace the model, pose, scene and lighting: a young woman $SCENE. $OUTFIT $CAM" \
    --images "$SRC" --size 1024x1536 --quality medium --imageFormat jpeg \
    --batch 3 --save "docs/clothing-grass-planting/output-$S.jpg"
done

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

## 5、Prompt 模板

```text
Lifestyle social-commerce photo.

Image 1 shows the outfit to keep: [逐件描述：上装 / 下装 / 鞋 / 包 / 配饰].
Image 2 is the model, pose, scene and lighting reference.   ← 用参考图时保留这行

Put the complete outfit from image 1 onto the model from image 2.

Keep every garment detail faithful: same [上装], same [下装], same [鞋], same [包],
same [配饰] — colour, pattern, texture and fit unchanged.

Reproduce image 2 for the model identity, pose, camera angle, crop, background
and colour grading.
（纯文字版改为：Replace the model, pose, scene and lighting: [场景 + 动作 + 光线]）

Photorealistic influencer-style photo, shallow depth of field, shot on 50mm,
slight film grain, natural colour grading, no text, no watermark.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 某件单品被换掉了 | 把它单独再点一次名，并追加 `This item must appear unchanged; substituting it is a failure.` |
| 太像棚拍，没有生活感 | `Candid snapshot feel: slightly off-centre framing, motion in the hair or fabric, imperfect natural light.` |
| 姿势太僵 | `Natural mid-action pose, weight on one leg, relaxed hands, not posing straight at the camera.` |
| 手部崩坏 | `Hands must be anatomically correct — five distinct fingers, natural knuckles.` |
| 场景抢戏 | `The outfit must remain the visual subject; keep the background softly defocused.` |

---

## 6、执行流程

1. **洗干净输入**：去掉滤镜、文字贴纸（[remove-watermark](../remove-watermark/skill.md)）。
2. **逐件列穿搭**：上装 / 下装 / 鞋 / 包 / 配饰——一件一句，这段整组复用。
3. **定内容主题**：通勤 / 约会 / 旅行 / 居家 / 运动，每个主题对应一组场景 + 动作 + 光线（第三节配方）。
4. **补相机语言**：50mm、浅景深、轻微颗粒——这是「像随手拍」的关键。
5. **`--batch 3~4`** 出多张挑姿势自然的，落盘到 `docs/clothing-grass-planting/`。
6. **质检**：单品是否齐、是否被换、手部、生活感是否够、背景是否抢戏。

---

## 7、生成效果示例

| 输入：原穿搭图 | 输入：场景/模特参考图 |
| --- | --- |
| <img src="../../docs/clothing-grass-planting/source-outfit.jpg" width="240"> | <img src="../../docs/clothing-grass-planting/scene-reference.jpg" width="240"> |
| `source-outfit.jpg` — 浅灰针织连衣裙 + 珍珠项链 + 托特包 + 银色高跟鞋，喷泉庭院 | `scene-reference.jpg` — 咖啡馆门口街拍，手抚头发，树影暖光 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Lifestyle social-commerce photo. Image 1 shows the outfit to keep: a light-grey textured sleeveless knit mini dress with a mock neckline, a pearl choker, a cream-and-tan tote bag and silver pointed heels. Image 2 is the model, pose, scene and lighting reference: a young woman on a sunlit tree-lined street outside a coffee shop, hand in her hair, warm dappled daylight, shallow depth of field. Put the complete outfit from image 1 onto the model from image 2. Keep every garment detail faithful: same grey knit texture, same neckline and hem length, same pearl choker, same tote bag colour blocking. Reproduce image 2 for the model identity, pose, camera angle, crop, street background and colour grading. Photorealistic influencer-style photo, no text, no watermark.' \
  --images docs/clothing-grass-planting/source-outfit.jpg docs/clothing-grass-planting/scene-reference.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/clothing-grass-planting/example-output.jpg
```

**输出**

<img src="../../docs/clothing-grass-planting/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536。连衣裙的浅灰针织纹理、立领、腰线与裙长，珍珠项链的珠径，托特包的米白/棕拼色全部保留；模特、抚发姿势、咖啡馆街景、树影暖光与浅景深照抄参考图。

---

## 8、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 包或鞋被换成别的 | 未逐件点名 | 逐件点名 + 追加「换掉即失败」句 |
| 看起来还是棚拍 | 缺生活感描述 | 追加抓拍感句 + 相机语言 |
| 姿势僵硬像证件照 | 未描述动作 | 追加自然动态姿势句 |
| 手指崩坏 | 换姿势重绘手部 | 追加修手句 + `--batch 4` |
| 裙长/领口变了 | 保真项写得笼统 | 写死领口形状与下摆长度 |
| 一组图风格不统一 | 相机语言段每次都改 | 相机语言段整组逐字不变 |

---

## Tips

Visit https://dlazy.com for more information.
