---
name: ugc-testimonial
description: UGC 口播种草视频。商品 + 人设 → 口播脚本与成片，达人自拍质感。当用户说「口播视频」「种草视频」「达人风格」「UGC」「真人推荐」时使用。
---

# ugc-testimonial — UGC 口播种草

投流素材里转化最好的一类往往不是精致广告，而是**看起来像真人随手拍的推荐**。

这个技能生成那种质感：手持、家里的光、说人话。

---

## 一、能力边界

| 能做 | 说明 |
| --- | --- |
| 口播脚本 | 商品 + 人设 → 一段能照着念的话 |
| 分镜 | 口播镜头 + 商品特写的交替结构 |
| UGC 质感 | 手持轻晃、室内自然光、非专业构图 |
| 多人设 | 同一商品换人设出多版做 A/B |

| 不能做 | 说明 |
| --- | --- |
| 对口型 | 生成模型做不好唇形同步，成片建议配旁白而不是同期声 |
| 冒充真人 | 不要声称是真实买家评价，见下方「合规」 |

---

## 二、合规先说

UGC 风格 ≠ 伪造评价。生成的内容**不能声称是真实买家的真实使用体验**。

| 可以 | 不可以 |
| --- | --- |
| AI 生成的演示型口播 | 冒充具名真实买家的评价 |
| 「这件我穿了一周」的场景演绎 | 伪造好评截图、伪造买家秀 |
| 按平台要求标注 AI 生成 | 隐瞒 AI 生成身份（部分平台强制标注） |

各平台对 AI 生成内容的标注要求不同，投放前确认目标平台的规则。

---

## 三、人设与脚本

**人设三要素**：谁、什么场景、为什么可信。

| 人设 | 开场白范式 |
| --- | --- |
| 通勤白领 | 「每天挤地铁，我需要一件不用打理的……」 |
| 学生党 | 「预算两百，我对比了五家……」 |
| 宝妈 | 「带娃根本没时间收拾自己，所以……」 |
| 健身人群 | 「练完一身汗，这件……」 |

**脚本骨架（15 秒）**

```
0-3s   钩子：说一个具体的痛点，不说商品
3-8s   转折：为什么这个能解决 —— 给一个可验证的细节
8-12s  展示：镜头切到商品特写
12-15s 落点：给一个行动理由，语气随意
```

**写口播的三条铁律**

1. **说具体的**。「特别暖和」无效，「零下五度我只穿了这一件」有效。
2. **留犹豫**。真人说话有停顿和自我修正，全是完美长句就假了。
3. **不念参数**。参数放字幕，嘴里说感受。

---

## 四、工具调用

```bash
export DLAZY_VIDEO_MODEL=<你账号里可用的视频模型 ID>

node scripts/video.mjs --mode storyboard --task ugc-testimonial \
  --board examples/ugc-board.json --outdir out/ugc --subtitles
```

分镜里交替口播镜头与商品镜头：

```json
{
  "shots": [
    { "id": "talk1", "seconds": 4, "image": "assets/model/face-a.jpg",
      "prompt": "Handheld selfie-style shot, young woman talking to camera in a bright apartment, slight natural camera shake, warm window light, casual home background. She is wearing the olive cable-knit sweater.",
      "caption": "零下五度，我就穿了这一件" },
    { "id": "detail1", "seconds": 3, "image": "docs/flat-lay/garment-flatlay.jpg",
      "prompt": "Handheld close-up of the sweater texture, phone-camera look, natural indoor light.",
      "caption": "粗棒针织，比看起来厚" },
    { "id": "talk2", "seconds": 4, "image": "assets/model/face-a.jpg",
      "prompt": "Handheld selfie-style shot, same woman, she pulls the collar up and smiles, same apartment.",
      "caption": "洗了三次也没变形" }
  ]
}
```

**关键 prompt 词**：`handheld`、`selfie-style`、`slight natural camera shake`、
`phone-camera look`、`natural indoor light`、`casual` —— 这些制造「不专业」的质感。
不要写 `cinematic`、`professional lighting`、`studio`，那会把 UGC 感抹掉。

---

## 五、执行流程

1. **先定人设**。问用户卖给谁，人设跟着买家画像走。
2. **写脚本给用户确认**。口播文案比画面更决定转化。
3. **锁脸**。多个口播镜头必须是同一个人，用 [brand-kit](../brand-kit/skill.md) 的 `model.reference`。
4. **`--dry-run` 过一遍**，再真跑。
5. **配旁白**。生成的视频不做唇形同步，成片后用剪辑软件配一条旁白，比同期声自然。

---

## 六、常见问题

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 看起来还是像广告 | prompt 里有 `cinematic` / `professional` | 换成 handheld / phone-camera look |
| 几个镜头不是同一个人 | 没锁脸 | 用 `--brand` 带 `model.reference` |
| 嘴型对不上 | 模型不做唇形同步 | 别用同期声，配旁白；或改用不露脸的手持镜头 |
| 表情僵硬 | 人脸是视频模型弱项 | 缩短口播镜头，多用商品特写切换 |

---

## Tips

- **口播镜头短、商品镜头长**。人脸生成越久越容易崩，3–4 秒一切。
- **同一脚本换人设出三版**做 A/B，投流看数据说话。
- **字幕必须有**。大部分人静音刷视频。
