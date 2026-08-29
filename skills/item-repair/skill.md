---
name: item-repair
description: 商品精修、去褶皱。随手拍的商品图 → 可直接上架的精修图。当用户说「精修」「去褶皱」「修图」「拍得不好看」「整理一下」时使用。
---

# item-repair — 一键提升商品图质感

把**随手拍的商品图**修成**可上架的精修图**：压平褶皱、摆正对称、匀光、提纯背景。

和 [material-enhancement](../material-enhancement/skill.md) 的分工：material-enhancement 修**面料纹理**（在模特图上），本技能修**摆放与光照**（在商品图上）。两者可以串起来用。

---

## 生成效果示例

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

## 4、工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型 + `--quality high`；精修要求「结构与颜色零变化、摆放与光照重整」，且支持一次传 1-4 张同商品多视角）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task item-repair \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/item-repair-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy gpt-image-2 --prompt '...' --images ... --save output/item-repair.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[图1]` ~ `[图1, 图2, 图3, 图4]`（同一商品多视角） | 对应原站「同一商品 1-4 张」 |
| `--size` | `1024x1024`（平铺方图）/ `1024x1536`（长款竖版） | 平铺主图通常方图 |
| `--quality` | `high`（等价「材质增强」开启） | 精修的价值在细节 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` | 对称化结果有随机性 |
| `--save` | `docs/item-repair/output-<sku>-retouched.jpg` | 与原图分开归档 |

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

### 延伸阅读

| 要查什么 | 去哪 |
| --- | --- |
| 认证、多后端配置、输出结构、错误码 | [`references/provider-cli.md`](references/provider-cli.md) |
| `gpt-image-2` 的全部可用参数 | [`references/model-flags.md`](references/model-flags.md) |
| 统一入口的全部选项 | `node scripts/gen.mjs --help` |

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

## 7、常见问题

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
