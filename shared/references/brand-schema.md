# brand.yaml 字段说明

一份文件定义店铺的视觉规范，所有生图技能读它。改一处，全店跟着变。

```yaml
brand:
  name: 品牌名                    # 仅用于记录
  tone: 一句话调性                # 原样进 prompt，写英文效果更稳

model:                           # 只有出人像的技能会读
  reference: assets/model/face-a.jpg   # 锁脸：会作为额外参考图传入
  description: 模特外形描述        # 英文
  body: 身形与身高

photography:                     # 出实拍类图的技能会读
  background: 背景描述
  lighting: 光位
  camera: 镜头与视角
  grade: 色调与白平衡
  crop: 景别与构图

layout:                          # 只有带排版的技能会读（主图 / 详情页）
  margin: 留白要求
  typeface: 字体倾向
  text_color: 文字颜色

forbid:                          # 硬性禁止项，会拼成一句 Hard constraints
  - no text or watermark
  - no oversaturated colors

compliance:
  platform: amazon               # 可选：默认合规目标
```

## 哪个技能读哪几段

| 段落 | 读它的技能 |
| --- | --- |
| `brand.tone` | 全部 |
| `model` | 出人像的：flat-lay、wear-everything、image-fusion、one-shot、fission-pattern、creative-scene、clothing-grass-planting、batch-image、三个视频技能、listing-optimizer |
| `photography` | 出实拍类图的（含上面这些，再加 item-change-background、to-3d、clothing-detail、item-repair） |
| `layout` | 带排版的：item-detail、item-selling-point、listing-optimizer、cross-border-localize |
| `forbid` | 全部 |

不相干的段落不会进 prompt——给详情页技能塞模特脸的描述只会干扰它。

## 用法

```bash
node scripts/brand.mjs --init > brand.yaml           # 生成模板
node scripts/brand.mjs --brand brand.yaml --for flat-lay          # 看会追加什么
node scripts/gen.mjs --task flat-lay --brand brand.yaml --prompt '...'   # 自动追加
```

`--brand` 对 `gen.mjs` / `run_loop.mjs` / `batch.mjs` / `video.mjs` 都有效。

## 注意

- `model.reference` 路径相对于**运行命令的目录**，不是 brand.yaml 所在目录。
- 文件找不到时只警告不报错，生成照常进行（少一张参考图而已）。
- 支持的是 YAML 的常用子集：2 空格缩进、映射、标量、`- ` 列表。
  锚点、多行标量这些没实现——用到了就换成 `brand.json`，同样能读。
