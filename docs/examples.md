# 生成效果示例

[← 回到 README](../README.md)

以下内容与各技能的「生成效果示例」一节一致：输入素材在 `docs/<skill-name>/` 下，输出图为实际执行生成（非效果图），命令原样照抄可复现。

---

## 商品上身 — 让商品出现在人身上

### [flat-lay](../skills/flat-lay/skill.md) — 服装图一键上身试穿

| 输入：服装平铺图 | 输入：参考图 |
| --- | --- |
| <img src="flat-lay/garment-flatlay.jpg" width="300"> | <img src="flat-lay/pose-reference.jpg" width="300"> |
| `garment-flatlay.jpg` — 军绿色麻花针织圆领毛衣，800×800 | `pose-reference.jpg` — 男青年正面站姿、浅灰墙棚拍，768×1024 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'E-commerce on-model product photography. Image 1 is the garment flat-lay: an olive-green cable-knit crewneck sweater. Image 2 is the pose/scene reference. Dress the model from image 2 in the garment from image 1, replacing the grey T-shirt. Keep the garment 100% faithful: identical olive-green color, cable-knit and diamond texture, oversized drop-shoulder fit, ribbed collar and cuffs, and the small woven label on the right cuff. Reproduce the reference exactly for pose, camera angle, crop, body proportions, lighting and the plain light-grey studio wall background. Photorealistic full-frame catalog shot, sharp fabric detail, natural soft light, no text or watermark.' \
  --images docs/flat-lay/garment-flatlay.jpg docs/flat-lay/pose-reference.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --save docs/flat-lay/example-output.jpg
```

**输出**

<img src="flat-lay/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536，60 credits，约 60s。

麻花织法、菱形提花、落肩版型、袖口罗纹与右袖织标均被保留；姿势、景别、光线与浅灰背景照抄参考图。

### [wear-everything](../skills/wear-everything/skill.md) — 鞋包配饰真人穿戴

| 输入：商品图 | 输入：参考图 |
| --- | --- |
| <img src="wear-everything/product-sunglasses.jpg" width="280"> | <img src="wear-everything/model-reference.jpg" width="280"> |
| `product-sunglasses.jpg` — 玳瑁色方框墨镜，768×1024 | `model-reference.jpg` — 女青年正脸、夜景街拍，768×1024 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'On-model accessory product photography. Image 1 is the product: a pair of tortoise-brown rectangular sunglasses with dark grey lenses. Image 2 is the model/scene reference. Put the sunglasses from image 1 onto the face of the model in image 2, correctly seated on the nose bridge and ears with natural perspective, realistic lens reflections and a soft shadow on the cheekbones. Keep the product 100% faithful: identical frame shape, tortoise-brown acetate color and grain, hinge and temple design, lens tint. Change nothing else — face, hair, scarf, coat, bag chain, night street background, colour grading and crop must stay pixel-identical to image 2. Photorealistic, no text, no watermark.' \
  --images docs/wear-everything/product-sunglasses.jpg docs/wear-everything/model-reference.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/wear-everything/example-output.jpg
```

**输出**

<img src="wear-everything/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536。墨镜按正确的鼻梁/耳挂关系落位，镜框玳瑁纹理与镜片色保留；模特五官、围巾千鸟格、夜景街道与色调保持原样。

### [image-fusion](../skills/image-fusion/skill.md) — 多单品自由搭配融图

| 输入单品 1 | 输入单品 2 | 输入单品 3 |
| --- | --- | --- |
| <img src="image-fusion/item-sweater.jpg" width="200"> | <img src="image-fusion/item-hat.jpg" width="200"> | <img src="image-fusion/item-necklace.jpg" width="200"> |
| `item-sweater.jpg` — 军绿麻花针织毛衣 | `item-hat.jpg` — 彩色编织渔夫帽 | `item-necklace.jpg` — 珍珠项链 |

实际执行的命令：

```bash
dlazy seedream-5.0 \
  --prompt '电商搭配商拍图。将参考图中的多件单品组合到同一个模特身上：图1 的军绿色麻花针织圆领毛衣作为上装，图2 的彩色编织渔夫帽戴在头上，图3 的珍珠项链戴在颈部。每件单品必须与参考图完全一致——颜色、织法纹理、图案、材质与细节都不能改。下装自动补一条米白色阔腿长裤，脚穿白色运动鞋。青年亚洲女模特，正面站姿，全身入画，纯浅灰色摄影棚背景，柔和顶光，真实照片质感，无文字无水印。' \
  --images docs/image-fusion/item-sweater.jpg docs/image-fusion/item-hat.jpg docs/image-fusion/item-necklace.jpg \
  --size 3:4 --resolution 2k \
  --save docs/image-fusion/example-output.jpg
```

**输出**

<img src="image-fusion/example-output.jpg" width="320">

`example-output.jpg` — 3:4 / 2K，5 credits。三件单品同时到位，毛衣的麻花织法、渔夫帽的编织配色与项链的珠径都被保留；未提供的下装与鞋按 prompt 指定补齐。

## 单图变多图 — 一张图裂变成一屏

### [one-shot](../skills/one-shot/skill.md) — 换模特 / 换背景

| 输入：原模特图 |
| --- |
| <img src="one-shot/source-model.jpg" width="280"> |
| `source-model.jpg` — 男青年身穿灰色落肩短袖，浅灰棚拍背景，768×1024 |

实际执行的命令（换模特换背景）：

```bash
dlazy gpt-image-2 \
  --prompt 'Replace the model and the background of this e-commerce photo while keeping the garment untouched. Keep the grey oversized short-sleeve T-shirt exactly as it is: same slate-grey colour, same drop-shoulder cut, same white chest logo, same folds and hem. Replace the person with a different male model of similar build and age, and replace the plain studio wall with a sunlit outdoor city street with soft bokeh. Keep the same pose, camera angle, crop and framing. Photorealistic catalog shot, natural light, no text, no watermark.' \
  --images docs/one-shot/source-model.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/one-shot/example-output.jpg
```

**输出**

<img src="one-shot/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536。灰色落肩短袖的颜色、版型、胸前 logo 与下摆弧线保持不变；模特换成另一位男青年，棚拍灰墙换成树影斑驳的街景，姿势与景别沿用原图。

### [fission-pattern](../skills/fission-pattern/skill.md) — 一张图裂变完整套图

| 输入：商品图 |
| --- |
| <img src="fission-pattern/product-watch.jpg" width="280"> |
| `product-watch.jpg` — 黑色鳄鱼纹皮带钢壳银色太阳纹表盘手表 |

实际执行的命令（套图第 2 张，其余两张只换第三段镜位）：

```bash
dlazy gpt-image-2 \
  --prompt 'E-commerce product photography, set image 2 of 3 — in-use lifestyle shot. The subject is the watch from the reference image: a polished stainless-steel watch with a silver sunburst dial, applied baton markers and a black crocodile-embossed leather strap. Keep the product 100% faithful: same case shape and polish, same dial colour and marker layout, same hand shapes, same crown, same strap embossing and stitching — it must be recognisably the identical watch as the reference. Show it worn on a man wrist resting on a wooden cafe table beside a white coffee cup, dark suit sleeve and white shirt cuff visible, warm window light, shallow depth of field with a blurred cafe background. Photorealistic, no text, no watermark.' \
  --images docs/fission-pattern/product-watch.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/fission-pattern/example-output-2.jpg
```

**输出：一套三张**

| 1 · 正面主图 | 2 · 场景使用图 | 3 · 细节微距图 |
| --- | --- | --- |
| <img src="fission-pattern/example-output-1.jpg" width="230"> | <img src="fission-pattern/example-output-2.jpg" width="230"> | <img src="fission-pattern/example-output-3.jpg" width="230"> |
| 蓝图纸 + 黄铜直尺，冷调侧光 | 手腕佩戴 + 咖啡桌，暖色窗光 | 表盘/刻度/表冠微距，硬光勾边 |

三张的商品保真段逐字相同，只有镜位段在变。

### [item-detail](../skills/item-detail/skill.md) — 一键生成全套详情图

| 输入：商品图 |
| --- |
| <img src="item-detail/product-flatlay.jpg" width="280"> |
| `product-flatlay.jpg` — 军绿麻花针织毛衣平铺图，800×800 |

实际执行的命令（首屏 banner 模块）：

```bash
dlazy seedream-5.0-pro \
  --prompt '电商服饰详情页首屏 banner，竖版。左侧是图1 中的军绿色麻花针织圆领毛衣的模特上身图（青年男模特，半身，落肩宽松版型），毛衣颜色、麻花织法与菱形提花必须与图1一致。右上方留白区排版中文标题，大字「粗棒麻花 复古落肩」，副标题小字「羊毛混纺 · 加厚保暖 · 男女同款」。底部一行三个圆形图标配文字「亲肤不扎」「不易变形」「机洗不缩」。整体米灰色背景，暖色调，留白克制，字体为无衬线黑体，排版整齐对齐，商业电商详情页设计感，中文字必须清晰正确无乱码。' \
  --images docs/item-detail/product-flatlay.jpg --size 3:4 \
  --save docs/item-detail/example-output.jpg
```

**输出**

<img src="item-detail/example-output.jpg" width="320">

`example-output.jpg` — 3:4 / 2K，5 credits。模特上身图占左侧，毛衣的军绿色、麻花与菱形提花保留；右上标题「粗棒麻花 复古落肩」与副标题「羊毛混纺 · 加厚保暖 · 男女同款」字形正确、层级分明；底部三个线描图标配「亲肤不扎」「不易变形」「机洗不缩」，米灰底暖调，排版对齐。

## 图片创作 — 从零造图

### [creative-scene](../skills/creative-scene/skill.md) — 创意生图 + 改模特/姿势/搭配模板

本技能不需要输入素材——只有一句描述。

实际执行的命令：

```bash
dlazy banana-pro \
  --prompt 'A long-haired young Asian woman wearing a white puff-sleeve lace midi dress, sitting at a marble table inside a French-style cafe, fresh flowers and pastries arranged on the table, warm white colour grading, soft window light, front three-quarter view, waist-up framing, atmospheric editorial portrait, photorealistic, shot on 85mm, shallow depth of field, no text, no watermark.' \
  --aspectRatio 3:4 --imageSize 2K \
  --save docs/creative-scene/example-output.jpg
```

对应的五槽位拆解：

| 槽位 | 内容 |
| --- | --- |
| 人物 | `a long-haired young Asian woman` |
| 穿着 | `white puff-sleeve lace midi dress` |
| 场景 | `marble table inside a French-style cafe, fresh flowers and pastries` |
| 视角/景别 | `front three-quarter view, waist-up framing` |
| 氛围/影调 | `warm white colour grading, soft window light, atmospheric editorial` |

**输出**

<img src="creative-scene/example-output.jpg" width="320">

`example-output.jpg` — 3:4 / 2K，18 credits。人物、穿着、法式咖啡馆场景、三分之三正面半身景别与暖白影调全部按描述落位。

这张图可以直接作为后续定向修改的输入——例如接 `把模特的上衣变成黑色高领修身打底衫，保持其他不变` 换搭配。

## 企业功能 — 规模化与质量把关

### [batch-image](../skills/batch-image/skill.md) — 多商品批量生图流水线

| 输入：商品清单（2 个 SKU） |
| --- |
| `SKU001` <img src="batch-image/sku-a-sweater.jpg" width="150"> `军绿色麻花针织圆领毛衣，落肩宽松版型` |
| `SKU002` <img src="batch-image/sku-b-shoes.jpg" width="150"> `黑色亮面皮革布洛克德比鞋，厚底系带` |

实际执行的命令（循环体，两个 SKU 只有 `DESC` 与 `--images` 不同，规范段逐字相同）：

```bash
for sku in a-sweater b-shoes; do
  case $sku in
    a-sweater) DESC='军绿色麻花针织圆领毛衣，落肩宽松版型' ;;
    b-shoes)   DESC='黑色亮面皮革布洛克德比鞋，厚底系带' ;;
  esac
  dlazy seedream-5.0 \
    --prompt "电商商拍图。图1 是商品：${DESC}。商品的颜色、材质纹理、款式细节必须与图1完全一致。放置在同一套统一视觉里：纯米白色摄影棚背景，柔和顶光加左侧补光，45 度视角，画面下方留出统一的商品投影，构图与留白在整组图中保持一致。真实商业产品摄影，无文字无水印。" \
    --images docs/batch-image/sku-${sku}.jpg --size 1:1 --resolution 2k \
    --save docs/batch-image/example-output-${sku}.jpg
done
```

**输出：同一套视觉规范下的两个 SKU**

| SKU001 | SKU002 |
| --- | --- |
| <img src="batch-image/example-output-a-sweater.jpg" width="280"> | <img src="batch-image/example-output-b-shoes.jpg" width="280"> |
| 1:1 / 2K，5 credits | 1:1 / 2K，5 credits |

两张的背景色、光位、视角与投影方向一致——因为规范段逐字相同；商品各自保真。100 个 SKU 就是这个循环跑 100 次，总价约 500 credits。

### [detect-task](../skills/detect-task/skill.md) — 投前检测（AI 图质检）

| 输入：待检图 |
| --- |
| <img src="detect-task/candidate.jpg" width="280"> |
| `candidate.jpg` — 由 [flat-lay](../skills/flat-lay/skill.md) 生成的军绿毛衣模特上身图，1024×1536 |

实际执行的命令：

```bash
dlazy claude-sonnet-5 \
  --prompt '你是电商投放前的图片质检员。审查这张 AI 生成的服装商拍图能否直接用于电商投放。全部用中文作答（第 4 项的 prompt 修正句除外）。严格按以下结构输出：
## 1. 风险等级
低风险 / 中风险 / 高风险（三选一）
## 2. 风险项逐条判定
用表格输出，三列：风险项 / 结论（通过 或 命中）/ 证据。风险项固定为这 8 条：商品崩坏、人脸不自然、手部异常、肢体结构错误、文字乱码、光影矛盾、边缘融合痕迹、平台合规。
## 3. 投放建议
建议投放 / 建议重跑 / 建议人工修图
## 4. 修正建议
若建议重跑或人工修图，给出应追加到生成 prompt 的英文修正句 1-3 条；若建议投放，写「无需修正」。
只输出报告，不要寒暄。' \
  --images docs/detect-task/candidate.jpg \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["data"]["texts"][0])' \
  > docs/detect-task/example-report.md
```

**输出**：完整报告见 [`docs/detect-task/example-report.md`](detect-task/example-report.md)，3 credits。摘要：

- **风险等级**：低风险
- **8 项判定**：7 项通过；`文字乱码` 命中（轻微）——左侧袖口的织标图案模糊不可辨
- **投放建议**：建议人工修图（仅需局部处理袖口小标签）
- **修正建议**：`clear and legible brand tag/logo embroidery on cuff, sharp fine detail, no blurry or garbled text`

这条修正句可以直接追加到 flat-lay 的原 prompt 末尾重跑——这就是闭环。

## 自定义功能 — 单点能力

### [to-3d](../skills/to-3d/skill.md) — 平铺图转 3D 立体图

| 输入：平铺图 |
| --- |
| <img src="to-3d/garment-flatlay.jpg" width="280"> |
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

<img src="to-3d/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。肩胸被撑起、袖子自然弯曲、领口露出内里罗纹与背面内衬、下摆有自重投影；麻花与菱形织法、军绿色、罗纹结构与右袖织标保持不变，画面里没有出现人台或人体。

### [clothing-extraction](../skills/clothing-extraction/skill.md) — 从任意图提取商品平铺图

| 输入：任意图 |
| --- |
| <img src="clothing-extraction/source-photo.jpg" width="260"> |
| `source-photo.jpg` — 真人街拍图：浅灰针织连衣裙 + 珍珠项链 + 托特包 + 银色高跟鞋，480×640 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Extract the garment worn by the model in this photo and render it as a clean e-commerce flat-lay. Output only the light-grey textured sleeveless knit mini dress with the mock neckline, laid flat and centred, front view, symmetric, fully unoccluded — remove the model, the pearl necklace, the tote bag, the shoes, the fountain and the whole background. Keep the garment 100% faithful: same light-grey colour, same knit texture, same neckline and armhole shape, same waist seam and hem length. Pure white seamless background, even soft studio light, subtle contact shadow. No person, no props, no text.' \
  --images docs/clothing-extraction/source-photo.jpg \
  --size 1024x1024 --quality medium --imageFormat jpeg \
  --save docs/clothing-extraction/example-output.jpg
```

**输出**

<img src="clothing-extraction/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。模特、项链、托特包、高跟鞋与喷泉背景全部清除，只留连衣裙；摊平居中、左右对称，立领罗纹、袖窿形状、腰线接缝与裙长按原图还原，浅灰针织纹理保留。

### [fabric-on-body](../skills/fabric-on-body/skill.md) — 一键替换服装面料

| 输入：服装版式图 | 输入：面料图 |
| --- | --- |
| <img src="fabric-on-body/style-sheet.jpg" width="260"> | <img src="fabric-on-body/fabric-swatch.jpg" width="260"> |
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

<img src="fabric-on-body/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。落肩剪裁、身长袖长、罗纹领口袖口下摆的结构与平铺角度都与版式图一致；材质从粗针织变成象牙白真丝缎面，褶皱上出现高光、垂坠变得柔顺，罗纹部位仍以缎面质感保留。

### [clothing-detail](../skills/clothing-detail/skill.md) — 服装细节放大图

| 输入：服装图 |
| --- |
| <img src="clothing-detail/garment-flatlay.jpg" width="280"> |
| `garment-flatlay.jpg` — 军绿麻花针织毛衣平铺图，800×800 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Macro detail shot for an e-commerce detail page. Zoom into the shoulder-and-collar area of this olive-green cable-knit sweater and render a photorealistic close-up that fills the frame. Show the ribbed crewneck collar meeting the raglan-style cable panel, individual yarn plies and the twist of the cable braid, the loft of the wool fibres, and soft directional light raking across the surface to reveal depth. Keep the colour and stitch pattern exactly as in the source. Shallow depth of field with the far edge softly out of focus, clean neutral background bokeh, no person, no text, no watermark.' \
  --images docs/clothing-detail/garment-flatlay.jpg \
  --size 1024x1024 --quality high --imageFormat jpeg \
  --save docs/clothing-detail/example-output.jpg
```

**输出**

<img src="clothing-detail/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024，60 credits。领口罗纹与麻花panel的交接、每根纱线的捻向、羊毛纤维的绒毛感都被解析出来，侧光让菱形提花的凹凸立体可见，远端落入柔和虚化。

### [clothing-grass-planting](../skills/clothing-grass-planting/skill.md) — 相同穿搭改模特场景姿势

| 输入：原穿搭图 | 输入：场景/模特参考图 |
| --- | --- |
| <img src="clothing-grass-planting/source-outfit.jpg" width="240"> | <img src="clothing-grass-planting/scene-reference.jpg" width="240"> |
| `source-outfit.jpg` — 浅灰针织连衣裙 + 珍珠项链 + 托特包 + 银色高跟鞋，喷泉庭院 | `scene-reference.jpg` — 咖啡馆门口街拍，手抚头发，树影暖光 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Lifestyle social-commerce photo. Image 1 shows the outfit to keep: a light-grey textured sleeveless knit mini dress with a mock neckline, a pearl choker, a cream-and-tan tote bag and silver pointed heels. Image 2 is the model, pose, scene and lighting reference: a young woman on a sunlit tree-lined street outside a coffee shop, hand in her hair, warm dappled daylight, shallow depth of field. Put the complete outfit from image 1 onto the model from image 2. Keep every garment detail faithful: same grey knit texture, same neckline and hem length, same pearl choker, same tote bag colour blocking. Reproduce image 2 for the model identity, pose, camera angle, crop, street background and colour grading. Photorealistic influencer-style photo, no text, no watermark.' \
  --images docs/clothing-grass-planting/source-outfit.jpg docs/clothing-grass-planting/scene-reference.jpg \
  --size 1024x1536 --quality medium --imageFormat jpeg \
  --save docs/clothing-grass-planting/example-output.jpg
```

**输出**

<img src="clothing-grass-planting/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536。连衣裙的浅灰针织纹理、立领、腰线与裙长，珍珠项链的珠径，托特包的米白/棕拼色全部保留；模特、抚发姿势、咖啡馆街景、树影暖光与浅景深照抄参考图。

### [item-selling-point](../skills/item-selling-point/skill.md) — 商品图生成电商主图

| 输入：商品图 |
| --- |
| <img src="item-selling-point/product-shoes.jpg" width="280"> |
| `product-shoes.jpg` — 黑色鳄鱼纹亮面皮革布洛克德比鞋，白底，800×800 |

实际执行的命令：

```bash
dlazy seedream-5.0-pro \
  --prompt '电商正方形主图。主体是图1 中的黑色亮面皮革布洛克德比鞋，鞋型、雕花孔、鞋带与厚底必须与图1完全一致，商品去底后放在画面中央偏左，下方带柔和投影。背景为深灰到浅灰渐变，右侧竖排中文卖点文案：主标题大字「真皮软底 通勤久站不累」，下方两行小字卖点「牛皮鞋面 · 防滑厚底」「三防涂层 · 雨天不怕」。左上角一枚红色圆形促销角标写「满300减30」。无衬线黑体，字号层级分明，排版整齐，中文字清晰正确无乱码，商业电商主图设计。' \
  --images docs/item-selling-point/product-shoes.jpg --size 1:1 \
  --save docs/item-selling-point/example-output.jpg
```

**输出**

<img src="item-selling-point/example-output.jpg" width="320">

`example-output.jpg` — 1:1 / 2048×2048，5 credits。鞋的鳄鱼纹压花、雕花孔、鞋带与厚齿底保持一致，去底后居中偏左带柔和投影；右侧主标题「真皮软底 通勤久站不累」与两行小字卖点字形正确、层级分明；左上红色圆形角标「满300减30」；深灰渐变背景。

### [item-change-background](../skills/item-change-background/skill.md) — 商品换背景

| 输入：商品图 |
| --- |
| <img src="item-change-background/product-shoes.jpg" width="280"> |
| `product-shoes.jpg` — 黑色鳄鱼纹亮面皮革布洛克德比鞋，白底，800×800 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Place this product into a photorealistic lifestyle scene. Keep the pair of black patent leather derby shoes 100% faithful: same glossy patent finish, same brogue perforation pattern, same lacing, same chunky lug sole, same proportions and camera angle. Replace the plain background with a warm autumn scene: a weathered wooden floor beside a window, a few dry maple leaves, soft late-afternoon side light casting a natural contact shadow under each shoe, blurred indoor background. The shoes must sit believably on the surface with correct perspective and grounded shadows. Photorealistic commercial product photography, no text, no watermark.' \
  --images docs/item-change-background/product-shoes.jpg \
  --size 1024x1024 --quality medium --imageFormat jpeg \
  --save docs/item-change-background/example-output.jpg
```

**输出**

<img src="item-change-background/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。鞋的鳄鱼纹压花、雕花孔、白色沿条明线与厚齿底保持不变；背景换成窗边旧木板 + 枫叶，午后侧光在鞋头形成高光，每只鞋下都有接地投影，木纹的暖色被亮面皮革轻微反射。

### [remove-watermark](../skills/remove-watermark/skill.md) — 去水印去文字

| 输入：带水印文字的图 |
| --- |
| <img src="remove-watermark/source-watermarked.jpg" width="280"> |
| `source-watermarked.jpg` — 家纺促销主图：红金边框 + 标题 + 活动时间 + 价格气泡 + 满减券条 + 多色可选角标 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Remove every piece of text, price tag, badge, ribbon and decorative promotional frame from this image, and reconstruct what was behind them. Delete the red-and-gold border frame, the large headline, the date line, the price bubble with the number, the coupon banner and the bottom-right colour label. Keep the photograph itself completely unchanged: same bedroom, same bed, same taupe and cream bedding set, same table lamp, same wall art, same perspective, same colour grading and same resolution. Inpaint the cleared areas so the room continues naturally — walls, headboard, floor and bedding must look seamless, with no ghosting, blur patches or leftover letter shapes. Clean product photo, absolutely no text.' \
  --images docs/remove-watermark/source-watermarked.jpg \
  --size 1024x1024 --quality medium --imageFormat jpeg \
  --save docs/remove-watermark/example-output.jpg
```

**输出**

<img src="remove-watermark/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024。红金边框、标题、活动时间、价格气泡、满减券条与角标全部清除，墙面、床头、地板与四件套接续自然，无字形残影；卧室、床品配色、台灯与墙上装饰画保留。

> 注意：对比原图可以看到房间透视被轻微重构了——这是重建而非像素级修补的正常结果。要严格保留原始像素请用专业修图工具。

### [material-enhancement](../skills/material-enhancement/skill.md) — 材质质感增强

| 输入：原图（待增强） | 输入：高清商品图（真实面料） |
| --- | --- |
| <img src="material-enhancement/source-image.jpg" width="240"> | <img src="material-enhancement/hires-product.jpg" width="240"> |
| `source-image.jpg` — 军绿麻花毛衣上身图，1024×1536 | `hires-product.jpg` — 同款毛衣高清平铺图，800×800 |

实际执行的命令：

```bash
dlazy gpt-image-2 \
  --prompt 'Texture enhancement pass. Image 1 is the on-model photo to improve. Image 2 is the high-resolution product photo that defines the true fabric. Rebuild the sweater surface in image 1 using the real texture from image 2: crisp cable-braid relief, visible knit loops and yarn twist, natural wool loft, correct fold shadows and a matte fibre sheen. Do not change anything else — the model face, hair, hands, pose, brown trousers, background, framing and colour grading must stay identical to image 1. The garment silhouette and colour must not shift; only the material fidelity and micro-detail improve. Photorealistic, sharp, no text, no watermark.' \
  --images docs/material-enhancement/source-image.jpg docs/material-enhancement/hires-product.jpg \
  --size 1024x1536 --quality high --imageFormat jpeg \
  --save docs/material-enhancement/example-output.jpg
```

**输出**

<img src="material-enhancement/example-output.jpg" width="320">

`example-output.jpg` — 1024×1536，60 credits。麻花辫的立体起伏、菱形提花的凹凸、羊毛的绒毛感与褶皱处的暗部层次被重建；模特五官、发型、手部、姿势、棕色长裤、灰墙背景与整体色调保持不变，毛衣轮廓与军绿色未偏移。

### [item-repair](../skills/item-repair/skill.md) — 商品精修 / 去褶皱

| 输入：原商品图 |
| --- |
| <img src="item-repair/source-flatlay.jpg" width="280"> |
| `source-flatlay.jpg` — 军绿麻花针织毛衣平铺图（袖身有随机褶皱、左右不完全对称），800×800 |

实际执行的命令（平铺图精修 + 材质增强）：

```bash
dlazy gpt-image-2 \
  --prompt 'Studio retouch of a flat-lay garment photo. Clean up this olive-green cable-knit sweater to catalog standard: press out the random wrinkles and creases in the body and sleeves, straighten and symmetrise the silhouette, square the shoulders, align both sleeves evenly, tidy the collar and hem, and even out the lighting so there is no hot spot or colour cast. Keep the cable-knit and diamond stitch pattern, the exact olive-green colour, the ribbed collar/cuffs/hem and the woven cuff label unchanged and sharper than before. Pure white seamless background with a subtle soft contact shadow. Photorealistic, print-ready, no text, no watermark.' \
  --images docs/item-repair/source-flatlay.jpg \
  --size 1024x1024 --quality high --imageFormat jpeg \
  --save docs/item-repair/example-output.jpg
```

**输出**

<img src="item-repair/example-output.jpg" width="320">

`example-output.jpg` — 1024×1024，60 credits。随机褶皱被压平、肩线方正、两只袖子长度与角度对齐、下摆罗纹平整、光照均匀无高光斑；麻花与菱形织法、军绿色、罗纹结构与右袖织标保留且比原图更清晰，背景提纯为白底带柔和接地投影。

