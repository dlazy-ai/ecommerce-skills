---
name: cross-border-localize
description: 跨境一套素材多区域本地化。一套素材 → 多语言文案、尺码换算表、区域合规标识。当用户说「跨境本地化」「多语言」「翻译上架」「海外版本」「英文版主图」时使用。
---

# cross-border-localize — 跨境本地化

同一件商品卖去不同国家，**不是把中文文案翻译一遍就完事**。

尺码体系不同、合规标识不同、审美偏好不同、平台规格也不同。
这个技能把一套素材铺成多个区域可直接上架的版本。

---

## 一、能力边界

| 能做 | 说明 |
| --- | --- |
| 文案本地化 | 不是直译，是按当地表达习惯重写 |
| 尺码换算 | CN / US / UK / EU / JP 对照表 |
| 区域版主图 | 带当地语言文案排版的主图 |
| 平台规格适配 | 各区域主流平台的图片规格 |
| 合规标识提示 | 提示该区域常见的必需标识 |

| 不能做 | 说明 |
| --- | --- |
| 法律意见 | 合规标识只做提示，正式上架前请咨询专业渠道 |
| 保证翻译无误 | 重要文案请母语者过一遍 |

---

## 二、本地化不等于翻译

| 维度 | 中国站 | 北美站 | 日本站 |
| --- | --- | --- | --- |
| 文案风格 | 卖点密集、数字多 | 简洁、强调场景与个性 | 礼貌、克制、细节详尽 |
| 主图信息量 | 可带较多文字 | 主图通常禁文字 | 信息密度中等 |
| 尺码 | S/M/L + 具体厘米 | XS–XXL，需换算 | 号数体系不同，偏小 |
| 模特 | 亚洲面孔 | 需要多元面孔 | 亚洲面孔 |
| 促销表达 | 直给折扣 | 强调价值与保障 | 强调品质与售后 |

**最常见的错误**：把中文主图的密集文案直译贴到 Amazon 主图上——
主图禁文字，直接驳回。

---

## 三、尺码换算

上装（女装，仅供参考，具体以品牌尺码表为准）：

| CN | US | UK | EU | JP |
| --- | --- | --- | --- | --- |
| S / 155-160 | 2-4 | 6-8 | 34-36 | 7-9 |
| M / 160-165 | 6-8 | 10-12 | 38-40 | 11-13 |
| L / 165-170 | 10-12 | 14-16 | 42-44 | 15-17 |
| XL / 170-175 | 14-16 | 18-20 | 46-48 | 19-21 |

**永远同时给具体厘米数。** 各品牌版型差异大，字母码不可靠，
胸围/肩宽/衣长的厘米数才是买家真正要的，也是降低退货率最有效的一项。

---

## 四、区域平台规格

| 区域 | 主流平台 | 图片规则要点 |
| --- | --- | --- |
| 北美 | Amazon | 主图纯白 RGB(255,255,255)、商品占 ≥85%、禁文字水印 |
| 东南亚 | Shopee / Lazada | 方图，体积限制紧（≤2MB） |
| 全球 | TikTok Shop | 1:1 或 3:4，禁边框水印 |
| 全球 | Temu | 方图、干净背景、主图禁促销文字 |
| 独立站 | Shopify | 无硬性限制，2048 方图便于放大镜 |

各区域版本出完，逐个过校验：

```bash
python3 scripts/check_listing.py out/us/*.jpg --platform amazon
python3 scripts/check_listing.py out/sea/*.jpg --platform shopee
python3 scripts/check_listing.py out/global/*.jpg --platform tiktok-shop
```

---

## 五、工具调用

**北美版主图（无文字，走合规路线）**

```bash
node scripts/gen.mjs --task cross-border-localize --brand examples/brand.yaml \
  --prompt 'E-commerce main image of an olive cable-knit crewneck sweater on a model. Diverse casting suitable for the North American market. Pure seamless white background, RGB 255,255,255. Product fills 88% of the frame. No text, no logo, no watermark.' \
  --images docs/flat-lay/garment-flatlay.jpg docs/flat-lay/pose-reference.jpg \
  --save out/us/A001-main.jpg

python3 scripts/check_listing.py out/us/A001-main.jpg --platform amazon
```

**日本站详情图（带日文排版）**

```bash
node scripts/gen.mjs --task cross-border-localize --brand examples/brand.yaml \
  --prompt 'E-commerce detail module for a Japanese marketplace listing. Olive cable-knit sweater. Clean vertical layout with generous margins, restrained typography. Japanese text overlay reading: 「厚手ケーブルニット」「三層構造で暖かい」. Soft neutral background. No watermark.' \
  --images docs/flat-lay/garment-flatlay.jpg \
  --save out/jp/A001-detail.jpg
```

⚠️ **模型生成的非英文文字经常出错**（尤其日文汉字与假名混排）。
带文字的版本一律要人工核对，或改用「生成无文字底图 + 后期排版」的路子。

---

## 六、执行流程

1. **问清楚卖去哪些区域**，别默认「全球」。
2. **先做无文字版本**。无文字主图能通行大多数平台，是最省事的公共底座。
3. **按区域派生**：需要文字的单独出，出完人工核对文字。
4. **逐区域过合规校验**，规格不同不能混用。
5. **尺码表单独出一张**，同时给字母码和厘米数。
6. **合规标识**：提示用户该区域常见的必需标识（成分标、原产地、认证标等），
   并明确说明这只是提示，正式上架前需自行确认。

---

## 七、常见问题

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 生成的外文有错字 | 模型对非拉丁文字支持弱 | 生成无文字底图，文字后期排 |
| 中文主图直接翻译后被驳回 | 目标平台主图禁文字 | 出无文字版本 |
| 退货率高 | 只给了字母码 | 补厘米数与模特试穿尺码 |
| 一套图打天下被多个平台拒 | 各平台规格不同 | 按区域各出一版，逐个过校验 |

---

## Tips

- **无文字底图是资产**。先做好它，各区域再派生，比每个区域从头生成省得多。
- **模特选型跟着市场走**。北美站需要多元面孔，这不是政治正确，是转化率问题。
- **厘米数比什么文案都管用**。跨境退货成本高，尺码信息越具体越省钱。
