---
name: fabric-on-body
description: 一键替换服装面料。上传一张服装版式图（款式/版型参考）和一张面料图（面料小样、布料特写），在保留原版型的前提下把服装换成新面料，生成真实样衣效果图。可指定服装类型。版型、剪裁、领口袖口下摆结构、缝线位置与拍摄角度全部保持不变，只有材质与其对应的光泽、垂坠感、褶皱形态发生变化。适用于面料商与服装厂在打样之前预览样衣、一个版型快速铺出多种面料的 SKU、开发季前做面料选型对比，避免每种面料都实打一件样衣。当用户需要「换面料」「面料上身」「同一版型换布料」「面料替换样衣」「不打样先看效果」时使用本技能。
---

# fabric-on-body — 一键替换服装面料

**版型不动，面料换掉**。给一张服装版式图 + 一张面料小样，输出这个版型用新面料做出来的样衣效果图。

价值在打样前：一个版型试 8 种面料，传统做法是打 8 件样衣（每件几天、几百块）；这里是 8 次生成。

---

## 生成效果示例

| 输入：服装版式图 | 输入：面料图 |
| --- | --- |
| <img src="../../docs/fabric-on-body/style-sheet.jpg" width="260"> | <img src="../../docs/fabric-on-body/fabric-swatch.jpg" width="260"> |
| `style-sheet.jpg` — 落肩宽松圆领毛衣版型，800×800 | `fabric-swatch.jpg` — 象牙白真丝缎面小样，640×640 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Fabric replacement for a garment style sheet. Image 1 is the garment pattern/style reference: an oversized drop-shoulder crewneck sweater with ribbed collar, cuffs and hem. Image 2 is the target fabric: ivory silk satin with a soft lustrous sheen and fine weave. Re-render the exact same garment silhouette from image 1 in the fabric from image 2. Keep the pattern identical: same oversized drop-shoulder cut, same body length, same sleeve length, same collar/cuff/hem construction, same flat-lay layout and camera angle. Replace only the material — the sweater must now read as ivory silk satin with specular highlights on the folds and soft drape instead of chunky knit. Clean white background, even studio light, no text.' \
  --images docs/fabric-on-body/style-sheet.jpg docs/fabric-on-body/fabric-swatch.jpg \
  --size 1024x1024 --quality medium --imageFormat jpeg \
  --save docs/fabric-on-body/example-output.jpg
```

**输出**

<img src="../../docs/fabric-on-body/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。落肩剪裁、身长袖长、罗纹领口袖口下摆的结构与平铺角度都与版式图一致；材质从粗针织变成象牙白真丝缎面，褶皱上出现高光、垂坠变得柔顺，罗纹部位仍以缎面质感保留。

---

## 1、能力边界

| 输入 | 说明 |
| --- | --- |
| 服装版式图 | 决定版型、剪裁、结构与拍摄角度 |
| 面料图 | 决定材质、纹理、光泽与垂坠感（面料小样特写最佳） |
| 服装类型 | 帮助模型理解结构（上装 / 下装 / 连衣裙 / 外套 / 内衣） |

| 保持不变 | 会改变 |
| --- | --- |
| 版型与剪裁、身长袖长、领口/袖口/下摆结构、缝线位置、拍摄角度与构图 | 材质与织法、表面光泽、垂坠与褶皱形态、厚度观感 |

**不做**：不改版型比例；不改变服装的结构设计；不承诺真实打样的手感与克重——输出是视觉预览，不是工艺样衣。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**版式图（✅）**：纯色背景、结构清晰、正面完整的平铺图或人台图。

**面料图（✅）**：面料小样特写，能看清织纹与光泽；有褶皱转折更好（能交代垂坠）。

**会明显拉低效果的输入（❌）**

| 问题 | 说明 |
| --- | --- |
| 面料图拍太远 | 看不清织纹，只会当成一块纯色 |
| 面料图带强环境色 | 黄光下拍的白布会换成米黄色 |
| 版式图有复杂印花 | 原印花会和新面料打架，先用 [item-repair](../item-repair/skill.md) 或换素图 |
| 面料与品类不匹配 | 硬挺牛仔布做不出吊带裙的垂坠，模型会硬凑 |

---

## 3、面料替换的关键：写清「材质带来的物理变化」

只说「换成真丝」不够——模型不知道该怎么改光影。要把材质翻译成**可画出来的物理特征**：

| 面料 | 要写的物理特征 |
| --- | --- |
| 真丝 / 缎面 | `lustrous specular highlights along the folds, fluid drape, soft continuous gradients` |
| 粗针织 | `chunky knit loops with visible yarn twist, matte fibre halo, structured heavy drape` |
| 牛仔 | `twill diagonal weave, slight slub texture, stiff drape with sharp fold creases` |
| 灯芯绒 | `vertical wale ridges catching light, matte pile, medium-stiff drape` |
| 雪纺 | `semi-sheer, very light drape with many fine ripples, soft diffused light through the fabric` |
| 皮革 | `low-frequency specular sheen, grain texture, stiff drape with broad soft creases` |
| 摇粒绒 | `dense short pile, fuzzy silhouette edge, no specular highlight` |

**再加一句「版型不许动」**——这是本技能最容易失守的地方：

```text
Keep the pattern identical: same cut, same body length, same sleeve length,
same collar/cuff/hem construction, same flat-lay layout and camera angle.
Replace only the material.
```

---

## 4、dLazy 工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；面料替换要求「几何完全不动、材质完全改变」，是典型的定向属性替换任务）。

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
| `--images` | `[版式图, 面料图]` | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | 与版式图比例一致（`1024x1024` 平铺 / `1024x1536` 人台竖版） | 换料不该改构图 |
| `--quality` | `high` | 材质是本技能的唯一产出，必须 high |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` ~ `3` | 垂坠形态有随机性 |
| `--save` | `docs/fabric-on-body/output-<版型>-<面料>.jpg` | 版型 × 面料矩阵命名 |

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
    "savedPath": "docs/fabric-on-body/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 一个版型换一种面料
dlazy gpt-image-2 \
  --prompt 'Fabric replacement. Image 1 is the garment pattern reference, image 2 is the target fabric. Re-render the exact same garment silhouette from image 1 in the fabric from image 2. Keep the pattern identical: same cut, body length, sleeve length, collar/cuff/hem construction, layout and camera angle. Replace only the material. Clean white background, even studio light, no text.' \
  --images docs/fabric-on-body/style-sheet.jpg docs/fabric-on-body/fabric-swatch.jpg \
  --size 1024x1024 --quality high

# complex call: 一个版型 × 多种面料，跑成一个选型矩阵
STYLE=docs/fabric-on-body/style-sheet.jpg
KEEP='Keep the pattern identical: same oversized drop-shoulder cut, same body length, same sleeve length, same collar/cuff/hem construction, same flat-lay layout and camera angle. Replace only the material.'
for F in satin corduroy denim fleece; do
  case $F in
    satin)    PHYS='lustrous specular highlights along the folds, fluid drape, soft continuous gradients' ;;
    corduroy) PHYS='vertical wale ridges catching light, matte pile, medium-stiff drape' ;;
    denim)    PHYS='twill diagonal weave, slight slub texture, stiff drape with sharp fold creases' ;;
    fleece)   PHYS='dense short pile, fuzzy silhouette edge, no specular highlight' ;;
  esac
  dlazy gpt-image-2 \
    --prompt "Fabric replacement for a garment style sheet. Image 1 is the garment pattern/style reference. Image 2 is the target fabric. Re-render the exact same garment silhouette from image 1 in the fabric from image 2. $KEEP The garment must now read as $F: $PHYS. Clean white background, even studio light, no text." \
    --images "$STYLE" "docs/fabric-on-body/swatch-$F.jpg" \
    --size 1024x1024 --quality high --imageFormat jpeg \
    --save "docs/fabric-on-body/output-drop-shoulder-$F.jpg"
done

# 先估价不真跑
dlazy gpt-image-2 --dry-run --prompt '...' --images a.jpg b.jpg --size 1024x1024 --quality high
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
Fabric replacement for a garment style sheet.
Image 1 is the garment pattern/style reference: [品类 + 版型描述].
Image 2 is the target fabric: [面料名 + 颜色 + 光泽描述].

Re-render the exact same garment silhouette from image 1 in the fabric from image 2.

Keep the pattern identical: same [剪裁], same body length, same sleeve length,
same [领口/袖口/下摆结构], same [缝线位置], same layout and camera angle.

Replace only the material — the garment must now read as [面料名]:
[第三节表格里对应的物理特征].

Clean [背景色] background, even studio light, no text.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 版型跟着变了 | `The silhouette outline must be pixel-aligned with image 1. Only surface material may differ.` |
| 面料颜色偏了 | `Sample the fabric colour from image 2 under neutral light; do not shift hue or add colour cast.` |
| 换完还是原来的质感 | 把物理特征写得更极端，并追加 `The original [原面料] texture must be completely gone.` |
| 垂坠不对 | `Drape stiffness: [very fluid / medium / stiff]. Fold count and fold radius must match a [面料] of about [克重] gsm.` |
| 缝线/罗纹消失了 | `Preserve construction details: [罗纹/明线/拉链] must remain visible in the new material.` |

---

## 6、执行流程

1. **备素材**：版式图（结构清晰、印花越少越好）+ 面料小样特写（能看清织纹）。
2. **翻译材质**：查第三节表格，把面料名换成物理特征描述。
3. **写版型锁定句**：剪裁 / 身长 / 袖长 / 领口袖口下摆 / 缝线 / 角度，逐项写死。
4. **`--quality high` 起跑**，比例跟随版式图。
5. **要做选型矩阵**：用第四节循环，一个版型 × N 种面料。
6. **质检**：版型轮廓是否与原图对齐、面料颜色是否准、质感是否真的换掉了、缝线罗纹是否还在。
7. **交付时注明这是视觉预览**，不代表真实手感与克重。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 版型变了 | 未锁定轮廓 | 追加 `silhouette outline must be pixel-aligned with image 1` |
| 面料颜色不对 | 面料图带环境色 | 重拍面料小样（中性光），或追加取色约束句 |
| 质感没换掉 | 物理特征写得太弱 | 用第三节表格的极端描述 + `original texture must be completely gone` |
| 垂坠像纸板 | 未指定垂坠刚度 | 追加 drape stiffness 句，给出克重参考 |
| 罗纹/明线消失 | 被新材质吞掉 | 追加保留结构细节句 |
| 面料与品类物理上不成立 | 硬挺布做垂坠款 | 换匹配的面料，或改版型 |

---

## Tips

Visit https://dlazy.com for more information.
