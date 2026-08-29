---
name: clothing-grass-planting
description: 同款穿搭换模特换场景做种草图。穿搭图 → 社交平台风格的种草图。当用户说「种草图」「小红书风格」「换场景发帖」「达人图」时使用。
---

# clothing-grass-planting — 相同穿搭改模特场景姿势

**穿搭不动，人 / 场景 / 姿势全换**，换成社交平台的种草风格。

和 [one-shot](../one-shot/skill.md) 的区别：one-shot 面向电商主图（保持棚拍规范、构图不动），本技能面向**内容种草**——要的是生活感、抓拍感、氛围光，构图和景别都可以变。

---

## 生成效果示例

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

## 4、工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；本技能要「整套穿搭逐件保真 + 人和环境全换」，是对指令跟随要求最高的一类任务）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task clothing-grass-planting \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/clothing-grass-planting-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy gpt-image-2 --prompt '...' --images ... --save output/clothing-grass-planting.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[原穿搭图, 场景/模特参考图]`；纯文字描述场景时只传原图 | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | `1024x1536`（社交平台竖版） | 小红书/抖音以 3:4、9:16 为主 |
| `--quality` | `medium` 常规；`high` 面料是卖点时 | 种草图对纹理要求略低于主图 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `3` ~ `4` | 姿势与手部随机性大 |
| `--save` | `docs/clothing-grass-planting/output-<场景>.jpg` | 按内容主题归档 |

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

### 延伸阅读

| 要查什么 | 去哪 |
| --- | --- |
| 认证、多后端配置、输出结构、错误码 | [`references/provider-cli.md`](references/provider-cli.md) |
| `gpt-image-2` 的全部可用参数 | [`references/model-flags.md`](references/model-flags.md) |
| 统一入口的全部选项 | `node scripts/gen.mjs --help` |

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

## 7、常见问题

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
