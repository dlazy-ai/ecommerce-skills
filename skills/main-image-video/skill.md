---
name: main-image-video
description: 静态主图转主图视频。一张商品图 → 3–5 秒可上架的主图短视频。当用户说「主图视频」「图转视频」「让图动起来」「加个视频」时使用。
---

# main-image-video — 主图视频

主图坑位旁边那个视频位，大多数店铺是空的。它不需要重新拍，
**一张已有的主图就能生成**。

---

## 一、能力边界

| 能做 | 说明 |
| --- | --- |
| 图生视频 | 一张商品图 → 3–5 秒运动镜头 |
| 运镜控制 | 推、拉、环绕、俯仰、微距扫过 |
| 材质动态 | 面料飘动、金属反光扫过、液体晃动 |
| 批量 | 配合 [batch-image](../batch-image/skill.md) 整批出 |

| 不能做 | 说明 |
| --- | --- |
| 长视频 | 超过 8 秒请用 [product-video-ad](../product-video-ad/skill.md) 分镜串联 |
| 口播 | 用 [ugc-testimonial](../ugc-testimonial/skill.md) |
| 改商品 | 视频模型会放大原图的瑕疵，先用 [item-repair](../item-repair/skill.md) 修好 |

---

## 二、先配后端

视频模型 ID 因后端而异，**必须显式指定**，脚本不会替你猜：

```bash
export DLAZY_VIDEO_MODEL=<你账号里可用的视频模型 ID>
```

拼接与字幕需要 ffmpeg（本技能的单镜模式用不到，分镜才需要）。
完整说明见 [`references/video-backends.md`](references/video-backends.md)。

---

## 三、工具调用

```bash
node scripts/video.mjs --mode clip --task main-image-video \
  --image docs/flat-lay/example-output.jpg \
  --prompt 'Slow push-in on the model. The cable-knit sweater fibers catch the light softly. Subtle natural body sway. Camera stays level, no cuts.' \
  --seconds 3 \
  --save out/sku001-main.mp4

# 先看会发什么，不计费
node scripts/video.mjs --mode clip --task main-image-video --image x.jpg \
  --prompt '...' --dry-run
```

**参数约定**

| 参数 | 取值 | 理由 |
| --- | --- | --- |
| `--image` | 一张主图 | 竖版 3:4 或方图，分辨率越高越好 |
| `--seconds` | `3` ~ `5` | 主图位视频普遍偏短，超过 5 秒完播率掉得快 |
| `--brand` | `brand.yaml` | 让运镜与色调跟全店一致 |

---

## 四、Prompt 模板

**结构：运镜 + 主体动态 + 环境动态 + 约束**

```
<Camera move>. <What the product does>. <What the environment does>.
Keep the product identical to the reference image — same shape, color, texture, logo placement.
No cuts, no text overlay, no watermark. Photorealistic.
```

**运镜词表**

| 目标 | 英文 |
| --- | --- |
| 缓推 | `slow push-in` |
| 缓拉 | `slow pull-back reveal` |
| 环绕 | `smooth 30-degree orbit around the product` |
| 俯冲 | `gentle top-down tilt` |
| 微距扫过 | `macro pan across the surface texture` |

**材质动态词表**

| 品类 | 英文 |
| --- | --- |
| 针织 / 毛呢 | `fibers catch the light, fabric breathes subtly` |
| 真丝 / 雪纺 | `fabric ripples in a gentle draft` |
| 金属 / 珠宝 | `specular highlight sweeps across the metal` |
| 玻璃 / 液体 | `liquid settles, light refracts through the glass` |
| 皮革 | `soft sheen shifts across the grain` |

---

## 五、执行流程

1. **先检查静态图**。视频模型会放大原图的一切瑕疵。原图有崩就先修，别指望视频救。
2. **确认后端**。`DLAZY_VIDEO_MODEL` 没设就先问用户用哪个模型。
3. **单张试跑**。视频比图贵得多，先跑一条 3 秒的看运镜对不对。
4. **确认后再批量**。
5. **过一遍平台规格**。视频也有规格要求（时长、比例、体积），
   目前 [platform-compliance](../platform-compliance/skill.md) 只校验静态图，视频请人工对照平台文档。

---

## 六、常见问题

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 商品在动的过程中变形 | 运动幅度给太大 | 换成 `slow` / `subtle` 系的词，缩短时长 |
| 画面糊 | 原图分辨率不够 | 先用 [material-enhancement](../material-enhancement/skill.md) 提清晰度 |
| 模特脸在动的时候崩 | 人脸是视频模型的重灾区 | 改用不露脸的景别，或改成商品特写 |
| 时长对不上 | 多数模型的时长是档位不是连续值 | 按模型支持的档位取，别硬凑 |
| 报错说没指定模型 | `DLAZY_VIDEO_MODEL` 没设 | 见「先配后端」 |

---

## Tips

- **3 秒够用**。主图位视频不是广告片，讲清楚一个卖点就行。
- **别加文字**。主图视频的文字规则和主图一样严，字幕留给 [product-video-ad](../product-video-ad/skill.md)。
- **首帧就是封面**。用商品最好看的角度做输入图，因为它大概率是静止时显示的那一帧。
