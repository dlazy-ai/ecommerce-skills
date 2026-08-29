---
name: creative-scene
description: 从零创意生图，也可定向改模特、姿势、搭配。一句描述（可选参考图）→ 图。当用户说「创意生图」「生成一张」「改个姿势」「换模板」「随便来张图」时使用。
---

# creative-scene — 输入想象中的画面自由创作图片

**一句话造一张图**。没有素材也能开工——描述人物、穿着、场景、视角，直接出图。

本技能同时收录了一套**可直接复制的指令模板**：改模特、改姿势、改搭配——这些是所有其他技能的通用零件。

---

## 生成效果示例

本技能不需要输入素材——只有一句描述。

实际执行的命令：

```bash
dlazy banana-pro \
  --prompt 'A long-haired young Asian woman wearing a white puff-sleeve lace midi dress, sitting at a marble table inside a French-style cafe, fresh flowers and pastries arranged on the table, warm white colour grading, soft window light, front three-quarter view, waist-up framing, atmospheric editorial portrait, photorealistic, shot on 85mm, shallow depth of field, no text, no watermark.' \
  --aspectRatio 3:4 --imageSize 2K \
  --save docs/creative-scene/example-output.jpg
```

对应的五槽位拆解：

| 槽位 | 内容 |
| --- | --- |
| 人物 | `a long-haired young Asian woman` |
| 穿着 | `white puff-sleeve lace midi dress` |
| 场景 | `marble table inside a French-style cafe, fresh flowers and pastries` |
| 视角/景别 | `front three-quarter view, waist-up framing` |
| 氛围/影调 | `warm white colour grading, soft window light, atmospheric editorial` |

**输出**

<img src="../../docs/creative-scene/example-output.jpg" width="320">

`example-output.jpg` — 3:4 / 2K，18 credits。人物、穿着、法式咖啡馆场景、三分之三正面半身景别与暖白影调全部按描述落位。

这张图可以直接作为后续定向修改的输入——例如接 `把模特的上衣变成黑色高领修身打底衫，保持其他不变` 换搭配。

---

## 1、能力边界

| 模式 | 说明 |
| --- | --- |
| 纯文生图 | 只给描述，凭空造图 |
| 参考图 + 描述 | 带一张图做定向修改（改模特 / 改姿势 / 改搭配） |

| 词库分类 | 说明 |
| --- | --- |
| 室内 / 室外 / 居家 / 街道 | 场景类 |
| 半身 / 全身 / 特写 | 景别类 |
| 场景图 | 完整场景氛围 |
| 改模特 / 改姿势 / 改搭配 | 定向修改类（见第三节） |

**不做**：不生成特定真人的肖像；不生成未成年人的不当内容；不用于伪造商品实拍与使用体验。

---

## 2、描述公式

官方给的参考形式是：**人物 + 穿着，场景氛围，图片视角**。

```text
一个长发小女孩穿灰色打底裤和长款羽绒服白色雪地靴，咖啡店圣诞，全身正面
 └── 人物 ──┘└──────── 穿着 ────────┘  └── 场景 ──┘ └─ 视角 ─┘
```

拆成五个槽位，缺哪个补哪个：

| 槽位 | 例子 |
| --- | --- |
| 人物 | `长发女生` `卷毛非洲小女孩` `35 岁商务男性` `混血模特` |
| 穿着 | `白色泡泡袖蕾丝连衣裙` `军绿麻花毛衣 + 米白阔腿裤 + 白色运动鞋` |
| 场景 | `法式装修风的咖啡店内，鲜花布置` `新疆草原，身后有草原动物` `T台走秀` |
| 视角/景别 | `全身正面` `半身侧面` `下半身图` `颈部特写` `半身背面转头` |
| 氛围/影调 | `明亮的暖白色调，氛围感` `复古色调，写真` `冷色光，明亮色调` |

**电商向的经验**：`写真`、`氛围感`、`明亮的暖白色调` 这类词能显著提升出图的商业可用度；`全身正面` / `半身侧面` 这类明确的景别词能大幅降低构图返工。

---

## 3、三类定向修改模板（可直接复制）

带参考图时，用下面的句式做定向修改。**共同点：都以「保持其余不变」结尾**——这是不跑偏的关键。

**改模特**

```text
将主体改为一个[年龄]岁的[种族][性别][职业类型]模特，她/他有着[五官特征]、[发型]、[肤色]。
保持相同的服装、姿势和背景。
```

细分维度也可以单独改：

| 维度 | 模板 |
| --- | --- |
| 肤色 | `将肤色改为[浅色/浅桃色/温暖的香槟色/蜜色/可可色]。保持原有的面部结构、种族特征、所有面部特征的大小和位置、身体姿态、体型以及光照条件完全不变。` |
| 身材 | `将身材改为[苗条/丰满/稍微丰满/肌肉型]。保持主体完全不变，只改变身材。` |
| 发型 | `将发型改为[双麻花辫/凌乱的丸子头/长发大波浪/低马尾/精灵短发/寸头/背头]。保持角色与背景的一致性，同时保留相同的面部特征、姿势和表情。` |
| 五官 | `将[瞳孔颜色/唇色/眉毛/睫毛/腮红]改为[具体描述]。保持角色与背景的一致性，同时保留相同的姿势和表情。` |

**改姿势**

```text
将姿势改为[姿势描述]。保持完全相同的拍摄角度、面部结构、肤色和体型。
```

常用姿势：`正面站立，双臂自然下垂` / `以自然的步伐朝相机方向走来` / `侧身站立，上半身朝向相机扭转，双手放在背后以展示腰线和侧面轮廓` / `背对镜头站立，回头看向肩膀` / `像模特一样走在T台中间的步伐，一脚向前并扭动臀部` / `坐在地板上，向后倾，用双手在身后支撑身体`

**改搭配**

```text
把模特的[上衣/下装/鞋子/配饰]变成[具体描述]，保持其他不变
```

例：`把模特的上衣变成黑色高领修身打底衫，冬季百搭款，保持其他不变` / `把模特的鞋子变成深棕色8孔马丁靴，硬朗帅气风，保持其他不变`

---

## 4、工具调用

本技能使用 dLazy 的 **`banana-pro`**（高质量文生图模型，可选带参考图；擅长细节主视觉、商品图与品牌风格图像，适合从零造图这一主场景）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task creative-scene \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/creative-scene-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy banana-pro --prompt '...' --images ... --save output/creative-scene.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | 留空（纯文生图）/ `[参考图]`（定向修改，最多 14 张） | 改模特/姿势/搭配时才需要 |
| `--aspectRatio` | `3:4`（电商与种草竖版）/ `1:1` / `9:16`（短视频封面） | 电商竖版为主 |
| `--imageSize` | `1K` 草稿探索 / `2K` 上架 / `4K` 大图与印刷 | 探索阶段用 1K 省成本 |
| `--batch` | `4`（探索期）/ `1`（已定稿） | 文生图靠量取优 |
| `--save` | `docs/creative-scene/output-<主题>.jpg` | 按主题归档 |

> **英文 vs 中文 prompt**：场景与氛围类描述中英文都可以；但**服装的材质与工艺细节用英文更稳定**。定向修改模板用中文即可（第四节的句式实测有效）。

### Command Examples

```bash
# basic call: 纯文生图
dlazy banana-pro \
  --prompt 'A long-haired young Asian woman wearing a white puff-sleeve lace midi dress, sitting at a marble table inside a French-style cafe, fresh flowers on the table, warm white colour grading, soft window light, front three-quarter view, waist-up framing, photorealistic, no text.' \
  --aspectRatio 3:4 --imageSize 2K

# complex call: 探索期一次出 4 张 1K 草稿，定稿后再出 2K
dlazy banana-pro \
  --prompt 'A long-haired young Asian woman wearing a white puff-sleeve lace midi dress, sitting at a marble table inside a French-style cafe, fresh flowers and pastries arranged on the table, warm white colour grading, soft window light, front three-quarter view, waist-up framing, atmospheric editorial portrait, photorealistic, shot on 85mm, shallow depth of field, no text, no watermark.' \
  --aspectRatio 3:4 --imageSize 1K \
  --batch 4 --save docs/creative-scene/draft.jpg

# 定向修改：改姿势（带参考图）
dlazy banana-pro \
  --prompt '将姿势改为侧身站立，上半身朝向相机扭转，双手放在背后以展示腰线和侧面轮廓。保持完全相同的拍摄角度、面部结构、肤色和体型。' \
  --images docs/creative-scene/example-output.jpg \
  --aspectRatio 3:4 --imageSize 2K \
  --save docs/creative-scene/output-pose-side.jpg

# 定向修改：改搭配
dlazy banana-pro \
  --prompt '把模特的上衣变成黑色高领修身打底衫，冬季百搭款，保持其他不变。' \
  --images docs/creative-scene/example-output.jpg \
  --aspectRatio 3:4 --imageSize 2K \
  --save docs/creative-scene/output-swap-top.jpg

# 先估价不真跑
dlazy banana-pro --dry-run --prompt '...' --aspectRatio 3:4 --imageSize 2K
```

### 延伸阅读

| 要查什么 | 去哪 |
| --- | --- |
| 认证、多后端配置、输出结构、错误码 | [`references/provider-cli.md`](references/provider-cli.md) |
| `banana-pro` 的全部可用参数 | [`references/model-flags.md`](references/model-flags.md) |
| 统一入口的全部选项 | `node scripts/gen.mjs --help` |

## 5、Prompt 模板

**纯文生图**（五槽位公式）：

```text
[人物]，穿着[穿着描述]，在[场景描述]，[视角/景别]，[氛围/影调]，
photorealistic, [镜头语言：shot on 85mm, shallow depth of field], no text, no watermark
```

**定向修改**（三类模板见第四节）：

```text
[改模特 / 改姿势 / 改搭配 的句式]。保持[其余要素]完全不变。
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 构图不对（要全身给了半身） | 把景别词放到 prompt 靠前位置，并追加 `full-body framing, head to feet fully in frame` |
| 出图太像插画 | `photorealistic photograph, real fabric texture, natural skin pores, no illustration, no CGI` |
| 手部崩坏 | `hands anatomically correct, five distinct fingers, natural knuckles` |
| 服装细节不受控 | 服装描述改用英文，并写死颜色 / 面料 / 版型 / 领口 |
| 定向修改把别的也改了 | 把「保持其余不变」写得更具体：逐项列出不许动的东西 |
| 一组图风格不统一 | 固定氛围段与镜头语言段逐字不变，只换人物/场景 |

---

## 6、执行流程

1. **判断模式**：从零造图 → 纯文生图；已有图要改 → 带参考图 + 第四节模板。
2. **按五槽位写描述**：人物 / 穿着 / 场景 / 视角 / 氛围，缺一个就补一个。
3. **探索期 `--imageSize 1K --batch 4`** 快速看方向，成本最低。
4. **定稿后 `--imageSize 2K`** 出正式图。
5. **要连续改**（先定人，再改姿势，再改搭配）：把上一步的输出作为下一步的 `--images`，每步只改一个维度。
6. **质检**：构图景别对不对、是否够真实、手部、服装细节是否受控。
7. **要上架的图**建议过一遍 [detect-task](../detect-task/skill.md) 做投前检测。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 要全身却出了半身 | 景别词位置太后 | 景别词提前 + 追加 `head to feet fully in frame` |
| 出图像插画/CG | 缺真实性约束 | 追加 photorealistic + 真实纹理句 |
| 服装细节完全不受控 | 描述太笼统或用中文写材质 | 服装段改英文，写死颜色/面料/版型/领口 |
| 手指崩坏 | 生成随机性 | 追加修手句 + `--batch 4` 挑图 |
| 定向修改改动过大 | 「保持不变」写得太笼统 | 逐项列出不许动的要素 |
| 一组图风格不统一 | 氛围段每次都改 | 固定氛围段与镜头语言段 |
| 成本超预期 | 一直用 2K/4K 探索 | 探索用 `1K` + `--batch 4`，定稿再 2K |

---

## Tips

Visit https://dlazy.com for more information.
