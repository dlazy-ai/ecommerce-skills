---
name: fabric-on-body
description: 一键替换服装面料。版式图 + 面料图 → 换上新面料的样衣图，垂坠与光泽随材质变。当用户说「换面料」「换材质」「试布料」「面料上身」「同款不同料」时使用。
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

## 4、工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；面料替换要求「几何完全不动、材质完全改变」，是典型的定向属性替换任务）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task fabric-on-body \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/fabric-on-body-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy gpt-image-2 --prompt '...' --images ... --save output/fabric-on-body.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[版式图, 面料图]` | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | 与版式图比例一致（`1024x1024` 平铺 / `1024x1536` 人台竖版） | 换料不该改构图 |
| `--quality` | `high` | 材质是本技能的唯一产出，必须 high |
| `--imageFormat` | `jpeg` | 通用格式 |
| `--batch` | `2` ~ `3` | 垂坠形态有随机性 |
| `--save` | `docs/fabric-on-body/output-<版型>-<面料>.jpg` | 版型 × 面料矩阵命名 |

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

### 延伸阅读

| 要查什么 | 去哪 |
| --- | --- |
| 认证、多后端配置、输出结构、错误码 | [`references/provider-cli.md`](references/provider-cli.md) |
| `gpt-image-2` 的全部可用参数 | [`references/model-flags.md`](references/model-flags.md) |
| 统一入口的全部选项 | `node scripts/gen.mjs --help` |

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
