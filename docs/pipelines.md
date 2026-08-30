# 典型链路

[← 回到 README](../README.md)

中文 · [English](pipelines.en.md)

技能之间可以串起来用，前一步的输出直接作为下一步的输入。以下是几条跑得最多的链路。

---

## 新款上架（只有一张平铺图）

```
item-repair          精修平铺图（压平褶皱、匀光、纯净背景）
  └→ flat-lay        平铺图 → 模特上身商拍图
      ├→ fission-pattern    裂变成 5 张主图位
      ├→ clothing-detail    补 2~3 张工艺细节图
      ├→ item-detail        生成详情页各模块
      └→ detect-task        上架前逐张质检
```

## 一次拍摄覆盖多市场

```
one-shot             同一件衣服 → 国内/欧美/不同年龄段版本
  └→ detect-task     抽检
```

## 只有真人图，缺平铺素材

```
clothing-extraction  真人图/买家秀 → 干净平铺图
  └→ to-3d           平铺图 → 立体图（主图更有质感）
  └→ fabric-on-body  同版型试多种面料
```

## 内容种草铺量

```
flat-lay 或已有商拍图
  └→ clothing-grass-planting   一套穿搭 → 5 个生活场景版本
      └→ remove-watermark      清掉旧图上的文字/水印
```

## 整店改版（上百 SKU）

```
brand-kit            先定一份 brand.yaml，锁住模特/光位/色调
  └→ batch-image     清单驱动，整批统一视觉（并发/重试/断点/熔断）
      └→ run_loop    每张自动走 生成 → 质检 → 修正 → 重跑
          └→ platform-compliance   整批过机检，不合格的自动修
```

一条命令：

```bash
node shared/scripts/batch.mjs --input skus.csv --task flat-lay \
  --template prompt.txt --outdir out/ --concurrency 4 \
  --max-credits 3000 --loop --platform amazon --resume --contact-sheet
```

## 跨境上架（一套素材铺多国）

```
flat-lay 或已有商拍图
  └→ cross-border-localize   多语言文案、尺码表、区域版主图
      └→ platform-compliance  按各区域平台规格逐个校验
```

## 主图位补视频

```
已有主图
  └→ main-image-video     3–5 秒主图视频
product-video-ad          卖点 → 分镜 → 成片带字幕（投流素材）
ugc-testimonial           人设 → 口播种草视频
```

## 主图不达标，想知道换哪版更好

```
listing-optimizer    单变量对照组 + 假设 + 复盘模板
  └→ platform-compliance   每组先过机检，别让驳回污染实验数据
```
