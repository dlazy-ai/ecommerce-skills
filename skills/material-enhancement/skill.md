---
name: material-enhancement
description: 材质质感增强与纹理重建。糊掉的图 + 高清商品图 → 纹理清晰可信的图。当用户说「增强质感」「图糊了」「补纹理」「提清晰度」时使用。
---

# material-enhancement — 优化服装材质和细节质感

把一张**面料糊掉的商拍图**修成**面料清晰真实**的图，构图和人一动不动。

这是一个**后处理技能**：AI 生成的服装图最容易崩的就是面料——远看还行，放大一看针织变成一片糊。给它一张真实的高清商品图当参照，把表面重建回来。

---

## 生成效果示例

| 输入：原图（待增强） | 输入：高清商品图（真实面料） |
| --- | --- |
| <img src="../../docs/material-enhancement/source-image.jpg" width="240"> | <img src="../../docs/material-enhancement/hires-product.jpg" width="240"> |
| `source-image.jpg` — 军绿麻花毛衣上身图，1024×1536 | `hires-product.jpg` — 同款毛衣高清平铺图，800×800 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Texture enhancement pass. Image 1 is the on-model photo to improve. Image 2 is the high-resolution product photo that defines the true fabric. Rebuild the sweater surface in image 1 using the real texture from image 2: crisp cable-braid relief, visible knit loops and yarn twist, natural wool loft, correct fold shadows and a matte fibre sheen. Do not change anything else — the model face, hair, hands, pose, brown trousers, background, framing and colour grading must stay identical to image 1. The garment silhouette and colour must not shift; only the material fidelity and micro-detail improve. Photorealistic, sharp, no text, no watermark.' \
  --images docs/material-enhancement/source-image.jpg docs/material-enhancement/hires-product.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --save docs/material-enhancement/example-output.jpg
```

**输出**

<img src="../../docs/material-enhancement/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536，60 credits。麻花辫的立体起伏、菱形提花的凹凸、羊毛的绒毛感与褶皱处的暗部层次被重建；模特五官、发型、手部、姿势、棕色长裤、灰墙背景与整体色调保持不变，毛衣轮廓与军绿色未偏移。

---

## 1、能力边界

| 输入 | 作用 |
| --- | --- |
| 原图 | 要改善的商拍图，决定构图、模特、姿势、背景与色调 |
| 高清商品图 | 提供真实面料信息（织法、纹理、绒感、光泽） |
| 服装类型 | 帮助判断哪些表面特征该被强化 |

| 只改 | 不改 |
| --- | --- |
| 面料表面纹理、微观细节、褶皱阴影层次、纤维光泽 | 构图、模特（脸/发/手/姿势）、其他服饰、背景、色调、服装轮廓与颜色 |

**不做**：不改服装轮廓与颜色；不改模特与背景；不把一种面料换成另一种（换面料请用 [fabric-on-body](../fabric-on-body/skill.md)）。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**原图（✅）**：构图与人物都满意、只有面料不行的图。

**高清商品图（✅）**：同一件商品的高分辨率平铺图或特写，能看清织法。

**注意事项**

| 情况 | 说明 |
| --- | --- |
| ⚠️ 两张图必须是同一件商品 | 面料不同的两张图会导致材质张冠李戴 |
| ⚠️ 原图颜色如果已经偏了 | 本技能只管纹理，颜色偏差要在生成阶段解决 |
| ❌ 原图崩坏严重（版型错、结构乱） | 材质增强救不了结构问题，重跑生成 |
| ❌ 原图分辨率极低 | 没有足够信息定位纹理该长在哪 |

---

## 3、材质增强的两条铁律

**铁律一：只改表面，别的一个像素都别动。**

```text
Do not change anything else — the model face, hair, hands, pose, other garments,
background, framing and colour grading must stay identical to image 1.
The garment silhouette and colour must not shift; only material fidelity
and micro-detail improve.
```

**铁律二：把「好质感」翻译成具体的表面特征**，否则模型只会整体加锐化。

| 面料 | 要重建的具体特征 |
| --- | --- |
| 粗针织 | `crisp cable-braid relief, visible knit loops and yarn twist, natural wool loft, matte fibre sheen` |
| 精纺羊毛 | `fine even weave, subtle fibre halo, soft directional sheen` |
| 缎面 | `smooth continuous specular gradients along the folds, no texture noise` |
| 灯芯绒 | `parallel wale ridges with correct pitch, matte pile catching light on the ridge tops` |
| 牛仔 | `diagonal twill lines, slub irregularity, whiskering at stress folds` |
| 皮革 | `grain pores, broad soft creases, low-frequency specular sheen` |
| 摇粒绒/绒毛 | `dense short pile, fuzzy silhouette edge, light scattering rather than specular` |

再加一条**褶皱层次**：`correct fold shadows with proper ambient occlusion in the creases`——这是「看起来有厚度」的来源。

---

## 4、工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型 + `--quality high`；材质增强要求「几何与色彩零变化、表面高频信息重建」，是典型的双图参考定向修复）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task material-enhancement \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/material-enhancement-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy gpt-image-2 --prompt '...' --images ... --save output/material-enhancement.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[原图, 高清商品图]` | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | 与原图比例一致 | 增强不该改构图 |
| `--quality` | `high`（**必须**） | 本技能的产出就是高频细节 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` | 纹理重建有随机性 |
| `--save` | `docs/material-enhancement/output-<sku>-enhanced.jpg` | 与原图分开归档便于对比 |

### Command Examples

```bash
# basic call
dlazy gpt-image-2 \
  --prompt 'Texture enhancement pass. Image 1 is the on-model photo to improve. Image 2 is the high-resolution product photo defining the true fabric. Rebuild the garment surface in image 1 using the real texture from image 2: crisp knit relief, visible loops and yarn twist, natural loft, correct fold shadows. Do not change anything else — model, pose, background, framing and colour grading stay identical to image 1. Only material fidelity improves.' \
  --images docs/material-enhancement/source-image.jpg docs/material-enhancement/hires-product.jpg \
  --size 1024x1536 --quality high

# complex call: 批量给一组生成图做材质后处理
HIRES=docs/material-enhancement/hires-product.jpg
LOCK='Do not change anything else — the model face, hair, hands, pose, other garments, background, framing and colour grading must stay identical to image 1. The garment silhouette and colour must not shift; only material fidelity and micro-detail improve. Photorealistic, sharp, no text, no watermark.'
FEAT='crisp cable-braid relief, visible knit loops and yarn twist, natural wool loft, matte fibre sheen, correct fold shadows with proper ambient occlusion in the creases'
for f in docs/material-enhancement/raw/*.jpg; do
  dlazy gpt-image-2 \
    --prompt "Texture enhancement pass. Image 1 is the on-model photo to improve. Image 2 is the high-resolution product photo that defines the true fabric. Rebuild the garment surface in image 1 using the real texture from image 2: $FEAT. $LOCK" \
    --images "$f" "$HIRES" \
    --size 1024x1536 --quality high --imageFormat jpeg \
    --save "docs/material-enhancement/enhanced/$(basename $f)"
done

# 先估价不真跑
dlazy gpt-image-2 --dry-run --prompt '...' --images a.jpg b.jpg --size 1024x1536 --quality high
```

### 延伸阅读

| 要查什么 | 去哪 |
| --- | --- |
| 认证、多后端配置、输出结构、错误码 | [`references/provider-cli.md`](references/provider-cli.md) |
| `gpt-image-2` 的全部可用参数 | [`references/model-flags.md`](references/model-flags.md) |
| 统一入口的全部选项 | `node scripts/gen.mjs --help` |

## 5、Prompt 模板

```text
Texture enhancement pass.
Image 1 is the on-model photo to improve.
Image 2 is the high-resolution product photo that defines the true fabric.

Rebuild the [服装部位] surface in image 1 using the real texture from image 2:
[第三节表格里对应面料的具体特征],
correct fold shadows with proper ambient occlusion in the creases.

Do not change anything else — the model face, hair, hands, pose, other garments,
background, framing and colour grading must stay identical to image 1.
The garment silhouette and colour must not shift; only material fidelity
and micro-detail improve.

Photorealistic, sharp, no text, no watermark.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 只是整体变锐利了 | `This is not sharpening: reconstruct the actual [织法单位] structure, loop by loop, matching image 2.` |
| 人脸/背景也变了 | `Only pixels inside the garment region may change. Everything outside it must be identical to image 1.` |
| 颜色被改了 | `Preserve the exact garment colour from image 1; do not shift hue, saturation or brightness.` |
| 纹理密度不对 | `Match the texture scale to the garment size in image 1: about [N] knit loops per [尺寸].` |
| 褶皱变平 | `Deepen the crease shadows with ambient occlusion; the garment must read as [厚度描述] fabric.` |

---

## 6、执行流程

1. **确认两张图是同一件商品**——这是最容易犯的错。
2. **判断原图值不值得救**：结构崩坏的重跑生成，只有面料糊的才用本技能。
3. **写面料特征**：查第三节表格，用具体特征替代「质感更好」。
4. **写两条铁律**：只改表面 + 别的不许动。
5. **`--quality high`（必须）** → `--batch 2` 挑图，落盘到 `docs/material-enhancement/`。
6. **并排对比原图与输出**：面料是否真的重建了（不是加锐化）、脸和背景是否没动、颜色是否没偏。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 只是变锐利了 | 未要求重建结构 | 追加「这不是锐化」句，要求逐个线圈重建 |
| 人脸/背景也被改 | 未锁定区域 | 追加只允许服装区域变化句 |
| 颜色偏了 | 模型顺手调色 | 追加保色句 |
| 纹理密度不对（线圈太大/太小） | 未给尺度参照 | 追加纹理尺度句 |
| 褶皱变平、没厚度 | 缺 AO 描述 | 追加加深褶皱暗部句 |
| 结构崩坏没被修好 | 超出能力 | 本技能只管表面，结构问题回到生成环节重跑 |

---

## Tips

Visit https://dlazy.com for more information.
