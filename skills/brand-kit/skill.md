---
name: brand-kit
description: 店铺品牌视觉锁定。一份 brand.yaml 定义模特、色温、构图、留白与文案语气，所有生图技能读它，保证跨 SKU 视觉统一。当用户说「统一风格」「同一个模特」「店铺调性」「品牌规范」「几百个 SKU 看起来像一家店」时使用。
---

# brand-kit — 店铺视觉统一

一套图和一家店的区别，在于**第 200 个 SKU 是否还长得像第 1 个**。

靠每次重写 prompt 做不到这件事——人会忘、会改词、会换说法。
靠一份可复用的规范文件才做得到。

---

## 一、它解决什么

| 没有 brand-kit | 有 brand-kit |
| --- | --- |
| 每个技能各写各的模特描述 | 一处定义，全部技能读同一份 |
| 同店铺 SKU 模特脸不一样 | 锁定同一张脸参考图 |
| 色温忽冷忽暖、背景忽深忽浅 | 光位、色调、背景写死在规范里 |
| 改一次调性要翻 26 个 prompt | 改一行 yaml |

---

## 二、快速上手

```bash
# 1. 生成模板
node scripts/brand.mjs --init > brand.yaml   # 或直接改随技能分发的 examples/brand.yaml

# 2. 改成自己店铺的（见下方字段说明）

# 3. 看它会给某个技能追加什么
node scripts/brand.mjs --brand examples/brand.yaml --for flat-lay

# 4. 生成时带上，自动追加
node scripts/gen.mjs --task flat-lay --brand examples/brand.yaml \
  --prompt 'On-model photo of the olive cable-knit sweater.' \
  --images garment.jpg pose.jpg --save out/sku001.jpg
```

`--brand` 对 `gen.mjs` / `run_loop.mjs` / `batch.mjs` / `video.mjs` 都有效。
整批出图时加上它，一整批的视觉基调就锁住了。

---

## 三、字段

```yaml
brand:
  name: 示例品牌
  tone: quiet minimalist, warm and lived-in, never glossy or commercial

model:
  reference: assets/model/face-a.jpg          # 锁脸
  description: East Asian woman, late twenties, natural makeup
  body: slim, height around 168cm

photography:
  background: seamless off-white studio backdrop, RGB 248 248 246
  lighting: soft large softbox from camera left, gentle fill, no hard shadows
  camera: 85mm equivalent, eye level, shallow depth of field
  grade: neutral white balance around 5200K, low contrast
  crop: full body with headroom, product centered

layout:
  margin: at least 8% empty margin on all sides
  typeface: clean sans-serif, no decorative fonts

forbid:
  - no text or watermark
  - no oversaturated colors

compliance:
  platform: amazon
```

**只有相关的段落会进 prompt**：详情页技能读 `layout` 但不读 `model`，
去水印技能两个都不读。完整对照表见 [`references/brand-schema.md`](references/brand-schema.md)。

---

## 四、写好规范的三条经验

**1. 用英文写画面约束，中文写备注。** 图像模型对英文画面词的响应更稳定，
`tone` / `background` / `lighting` 这些直接写英文；`name` 这类只给人看的随意。

**2. 写物理量，不写形容词。** `warm lighting` 模型每次理解都不同；
`neutral white balance around 5200K, soft large softbox from camera left` 才可复现。
色值直接写 RGB。

**3. `forbid` 比 `tone` 更管用。** 正面描述容易被稀释，禁止项是硬约束。
「不要什么」往往比「要什么」更能稳住风格。

---

## 五、锁脸

`model.reference` 给一张清晰正脸图，它会作为**最后一张参考图**传给模型，
配合 prompt 里的 `Model must stay consistent` 一起生效。

| 要求 | 说明 |
| --- | --- |
| 正脸、清晰、光线均匀 | 侧脸和逆光锁不住 |
| 只有脸，别带复杂背景 | 背景会污染生成 |
| 分辨率够 | 至少 512×512 |
| 全店固定一张 | 换图等于换人 |

找不到文件时只警告不报错，生成照常进行——少一张参考图，脸就由 prompt 描述决定。

---

## 六、执行流程

1. 用户说「统一风格」时，先问三件事：**模特要不要锁死**、**主色调**、**有没有必须避免的元素**。
2. `--init` 生成模板，按回答填。
3. 拿 1 个 SKU 跑一次带 `--brand` 和不带的对比，让用户确认调性对了。
4. 确认后再跑整批——规范是给整批用的，单张看不出价值。
5. 之后每次出图都带 `--brand`。不带就等于没有规范。

---

## 七、常见问题

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 加了 brand 反而更不像 | 描述互相打架（比如 `tone` 说极简，`photography` 写戏剧光） | 通读一遍，删掉矛盾项 |
| 模特脸还是会变 | 参考图不是正脸，或分辨率太低 | 换一张标准正脸图 |
| prompt 太长被截断 | 规范写太细 | 只保留真正影响视觉的项，删掉无关段落 |
| 详情页图带上了模特描述 | 用了 `--for` 之外的方式手工拼接 | 用 `--brand`，它会自动按技能过滤 |

---

## Tips

- **规范进版本库**，和商品数据放一起。它是资产，不是临时文件。
- **一个店铺一份**。多店铺别共用一份改来改去，各存各的。
- **换季可以分支**：`brand-aw25.yaml`、`brand-ss26.yaml`，切换只是换个文件名。
