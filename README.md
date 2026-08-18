# ecommerce-skills

一套面向**电商视觉生产**的 Agent 技能库：把「拍商品图」这件事拆成 19 个可组合的技能，每个技能是一份可直接执行的 `skill.md`，底层统一走命令行调用图像 / 文本模型。

平铺图 → 模特上身图 → 换模特换背景 → 裂变套图 → 详情页 → 投前检测，整条链路不用摄影棚、不约模特。

---

## 安装

技能用 [`npx skills`](https://github.com/vercel-labs/skills) 安装，它会扫描本仓库的 `skills/` 目录，把技能装进 Claude Code / Codex / Cursor 等 agent 的技能目录。

一次装全部 19 个：

```bash
npx skills add https://github.com/dlazyai/ecommerce-skills --all
```

`--all` 等价于 `--skill '*' --agent '*' -y`：装全部技能、装到所有检测到的 agent、跳过确认。只想装给某一个 agent：

```bash
npx skills add https://github.com/dlazyai/ecommerce-skills --skill '*' --agent claude-code
```

只装用得上的几个（技能名就是下面索引表第一列，一个技能一个 `--skill`）：

```bash
npx skills add https://github.com/dlazyai/ecommerce-skills \
  --skill flat-lay --skill fission-pattern --skill detect-task
```

先看看有哪些：

```bash
npx skills add https://github.com/dlazyai/ecommerce-skills --list
```

默认装到当前项目（`.claude/skills/<name>/`），加 `-g` 装到用户级、所有项目共用。后续 `npx skills update` 更新、`npx skills remove` 卸载。

懒得记命令：仓库根目录的 [`install.sh`](install.sh)（macOS / Linux）和 [`install.ps1`](install.ps1)（Windows）就是上面这条一键安装的封装。

```bash
./install.sh                 # 当前项目
./install.sh -g              # 用户级，所有项目共用
./install.sh claude-code     # 只装给指定 agent
```

```powershell
.\install.ps1 -Global
```

不想装也行：任何一份 `skill.md` 的内容直接贴进对话，Agent 照着执行即可。

---

## 技能索引

### 商品上身 — 让商品出现在人身上

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [flat-lay](skills/flat-lay/skill.md) | 服装图一键上身试穿 | 服装平铺图 + 参考图 → 模特上身商拍图 | `gpt-image-2` |
| [wear-everything](skills/wear-everything/skill.md) | 鞋包配饰真人穿戴 | 商品图 + 参考图 → 真人佩戴图 | `gpt-image-2` |
| [image-fusion](skills/image-fusion/skill.md) | 多单品自由搭配融图 | 最多 8 张单品 → 一整套 Look 模特图 | `seedream-5.0` |

### 单图变多图 — 一张图裂变成一屏

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [one-shot](skills/one-shot/skill.md) | 换模特 / 换背景 | 已有模特图 → 多人群多场景版本 | `gpt-image-2` |
| [fission-pattern](skills/fission-pattern/skill.md) | 一张图裂变完整套图 | 商品图 + 卖点 → 多角度多场景套图 | `gpt-image-2` |
| [item-detail](skills/item-detail/skill.md) | 一键生成全套详情图 | 商品图 + 卖点 → 带中文排版的详情页模块 | `seedream-5.0-pro` |

### 图片创作 — 从零造图

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [creative-scene](skills/creative-scene/skill.md) | 创意生图 + 改模特/姿势/搭配模板 | 一句描述（可选参考图）→ 图 | `banana-pro` |

### 企业功能 — 规模化与质量把关

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [batch-image](skills/batch-image/skill.md) | 多商品批量生图流水线 | 商品清单 CSV → 整批统一视觉的商拍图 | `seedream-5.0` |
| [detect-task](skills/detect-task/skill.md) | 投前检测（AI 图质检） | 待检图 → 风险报告 + prompt 修正句 | `claude-sonnet-5` |

### 自定义功能 — 单点能力

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [to-3d](skills/to-3d/skill.md) | 平铺图转 3D 立体图 | 平铺图 → 隐形模特立体图 | `gpt-image-2` |
| [clothing-extraction](skills/clothing-extraction/skill.md) | 从任意图提取商品平铺图 | 真人图/街拍图 → 干净平铺图 | `gpt-image-2` |
| [fabric-on-body](skills/fabric-on-body/skill.md) | 一键替换服装面料 | 版式图 + 面料图 → 新面料样衣 | `gpt-image-2` |
| [clothing-detail](skills/clothing-detail/skill.md) | 服装细节放大图 | 服装图 → 工艺/面料微距特写 | `gpt-image-2` |
| [clothing-grass-planting](skills/clothing-grass-planting/skill.md) | 相同穿搭改模特场景姿势 | 穿搭图 → 社交平台种草图 | `gpt-image-2` |
| [item-selling-point](skills/item-selling-point/skill.md) | 商品图生成电商主图 | 商品图 + 卖点 → 带文案的转化主图 | `seedream-5.0-pro` |
| [item-change-background](skills/item-change-background/skill.md) | 商品换背景 | 白底商品图 → 逼真场景图 | `gpt-image-2` |
| [remove-watermark](skills/remove-watermark/skill.md) | 去水印去文字 | 带文字/水印的图 → 干净图 | `gpt-image-2` |
| [material-enhancement](skills/material-enhancement/skill.md) | 材质质感增强 | 糊掉的图 + 高清商品图 → 纹理重建 | `gpt-image-2` |
| [item-repair](skills/item-repair/skill.md) | 商品精修 / 去褶皱 | 随手拍商品图 → 精修可上架图 | `gpt-image-2` |

---

## 典型链路

技能之间可以串起来用，输出直接作为下一步的输入。

**新款上架（只有一张平铺图）**

```
item-repair          精修平铺图（压平褶皱、匀光、纯净背景）
  └→ flat-lay        平铺图 → 模特上身商拍图
      ├→ fission-pattern    裂变成 5 张主图位
      ├→ clothing-detail    补 2~3 张工艺细节图
      ├→ item-detail        生成详情页各模块
      └→ detect-task        上架前逐张质检
```

**一次拍摄覆盖多市场**

```
one-shot             同一件衣服 → 国内/欧美/不同年龄段版本
  └→ detect-task     抽检
```

**只有真人图，缺平铺素材**

```
clothing-extraction  真人图/买家秀 → 干净平铺图
  └→ to-3d           平铺图 → 立体图（主图更有质感）
  └→ fabric-on-body  同版型试多种面料
```

**内容种草铺量**

```
flat-lay 或已有商拍图
  └→ clothing-grass-planting   一套穿搭 → 5 个生活场景版本
      └→ remove-watermark      清掉旧图上的文字/水印
```

**整店改版（上百 SKU）**

```
batch-image          清单驱动，整批统一视觉
  └→ detect-task     抽检 10~30%，高风险自动打回重跑
      └→ 取报告里的英文修正句 → 追加到原 prompt → 重跑
```

---

## 算力成本参考

每个技能都支持 `--dry-run`：只打印参数与算力估价、不真正生成。下表是各模型的实测估价（credits / 张）：

| 模型 | 单价 | 用在哪 |
| --- | --- | --- |
| `claude-sonnet-5` | **3** | 投前检测（输出报告，不出图） |
| `seedream-5.0` | **5** | 批量生图、多单品融图（性价比优先） |
| `seedream-5.0-pro` | **7** | 中文排版（详情页、卖点主图） |
| `banana-pro` | **18** | 文生图创作 |
| `gpt-image-2` `--quality medium` | **33** | 大多数定向编辑（换背景、换模特、提取、去印） |
| `gpt-image-2` `--quality high` | **60** | 材质与细节优先（细节图、材质增强、精修） |

省钱的三条经验：

1. **先 `--dry-run`**，确认单价 × 张数再跑。
2. **探索期用低档**：`banana-pro --imageSize 1K --batch 4` 看方向，定稿再出 2K。
3. **批量场景 `--batch 1`**：`--batch N` 会让成本乘 N；批量靠 SKU 数量，不靠 batch。

> 余额不足会返回 `code: "insufficient_balance"`，按技能文档「错误处理」一节的提示充值后重跑即可。

---

## 示例素材说明

`docs/<skill-name>/` 下的**输入素材**用于演示，**输出图全部为实际执行生成**——不是效果图，命令原样写在各技能的「生成效果示例」一节里，可复现。

---

## 注意事项

- **生成结果需要人工鉴别**。所有技能的输出都是模型推断，被遮挡区域、重建区域的内容不保证与实物一致；关键部位（图案位置、五金细节、尺码信息）上架前必须人工核对。
- **不做的事**写在每个技能的「能力边界」里，包括：不编造商品不具备的功能、不生成虚假促销、不伪造他人肖像代言、不抹除商品缺陷。
- **合规**：带文案的技能（[item-detail](skills/item-detail/skill.md)、[item-selling-point](skills/item-selling-point/skill.md)）注意绝对化用语与虚假促销；上架前建议过一遍 [detect-task](skills/detect-task/skill.md)。

---

## License

见 [LICENSE](LICENSE)。
