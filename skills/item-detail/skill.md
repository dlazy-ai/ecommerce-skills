---
name: item-detail
description: 一键生成全套商品详情图（商品详情页）。上传一张商品图，选择商品类目（服饰/箱包/鞋品/婴童用品/宠物/家居用品/美妆/3C数码/电器/家具灯饰/食品厨具/珠宝饰品/工业和农业/其他），填写商品信息与卖点（100 字内），生成带中文排版的商品详情页图组：首屏 banner（模特上身图 + 大标题 + 副标题）、卖点图标行、面料/材质说明块、细节展示块、尺码或参数块。商品的款式、颜色与材质保持不变，文案与图标由填写的卖点生成。适用于新品上架需要快速铺出一套详情页视觉、没有设计师时自己产出可用的详情页素材、多 SKU 批量套用同一套详情页版式。当用户需要「详情页」「详情图」「一键生成详情页」「详情页设计」「带文案的商品图」时使用本技能。
---

# item-detail — 一键生成全套商品详情图

一张商品图 + 卖点文案 → **带中文排版的详情页视觉**。

和其他技能的区别：本技能的产出**带文字**。所以模型选型的第一标准是**中文字形渲染能力**——大多数图像模型会把中文画成乱码。

---

## 1、能力边界

| 产出模块 | 说明 |
| --- | --- |
| 首屏 banner | 模特上身图 / 商品图 + 大标题 + 副标题 |
| 卖点图标行 | 3~4 个圆形图标 + 短文案 |
| 材质说明块 | 面料/材质特写 + 说明文字 |
| 细节展示块 | 局部特写 + 工艺说明 |
| 参数块 | 尺码表 / 规格参数 |

| 输入 | 说明 |
| --- | --- |
| 商品图 | 1 张 |
| 商品类目 | `服饰` `箱包` `鞋品` `婴童用品` `宠物` `家居用品` `美妆` `3C数码` `电器` `家具灯饰` `食品厨具` `珠宝饰品` `工业和农业` `其他` |
| 商品信息 | 100 字内的卖点，例：`商品卖点：舒适透气、柔软亲肤，适合入群：1个月-2岁宝宝` |

**不做**：不编造商品没有的功能与认证；不生成虚假促销信息与虚假对比数据；不改商品的款式与颜色。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**输入建议**

| 做法 | 说明 |
| --- | --- |
| ✅ 商品图干净 | 带文字的图会让新排版和旧文字打架，先走 [remove-watermark](../remove-watermark/skill.md) |
| ✅ 卖点写成短句 | `亲肤不扎` 比 `采用优质柔软亲肤面料不刺激皮肤` 好排版 |
| ✅ 文案字数控制 | 主标题 ≤ 8 字，副标题 ≤ 16 字，图标文案 ≤ 5 字 |
| ❌ 一个模块塞十条卖点 | 排不下，会挤成乱码 |
| ❌ 未经核实的功效宣称 | 合规风险 |

---

## 3、中文排版能出对的四个条件

中文详情页最大的失败模式是**乱码**。这四条同时满足才稳定：

| 条件 | 写法 |
| --- | --- |
| 1 · 把每一段文案原文写进 prompt | 用「」括起来：`大字「粗棒麻花 复古落肩」`、`小字「羊毛混纺 · 加厚保暖 · 男女同款」` |
| 2 · 指定字体族与字重 | `字体为无衬线黑体，字号层级分明` |
| 3 · 指定版式关系 | `右上方留白区排版中文标题`、`底部一行三个圆形图标配文字` |
| 4 · 显式要求不乱码 | `中文字必须清晰正确无乱码` |

**文案越短越不容易崩**。四字、六字标题的成功率远高于长句。

**分块生成比一次生成整页更稳**：首屏 banner 一条 prompt，卖点块一条，材质块一条，最后用设计工具拼成长图。一次生成整页时，越往下的模块文字越容易崩。

---

## 4、类目 → 版式基调

| 类目 | 背景与色调 | 文案侧重 |
| --- | --- | --- |
| 服饰 | 米灰 / 燕麦色，暖调，大留白 | 版型、面料、场合 |
| 箱包 / 鞋品 | 深灰渐变，硬光，质感优先 | 材质、容量、耐用 |
| 婴童 / 宠物 | 浅粉 / 奶油色，柔光 | 安全、亲肤、适用月龄 |
| 美妆 | 大理石 / 丝绒，高对比 | 成分、质地、效果 |
| 3C / 电器 | 深色科技风，冷光 | 参数、性能、接口 |
| 家居 / 家具灯饰 | 实景房间，自然光 | 尺寸、材质、搭配 |
| 食品厨具 | 木质餐桌，暖光 | 原料、工艺、口感 |
| 珠宝饰品 | 深色绒布，聚光 | 材质、克重、工艺 |

---

## 5、dLazy 工具调用

本技能使用 dLazy 的 **`seedream-5.0-pro`**（专业档图像模型，在**中文字形与复杂排版**上明显强于同类；本技能的产出带大量中文文案，字形正确率是首要指标）。

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
Run the `dlazy seedream-5.0-pro` command to get results.

```bash
dlazy seedream-5.0-pro -h

Options:
  --prompt <prompt>          Prompt
  --images [images...]       Images [image: url or local path] (max 10)
  --resolution <resolution>  Resolution [default: 2k] (choices: "2k")
  --size <size>              Size [default: 16:9] (choices: "1:1", "4:3",
                             "3:4", "16:9", "9:16", "3:2", "2:3", "21:9")
  --dry-run                  Print payload without executing the tool
  --no-wait                  Return generateId immediately for async tasks
  --timeout <seconds>        Max seconds to wait for async completion (default:
                             "1800")
  --input <jsonOrFile>       Inline JSON or @path/to/file.json — merged under
                             flag values (flags win)
  --save <path>              Download the result asset to this local path
                             (mkdir + retry handled for you). A destination
                             path — NOT a response format; for stdout shape use
                             --format
  --batch <n>                Fan-out N parallel runs (cloud tools only)
                             (default: "1")
  -h, --help                 display help for command
```

> Any flag also accepts pipe references — `-` (auto-pick from upstream stdin), `@N` (n-th output), `@N.path` (jsonpath into output), `@*` (all primary values), `@stdin` / `@stdin:path` (whole envelope). See `dlazy --help` for details.

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[商品图]`（最多 10 张，可加细节图、面料图） | 多图能让各模块用上不同素材 |
| `--size` | `3:4`（首屏 banner）/ `1:1`（卖点方块）/ `9:16`（长条模块） | 分模块生成，各用合适比例 |
| `--resolution` | `2k` | 详情页宽度通常 750~1200px，2K 足够 |
| `--batch` | `2` ~ `3` | 中文排版有随机性，挑字形正确的 |
| `--save` | `docs/item-detail/output-<sku>-<模块>.jpg` | 按模块归档便于拼长图 |

> **成本提示**：`seedream-5.0-pro` 单张约 5 credits，分模块跑 5 条也只有 25 credits，比反复重跑整页便宜。

### Output Format

```json
{
  "ok": true,
  "result": {
    "tool": "seedream-5.0-pro",
    "modelId": "seedream-5.0-pro",
    "data": {
      "urls": [
        "https://files.dlazy.com/data/ai/20260817092703-057827edb8aa.jpg"
      ]
    },
    "savedPath": "docs/item-detail/example-output.jpg"
  }
}
```

> Async tasks (when `--no-wait` is passed) omit `data` and return a `task: { generateId, status }` field instead. Use `dlazy status <generateId> --wait` to poll.

### Command Examples

```bash
# basic call: 首屏 banner
dlazy seedream-5.0-pro \
  --prompt '电商服饰详情页首屏 banner，竖版。左侧是图1 商品的模特上身图，颜色与织法必须与图1一致。右上方留白区排版中文标题，大字「粗棒麻花 复古落肩」，副标题小字「羊毛混纺 · 加厚保暖 · 男女同款」。米灰色背景，暖色调，无衬线黑体，排版整齐对齐，中文字必须清晰正确无乱码。' \
  --images docs/item-detail/product-flatlay.jpg --size 3:4

# complex call: 分模块跑完一整套详情页
SRC=docs/item-detail/product-flatlay.jpg
BASE='米灰色背景，暖色调，留白克制，字体为无衬线黑体，排版整齐对齐，商业电商详情页设计感，中文字必须清晰正确无乱码。'
KEEP='商品的颜色、麻花织法与菱形提花必须与图1完全一致。'

dlazy seedream-5.0-pro --size 3:4 --images "$SRC" --save docs/item-detail/output-sku001-1-banner.jpg \
  --prompt "电商服饰详情页首屏 banner，竖版。左侧是图1 商品的模特上身图（青年男模特，半身，落肩宽松版型）。${KEEP} 右上方留白区排版中文标题，大字「粗棒麻花 复古落肩」，副标题小字「羊毛混纺 · 加厚保暖 · 男女同款」。${BASE}"

dlazy seedream-5.0-pro --size 1:1 --images "$SRC" --save docs/item-detail/output-sku001-2-icons.jpg \
  --prompt "电商详情页卖点图标块，正方形。上方一行三个线性圆形图标，图标下方各配四字中文：「亲肤不扎」「不易变形」「机洗不缩」。下方居中一张商品局部特写。${KEEP} ${BASE}"

dlazy seedream-5.0-pro --size 1:1 --images "$SRC" --save docs/item-detail/output-sku001-3-fabric.jpg \
  --prompt "电商详情页面料说明块，正方形。左侧是面料微距特写，右侧竖排中文说明：标题「粗棒羊毛混纺」，正文两行小字「蓬松保暖不压身」「细腻纱线不刺挠」。${KEEP} ${BASE}"

dlazy seedream-5.0-pro --size 9:16 --images "$SRC" --save docs/item-detail/output-sku001-4-size.jpg \
  --prompt "电商详情页尺码块，长条竖版。顶部中文标题「尺码参考」，下方一张三行四列的简洁尺码表格，表头为「尺码」「衣长」「胸围」「袖长」，内容为 S/M/L 三行数字。${BASE}"

# 先估价不真跑
dlazy seedream-5.0-pro --dry-run --prompt '...' --images a.jpg --size 3:4
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
电商[类目]详情页[模块名]，[比例描述]。

[图片区版式]：[位置] 是图1 商品的[形态：模特上身图 / 平铺图 / 微距特写]。
[保真句]：商品的颜色、[织法/材质]与[图案/结构]必须与图1完全一致。

[文案区版式]：[位置] 排版中文，
  大字「[主标题 ≤8 字]」，
  副标题小字「[副标题 ≤16 字]」，
  [图标行：三个圆形图标配文字「[4字]」「[4字]」「[4字]」]。

[基调]：[类目对应的背景与色调，见第四节]，留白克制，
字体为无衬线黑体，字号层级分明，排版整齐对齐，
商业电商详情页设计感，中文字必须清晰正确无乱码。
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 中文乱码 | 缩短文案；把每段原文再重复一次；追加 `所有中文必须是清晰可读的简体汉字，不得出现变形、缺笔或臆造字。` |
| 文字压在商品上 | `文字区与商品区不得重叠，商品占画面左侧 [X]%，文字区占右侧 [Y]%。` |
| 排版歪 | `所有文字左对齐到同一条基准线，行距均匀。` |
| 商品被改 | `商品区域必须与图1一致，不得重绘款式、颜色或图案。` |
| 图标太花 | `图标为单色细线描风格，线宽一致，不得加渐变或阴影。` |
| 一次出整页文字崩 | 拆成分模块生成（第三节） |

---

## 7、执行流程

1. **洗干净商品图**（[remove-watermark](../remove-watermark/skill.md)），避免新旧文字打架。
2. **定类目 → 取版式基调**（第四节表格）。
3. **把卖点压成短句**：主标题 ≤8 字，副标题 ≤16 字，图标文案 ≤5 字。
4. **拆模块**：banner / 卖点图标 / 材质说明 / 细节 / 尺码——**一个模块一条 prompt**。
5. **每条 prompt 必须包含四个条件**（原文 + 字体 + 版式 + 不乱码，见第三节）。
6. **`--batch 2~3`** 挑字形正确的一张，落盘到 `docs/item-detail/`。
7. **逐字校对中文**（这是最容易出错的地方）→ 用设计工具拼成详情页长图。
8. **合规检查**：卖点是否有依据、有没有虚假促销与绝对化用语。

---

## 8、生成效果示例

| 输入：商品图 |
| --- |
| <img src="../../docs/item-detail/product-flatlay.jpg" width="280"> |
| `product-flatlay.jpg` — 军绿麻花针织毛衣平铺图，800×800 |

实际执行的命令（首屏 banner 模块）：

```bash
dlazy seedream-5.0-pro \
  --prompt '电商服饰详情页首屏 banner，竖版。左侧是图1 中的军绿色麻花针织圆领毛衣的模特上身图（青年男模特，半身，落肩宽松版型），毛衣颜色、麻花织法与菱形提花必须与图1一致。右上方留白区排版中文标题，大字「粗棒麻花 复古落肩」，副标题小字「羊毛混纺 · 加厚保暖 · 男女同款」。底部一行三个圆形图标配文字「亲肤不扎」「不易变形」「机洗不缩」。整体米灰色背景，暖色调，留白克制，字体为无衬线黑体，排版整齐对齐，商业电商详情页设计感，中文字必须清晰正确无乱码。' \
  --images docs/item-detail/product-flatlay.jpg --size 3:4 \
  --save docs/item-detail/example-output.jpg
```

**输出**

<img src="../../docs/item-detail/example-output.jpg" width="320">

`example-output.jpg` — 3:4 / 2K，5 credits。模特上身图占左侧，毛衣的军绿色、麻花与菱形提花保留；右上标题「粗棒麻花 复古落肩」与副标题「羊毛混纺 · 加厚保暖 · 男女同款」字形正确、层级分明；底部三个线描图标配「亲肤不扎」「不易变形」「机洗不缩」，米灰底暖调，排版对齐。

---

## 9、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 中文变乱码 | 文案太长 / 未写不乱码约束 | 缩短文案 + 重复原文 + 追加字形约束句 |
| 越往下的模块文字越崩 | 一次生成整页 | 拆成分模块生成 |
| 文字压在商品上 | 未划分区域 | 追加区域占比句 |
| 图标风格花哨不统一 | 未约束风格 | 追加单色细线描、线宽一致句 |
| 商品被重绘 | 未写保真句 | 追加商品区域保真句 |
| 卖点被模型加油添醋 | 未限制 | prompt 里只给要出现的原文，并追加 `不得添加未提供的文案` |

---

## Tips

Visit https://dlazy.com for more information.
