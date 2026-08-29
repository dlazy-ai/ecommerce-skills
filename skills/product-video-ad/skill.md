---
name: product-video-ad
description: 商品短视频广告。卖点 → 分镜脚本 → 分段生成 → 拼接加字幕成片。当用户说「做条广告」「短视频」「投流素材」「分镜脚本」「带货视频」时使用。
---

# product-video-ad — 商品短视频广告

从卖点到成片：写分镜 → 逐镜生成 → 拼接 → 上字幕。

和 [main-image-video](../main-image-video/skill.md) 的分工：那个是主图位的 3 秒单镜，
这个是**多镜串联的完整广告**，15–30 秒，用于投流。

---

## 一、能力边界

| 能做 | 说明 |
| --- | --- |
| 分镜脚本 | 卖点 → 镜头序列，含时长、画面、字幕 |
| 逐镜生成 | 每个镜头独立生成，失败只重跑那一个 |
| 自动拼接 | ffmpeg 串成成片，编码不一致时自动重编码 |
| 字幕 | 按分镜时长自动生成 SRT，烧录或封装 |
| 品牌一致 | `--brand` 让全片色调运镜统一 |

| 不能做 | 说明 |
| --- | --- |
| 配音配乐 | 脚本给文案，配音配乐请用剪辑软件 |
| 精确卡点 | 生成模型的时长是档位，卡音乐点请后期调 |
| 真人口播 | 用 [ugc-testimonial](../ugc-testimonial/skill.md) |

---

## 二、分镜结构

15 秒带货视频的通用骨架，四段：

| 段 | 时长 | 干什么 | 画面 |
| --- | --- | --- | --- |
| 钩子 | 0–3s | 让人停下来 | 最强视觉冲击：使用场景、痛点对比、意外角度 |
| 卖点 | 3–9s | 说清为什么买 | 2–3 个特写，一个卖点一个镜头 |
| 场景 | 9–13s | 让人代入 | 真实使用场景，模特或环境 |
| 落点 | 13–15s | 给行动理由 | 商品全貌 + 价格/优惠字幕 |

**一个镜头只讲一件事。** 一个镜头塞两个卖点，两个都记不住。

---

## 三、分镜文件

```json
{
  "shots": [
    { "id": "s1", "seconds": 3, "image": "docs/flat-lay/example-output.jpg",
      "prompt": "Slow push-in on the model wearing the olive cable-knit sweater, cold morning light, breath visible.",
      "caption": "零下十度，只穿了这一件" },
    { "id": "s2", "seconds": 3, "image": "docs/flat-lay/garment-flatlay.jpg",
      "prompt": "Macro pan across the cable knit texture, fibers catch the light.",
      "caption": "粗棒针织，三层锁温" },
    { "id": "s3", "seconds": 4, "image": "docs/flat-lay/example-output.jpg",
      "prompt": "The model walks through a city street, sweater moves naturally with the body.",
      "caption": "通勤、约会、周末都能穿" },
    { "id": "s4", "seconds": 3, "image": "docs/flat-lay/garment-flatlay.jpg",
      "prompt": "Product laid flat on light wood, slow top-down pull-back, clean and calm.",
      "caption": "现在下单立减 50" }
  ]
}
```

`caption` 会按 `seconds` 累加自动排时间轴生成 SRT，不用手对时间码。

---

## 四、工具调用

```bash
export DLAZY_VIDEO_MODEL=<你账号里可用的视频模型 ID>

node scripts/video.mjs --mode storyboard --task product-video-ad \
  --board examples/board.json --outdir out/ad --subtitles --brand examples/brand.yaml

# 先看计划，不计费
node scripts/video.mjs --mode storyboard --task product-video-ad \
  --board examples/board.json --outdir out/ad --dry-run
```

产出：

```
out/ad/s1.mp4 … s4.mp4     每个镜头
out/ad/captions.srt        字幕
out/ad/concat.txt          拼接清单
out/ad/final.mp4           成片
out/ad/final-sub.mp4       带字幕成片
```

某个镜头失败不影响其他镜头——重跑那一个，再手动拼一次即可。

---

## 五、执行流程

1. **先要卖点，不要直接写分镜**。问用户：主推什么、给谁看、投哪个平台。
2. **写分镜给用户确认**。文字确认比生成完再改便宜一个数量级。
3. **`--dry-run` 看一遍**。确认每镜的 prompt 和参考图对得上。
4. **跑**。逐镜生成，失败的单独补。
5. **看成片**。不满意就改单个镜头重跑，别整条重来。

---

## 六、Prompt 写法

每镜遵循：**运镜 + 主体 + 环境 + 保真约束**

```
<Camera move>. <Subject action>. <Environment>.
Keep the product identical to the reference image.
No text overlay in the frame, no watermark. Photorealistic, cinematic.
```

**关键：`No text overlay in the frame`。** 字幕是后期加的，
让模型自己画文字必然出乱码。

---

## 七、常见问题

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 镜头之间商品不一致 | 每镜独立生成，模型各画各的 | 全部镜头传同一张商品参考图，并用 `--brand` |
| 拼接后画面跳 | 各镜编码参数不同 | 脚本会自动重编码兜底；仍跳就统一各镜的尺寸 |
| 字幕没烧进去 | ffmpeg 没带 libass | 脚本自动降级为软字幕轨，播放器可开关 |
| 没装 ffmpeg | — | 片段照常生成，用输出的 `concat.txt` 事后补拼 |
| 成片太长 | 分镜时长加起来超了 | 投流素材 15 秒最稳，超过 30 秒完播率明显下滑 |

---

## Tips

- **前 3 秒决定一切**。钩子镜头值得多跑几版挑一条。
- **字幕写口语**。「零下十度只穿了这一件」比「优质保暖面料」有效得多。
- **竖版 9:16**。投流素材几乎都是竖版，生成时就按竖版出，别事后裁。
