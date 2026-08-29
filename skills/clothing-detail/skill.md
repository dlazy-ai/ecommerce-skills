---
name: clothing-detail
description: 服装工艺细节放大图。服装图 → 面料纹理、走线、织法的微距特写。当用户说「细节图」「特写」「面料放大」「工艺展示」「近景细节」时使用。
---

# clothing-detail — 服装图生成细节放大图

一张服装图 → **局部微距特写**。详情页里「证明这件衣服做得好」的那几张图。

为什么需要：转化率高的详情页通常有 2~3 张细节图（领口、袖口、面料纹理），但拍微距要专门的镜头和布光。本技能从常规商品图推出这些特写。

---

## 生成效果示例

| 输入：服装图 |
| --- |
| <img src="../../docs/clothing-detail/garment-flatlay.jpg" width="280"> |
| `garment-flatlay.jpg` — 军绿麻花针织毛衣平铺图，800×800 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Macro detail shot for an e-commerce detail page. Zoom into the shoulder-and-collar area of this olive-green cable-knit sweater and render a photorealistic close-up that fills the frame. Show the ribbed crewneck collar meeting the raglan-style cable panel, individual yarn plies and the twist of the cable braid, the loft of the wool fibres, and soft directional light raking across the surface to reveal depth. Keep the colour and stitch pattern exactly as in the source. Shallow depth of field with the far edge softly out of focus, clean neutral background bokeh, no person, no text, no watermark.' \
  --images docs/clothing-detail/garment-flatlay.jpg \
  --size 1024x1024 --quality high --imageFormat jpeg \
  --save docs/clothing-detail/example-output.jpg
```

**输出**

<img src="../../docs/clothing-detail/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024，60 credits。领口罗纹与麻花panel的交接、每根纱线的捻向、羊毛纤维的绒毛感都被解析出来，侧光让菱形提花的凹凸立体可见，远端落入柔和虚化。

---

## 1、能力边界

| 能力 | 说明 |
| --- | --- |
| 取景部位 | 领口罗纹 / 袖口 / 下摆 / 纽扣 / 拉链 / 口袋 / 刺绣 / 印花 / 织法结构 / 面料纤维 |
| 风格控制 | 参考图（照抄某张细节图的机位与光线）或自定义提示词 |
| 服装类型 | 帮助模型判断哪些部位值得放大 |
| 生成比例 | `1:1`（方图细节位）/ `3:4`（竖版详情页） |

**不做**：不改颜色、织法与结构；不添加原图没有的工艺（不存在的刺绣、不存在的拉链）；不虚构面料成分。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**输入建议**

| 做法 | 说明 |
| --- | --- |
| ✅ 原图分辨率越高越好 | 微距是在放大原图信息，原图糊 = 细节图编 |
| ✅ 目标部位在原图里清晰可见 | 原图里看不清的部位，输出的是模型的想象 |
| ✅ 一次只放大一个部位 | 一张图里塞三个特写等于都不清楚 |
| ❌ 低分辨率 / 强压缩图 | 会放大出塑料感的假纹理 |
| ❌ 目标部位被遮挡 | 挡住的工艺只能靠编 |

---

## 3、取景部位 → prompt 写法

| 部位 | 取景描述 |
| --- | --- |
| 领口罗纹 | `the ribbed crewneck collar meeting the body panel, showing rib wale spacing and the seam join` |
| 袖口 | `the ribbed cuff and the sleeve seam, showing rib elasticity and stitch density` |
| 下摆 | `the hem band and side seam, showing hem width and the finishing stitch` |
| 纽扣 | `a single button and its buttonhole, showing button material, thread cross and hole finishing` |
| 拉链 | `the zipper teeth and puller, showing tooth pitch, metal finish and the tape stitching` |
| 刺绣 / 印花 | `the [刺绣/印花] motif filling the frame, showing thread direction / print edge sharpness and substrate texture` |
| 织法结构 | `the [麻花/罗纹/提花] stitch structure, showing individual yarn plies and the twist of each loop` |
| 面料纤维 | `the fabric surface at extreme magnification, showing fibre halo and weave interlacing` |

**每条都要补三件事**：

```text
filling the frame                      ← 特写要占满画面
shallow depth of field with the far edge softly out of focus   ← 微距的景深特征
soft directional light raking across the surface to reveal depth  ← 侧光才能显出立体纹理
```

---

## 4、工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型 + `--quality high`；细节图的全部价值就是纹理保真度，这是本技能唯一不能省的地方）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task clothing-detail \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/clothing-detail-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy gpt-image-2 --prompt '...' --images ... --save output/clothing-detail.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[原图]`；带风格参考时 `[原图, 参考图]` | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | `1024x1024`（方图细节位）/ `1024x1536`（竖版详情页） | 对应原站 1:1 / 3:4 |
| `--quality` | `high`（**不要降**） | 细节图靠纹理说话 |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` | 取景位置有随机性 |
| `--save` | `docs/clothing-detail/output-<sku>-<部位>.jpg` | 按部位归档 |

### Command Examples

```bash
# basic call: 领口细节
dlazy gpt-image-2 \
  --prompt 'Macro detail shot for an e-commerce detail page. Zoom into the collar area of this garment and render a photorealistic close-up filling the frame. Show the ribbed crewneck collar meeting the body panel, individual yarn plies and the twist of each loop, soft directional light raking across the surface. Keep colour and stitch pattern exactly as in the source. Shallow depth of field, clean neutral background bokeh, no person, no text.' \
  --images docs/clothing-detail/garment-flatlay.jpg \
  --size 1024x1024 --quality high

# complex call: 一个 SKU 批量出 3 个部位的细节图
SRC=docs/clothing-detail/garment-flatlay.jpg
COMMON='Render a photorealistic macro close-up filling the frame. Keep the colour and stitch pattern exactly as in the source image. Shallow depth of field with the far edge softly out of focus, soft directional light raking across the surface to reveal depth, clean neutral background bokeh. No person, no text, no watermark.'
for P in collar cuff stitch; do
  case $P in
    collar) VIEW='Zoom into the collar area: the ribbed crewneck collar meeting the body panel, showing rib wale spacing and the seam join' ;;
    cuff)   VIEW='Zoom into the cuff area: the ribbed cuff and the sleeve seam, showing rib elasticity and stitch density' ;;
    stitch) VIEW='Zoom into the cable-knit panel: the stitch structure, showing individual yarn plies and the twist of each loop' ;;
  esac
  dlazy gpt-image-2 \
    --prompt "Macro detail shot for an e-commerce detail page. $VIEW. $COMMON" \
    --images "$SRC" --size 1024x1024 --quality high --imageFormat jpeg \
    --save "docs/clothing-detail/output-sku001-$P.jpg"
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
Macro detail shot for an e-commerce detail page.

Zoom into [部位] of this [品类 + 颜色 + 面料] and render a photorealistic close-up
that fills the frame. Show [第三节表格里的取景描述].

Keep the colour and stitch pattern exactly as in the source.

Shallow depth of field with the far edge softly out of focus,
soft directional light raking across the surface to reveal depth,
clean neutral background bokeh.

No person, no text, no watermark.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 纹理像塑料 | `Resolve individual [yarn plies / weave threads / fibre ends]; the surface must read as real textile, not plastic or CG.` |
| 放大得不够 | `Extreme magnification: the [部位] must occupy at least 70% of the frame.` |
| 编出了不存在的工艺 | `Do not invent any construction detail that is not visible in the source image.` |
| 整张都很实、没有微距感 | `Only the [部位] is in focus; everything beyond [X] must fall into smooth bokeh.` |
| 颜色变了 | `Sample the colour directly from the source image; no grading, no saturation boost.` |

---

## 6、执行流程

1. **挑原图**：分辨率越高越好；确认目标部位清晰可见、无遮挡。
2. **列部位清单**：一个 SKU 通常出 2~3 张（领口 + 面料 + 一个特色工艺）。
3. **每条 prompt 只放大一个部位**，从第三节取景描述抄。
4. **补齐三件事**：占满画面 / 浅景深 / 侧光。
5. **`--quality high`**（不要降档）→ `--batch 2` 挑图，落盘到 `docs/clothing-detail/`。
6. **质检**：纹理是否真实（不是塑料感）、有没有编出不存在的工艺、颜色是否一致。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 纹理塑料感 | 质量档位低或原图糊 | `--quality high` + 追加解析纹理句；换高分辨率原图 |
| 放大不够，还是半身 | 未写占比 | 追加 70% 画面占比句 |
| 编出了原图没有的拉链/刺绣 | 模型补全 | 追加禁止编造句 |
| 没有微距景深 | 未写景深 | 追加只有目标部位对焦的句子 |
| 颜色比原图艳 | 自动调色 | 追加取色约束句 |
| 三个部位挤在一张图 | 一条 prompt 写了多个部位 | 拆成多条，一条一个部位 |

---

## Tips

Visit https://dlazy.com for more information.
