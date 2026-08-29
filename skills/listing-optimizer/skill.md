---
name: listing-optimizer
description: 主图 A/B 组与转化复盘。商品图 + 卖点 → 多组对照主图 + 每组的差异假设 + 复盘模板。当用户说「A/B 测试」「主图优化」「提点击率」「哪版更好」「换个版本试试」时使用。
---

# listing-optimizer — 主图 A/B 与复盘

其他技能交付的是**图**，这个技能交付的是**一次可复盘的实验**。

区别在于：随便多生成几张不叫 A/B。A/B 要求每组之间**只有一个变量不同**，
并且事先写下你预期哪组会赢、为什么。否则跑完也不知道是什么在起作用。

---

## 一、能力边界

| 能做 | 说明 |
| --- | --- |
| 单变量对照组 | 一次只改一个维度，其余保持一致 |
| 假设记录 | 每组附「预期效果 + 理由」，跑完能复盘 |
| 合规校验 | 每张自动过 [platform-compliance](../platform-compliance/skill.md)，避免因驳回污染数据 |
| 复盘模板 | 产出可填数据的对照表 |

| 不能做 | 说明 |
| --- | --- |
| 接平台数据 | 不连后台，点击率转化率要你自己填回来 |
| 判断统计显著性 | 样本量不够时别下结论，见「常见问题」 |

---

## 二、可测的变量

一次实验只动一个：

| 变量 | A（对照） | B（实验） | 假设 |
| --- | --- | --- | --- |
| 背景 | 纯白 | 生活场景 | 场景图代入感强，点击率更高 |
| 景别 | 全身 | 半身特写 | 小屏上特写更清楚 |
| 有无模特 | 平铺图 | 模特上身 | 服装类上身图更有说服力 |
| 文案 | 无文字 | 左上角卖点标 | 文字提升信息密度（注意平台是否允许） |
| 模特 | 亚洲面孔 | 欧美面孔 | 跟目标市场匹配 |
| 色调 | 冷白 | 暖调 | 暖调在家居类更讨喜 |

**别一次改三个。** 三个变量一起动，赢了也不知道是哪个赢的。

---

## 三、工具调用

生成对照组 —— 两条命令只差一处 prompt：

```bash
# A 组：纯白背景（对照）
node scripts/gen.mjs --task listing-optimizer --brand examples/brand.yaml \
  --prompt 'E-commerce main image of the olive cable-knit sweater on a model. Pure seamless white background, RGB 255,255,255. Full body, product fills 88% of the frame. No text, no watermark.' \
  --images docs/flat-lay/garment-flatlay.jpg docs/flat-lay/pose-reference.jpg \
  --batch 3 --save out/ab/A-white.jpg

# B 组：生活场景（只改这一处）
node scripts/gen.mjs --task listing-optimizer --brand examples/brand.yaml \
  --prompt 'E-commerce main image of the olive cable-knit sweater on a model. Warm minimal apartment interior, soft window light. Full body, product fills 88% of the frame. No text, no watermark.' \
  --images docs/flat-lay/garment-flatlay.jpg docs/flat-lay/pose-reference.jpg \
  --batch 3 --save out/ab/B-lifestyle.jpg
```

每组出 `--batch 3` 挑一张最好的，避免拿单次生成的运气当结论。

合规校验（被驳回的图会污染实验数据）：

```bash
python3 scripts/check_listing.py out/ab/*.jpg --platform amazon
```

---

## 四、复盘模板

生成时就把这张表建好，投放后填数据：

```markdown
## 实验：主图背景 白底 vs 生活场景
- SKU：A001 军绿麻花针织衫
- 平台 / 坑位：Amazon 主图
- 起止：2026-09-01 ~ 2026-09-14
- 变量：背景（其余保持一致：同模特、同景别、同色调、无文字）

| 组 | 图 | 假设 | 曝光 | 点击 | 点击率 | 加购 | 转化率 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A 对照 | A-white.jpg | 白底信息干净，符合平台预期 | | | | | |
| B 实验 | B-lifestyle.jpg | 场景图代入感强，点击率更高 | | | | | |

**结论**：
**下一步**：
```

**「假设」必须在跑之前写。** 事后编理由是复盘最常见的自欺。

---

## 五、执行流程

1. **问清楚要优化什么指标**。点击率和转化率的优化方向经常相反——
   猎奇主图能提点击率，但会拉低转化率并推高退货。
2. **选一个变量**。用户想改三样时，告诉他排队做三轮。
3. **写假设**，让用户确认。
4. **生成 + 合规校验**。
5. **给出复盘模板**，明确说清数据要用户自己填回来。
6. **样本量不够别下结论**。见下。

---

## 六、常见问题

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 两组差异很小 | 变量选得太弱（比如只调了一点色温） | 换更有区分度的变量 |
| 数据看着 B 赢但不确定 | 曝光量太小 | 每组至少几千次曝光再看；差异小于 10% 时更要谨慎 |
| 点击率涨了转化率掉了 | 主图过度承诺 | 主图要准确，别为点击率牺牲一致性 |
| 组间不止一个变量不同 | prompt 改动没控制住 | 两条 prompt diff 一遍，确认只差一处 |

---

## Tips

- **一次一个变量，一轮两周**。急着一周出结论通常是自欺。
- **先测大变量**。有没有模特、白底还是场景，这类差异远大于色温微调。
- **赢的那版存进 [brand-kit](../brand-kit/skill.md)**，让它成为之后的默认，实验成果才会沉淀。
