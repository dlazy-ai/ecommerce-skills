---
name: to-3d
description: 平铺图转隐形模特立体图。平铺图 → 有体积感与版型的立体展示图。当用户说「转 3D」「立体图」「隐形模特」「把衣服撑起来」时使用。
---

# to-3d — 平铺图生成服装 3D 立体图

把**平摊在桌面上的服装图**变成**有体积感的立体图**——像被一个看不见的人穿着（业内叫 ghost mannequin / 隐形模特）。

用途：平铺图便宜但显得廉价，真人图贵且不适合所有类目。3D 立体图是中间档——有质感、能交代版型，又不涉及模特成本与肖像问题。

---

## 生成效果示例

| 输入：平铺图 |
| --- |
| <img src="../../docs/to-3d/garment-flatlay.jpg" width="280"> |
| `garment-flatlay.jpg` — 军绿麻花针织圆领毛衣平铺图，800×800 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Turn this flat-lay garment photo into a dimensional 3D ghost-mannequin product shot. The olive-green cable-knit crewneck sweater must gain realistic volume: filled shoulders and chest, sleeves with natural bend, visible interior of the collar, soft self-shadow under the hem, as if worn by an invisible mannequin. Keep the garment 100% faithful: same olive-green colour, same cable-knit and diamond stitch pattern, same ribbed collar and cuffs, same woven cuff label. Clean seamless light-grey studio background, soft top light, sharp fibre detail. No mannequin, no person, no text.' \
  --images docs/to-3d/garment-flatlay.jpg \
  --size 1024x1024 --quality medium --imageFormat jpeg \
  --save docs/to-3d/example-output.jpg
```

**输出**

<img src="../../docs/to-3d/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。肩胸被撑起、袖子自然弯曲、领口露出内里罗纹与背面内衬、下摆有自重投影；麻花与菱形织法、军绿色、罗纹结构与右袖织标保持不变，画面里没有出现人台或人体。

---

## 1、能力边界

| 能力 | 说明 |
| --- | --- |
| 立体撑起 | 肩胸填充、袖子弯曲、领口露出内里、下摆自重投影 |
| 服装类型 | 上装 / 下装 / 连衣裙 / 外套 / 内衣 / 童装 / 家居服 |
| 形态控制 | 参考图（照抄某种立体形态）或自定义提示词 |
| 材质增强 | 开关；开启后针织、绒毛、皮革的表面细节更清晰 |
| 生成比例 | `1:1`（方图主图）/ `3:4`（竖版详情） |

**不做**：不改颜色、织法、印花与罗纹结构；不生成人体与人脸；不改变服装的实际版型比例。

---

## 2、输入素材规则

生成前先自检这几条硬性约束：

- 大小：**20KB ~ 15MB**
- 分辨率：**大于 400×400**
- 格式：**jpg / jpeg / png / webp**

**推荐的输入（✅）**：纯色背景、完全摊平、无褶皱堆叠、正面完整、领口与下摆边界清晰的单件平铺图。

**会明显拉低效果的输入（❌）**

| 问题 | 说明 |
| --- | --- |
| 折叠摆放 | 袖子折在身上，模型算不出袖子长度 |
| 大面积褶皱 | 褶皱会被当成结构撑成怪形状 |
| 已带人体 | 真人上身图请用 [one-shot](../one-shot/skill.md) |
| 套装同框 | 拆成单件分别跑 |

---

## 3、立体形态的三个控制点

| 控制点 | 写进 prompt | 不写会怎样 |
| --- | --- | --- |
| 填充程度 | `filled shoulders and chest with realistic volume, natural fabric drape` | 撑得像气球，版型失真 |
| 袖子姿态 | `sleeves with a natural bend, hanging slightly forward and away from the body` | 袖子直挺挺贴在身侧 |
| 领口内里 | `visible interior of the collar showing the inner facing` | 领口是个平的洞，最容易露馅 |

再补两条环境约束：

```text
soft self-shadow under the hem and inside the sleeves
No mannequin, no person, no visible support — the garment must appear worn by an invisible body.
```

`No mannequin, no person` 这句必须写，否则模型经常直接长出一个人台或半个身体。

---

## 4、工具调用

本技能使用 dLazy 的 **`gpt-image-2`**（图像编辑模型；从平面推断体积需要强几何理解，同时要严格保住织法与颜色不变）。

### 调用方式

两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：

```bash
# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑
node scripts/gen.mjs --task to-3d \
  --prompt '<见下方 Prompt 模板>' \
  --images <按下表顺序> \
  --save output/to-3d-<sku>.jpg

# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）
dlazy gpt-image-2 --prompt '...' --images ... --save output/to-3d.jpg
```

**参数约定（本技能固定用法）**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--images` | `[平铺图]`；带形态参考时 `[平铺图, 形态参考图]` | 顺序即 prompt 中的 image 1 / 2 |
| `--size` | `1024x1024`（方图主图）/ `1024x1536`（竖版长款、连衣裙） | 对应原站的 1:1 / 3:4 |
| `--quality` | `high`（等价于「材质增强」开启）/ `medium`（关闭） | 针织、绒毛类必须 high |
| `--imageFormat` | `jpeg` | 电商上架通用格式 |
| `--batch` | `2` ~ `3` | 体积推断有随机性 |
| `--save` | `docs/to-3d/output-<sku>.jpg` | 直接落盘 |

### Command Examples

```bash
# basic call
dlazy gpt-image-2 \
  --prompt 'Turn this flat-lay garment photo into a dimensional 3D ghost-mannequin product shot. Filled shoulders and chest with realistic volume, sleeves with a natural bend, visible interior of the collar, soft self-shadow under the hem. Keep the garment 100% faithful: same colour, same stitch pattern, same ribbing, same label. Clean seamless light-grey studio background. No mannequin, no person, no text.' \
  --images docs/to-3d/garment-flatlay.jpg \
  --size 1024x1024 --quality high

# complex call: 照抄某种立体形态 + 竖版 + 出 3 张挑图
dlazy gpt-image-2 \
  --prompt 'Turn image 1 (a flat-lay garment) into a dimensional 3D ghost-mannequin product shot, copying the volume, posture and camera angle of image 2. Filled shoulders and chest with realistic volume and natural fabric drape, sleeves with a natural bend hanging slightly forward, visible interior of the collar showing the inner facing, soft self-shadow under the hem and inside the sleeves. Keep the garment 100% faithful to image 1: same colour, same knit structure, same print placement, same ribbing and label. Clean seamless light-grey studio background, soft top light, sharp fibre detail. No mannequin, no person, no visible support, no text.' \
  --images docs/to-3d/garment-flatlay.jpg docs/to-3d/volume-ref.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --batch 3 --save docs/to-3d/output-sku001.jpg

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
Turn this flat-lay garment photo into a dimensional 3D ghost-mannequin product shot.

The [品类 + 颜色 + 面料] must gain realistic volume:
filled shoulders and chest, sleeves with a natural bend,
visible interior of the collar showing the inner facing,
soft self-shadow under the hem and inside the sleeves,
as if worn by an invisible body.

Keep the garment 100% faithful: same [颜色], same [织法/纹理], same [印花/图案位置],
same [罗纹/领口/袖口/下摆结构], same [吊牌/织标].

Clean seamless [背景色] studio background, soft top light, sharp fibre detail.
No mannequin, no person, no visible support, no text.
```

**按问题追加的修正句**

| 问题 | 追加到 prompt 末尾 |
| --- | --- |
| 长出了人台或半个人 | `Absolutely no mannequin, torso, neck, arms or hands anywhere in the frame — only the garment.` |
| 撑得过度、版型变胖 | `Keep the original garment proportions: body width, sleeve length and hem width must match image 1 exactly. Add volume, not size.` |
| 领口是个平的洞 | `The collar opening must show the inner facing and the inside back of the garment, with correct depth and shadow.` |
| 织法被抹平 | 改 `--quality high`，追加 `resolve individual knit loops and yarn twist` |
| 投影方向乱 | `Single soft top-left light source; one consistent contact shadow beneath the garment.` |

---

## 6、执行流程

1. **校验输入**：完全摊平、无折叠、无大褶皱、单件、边界清晰。
2. **写三个控制点**（填充 / 袖姿 / 领口内里）+ 两条环境约束（自重投影 / 禁止人台）。
3. **写保真项**：颜色、织法、印花位置、罗纹结构、吊牌。
4. **选比例与质量**：针织绒毛类一律 `--quality high`。
5. **`--dry-run` 估价** → 真跑 → `--batch 2~3` 挑图，落盘到 `docs/to-3d/`。
6. **质检**：有没有长出人体、版型是否变胖、领口内里是否正确、织法是否还在。

---

## 7、常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 长出人台 / 半个身体 | 缺少禁止句 | 追加强化版禁止句（第五节） |
| 版型被撑胖 | 只说了加体积没说保比例 | 追加保比例句：`Add volume, not size.` |
| 领口是平的黑洞 | 未描述内里 | 追加领口内里句 |
| 袖子直挺挺贴身侧 | 未描述袖姿 | 追加 `hanging slightly forward and away from the body` |
| 织法糊了 | `--quality medium` | 改 `high`；或接 [material-enhancement](../material-enhancement/skill.md) |
| 折叠摆放的图效果很差 | 输入违规 | 重拍成完全摊平的平铺图 |

---

## Tips

Visit https://dlazy.com for more information.
