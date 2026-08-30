# ecommerce-skills

[![ci](https://github.com/dlazy-ai/ecommerce-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/dlazy-ai/ecommerce-skills/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![repolish](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/dlazy-ai/ecommerce-skills/main/.repolish/badge.json)](https://github.com/asale-ai/repolish)

中文 · [English](README.en.md)

一套面向**电商视觉生产**的 Agent 技能库：把「拍商品图」这件事拆成 26 个可组合的技能，
每个技能是一份可直接执行的 `skill.md`，配套可执行脚本，底层可切换多家图像 / 视频 / 文本模型。

平铺图 → 模特上身图 → 裂变套图 → 详情页 → 主图视频 → 投前质检 → 平台合规校验，
整条链路不用摄影棚、不约模特。

它和「一堆 prompt」的区别在于三件事：

- **不锁后端** —— dLazy 默认，也能用 OpenAI / Gemini / fal / Replicate / 火山方舟，自带 key 即可；没 key 也能 `--dry-run` 空跑看清要发什么。
- **确定性动作交给脚本** —— 批量、重试、断点续跑、成本熔断、合规校验、闭环重跑都是脚本，不靠模型每次现编。
- **能验收** —— 上架前的平台规格是机检的，不是「看着差不多」。

---

## 安装

技能用 [`npx skills`](https://github.com/vercel-labs/skills) 安装，它会扫描本仓库的 `skills/` 目录，把技能装进 Claude Code / Codex / Cursor 等 agent 的技能目录。

一次装全部 26 个：

```bash
npx skills add https://github.com/dlazy-ai/ecommerce-skills --all
```

`--all` 等价于 `--skill '*' --agent '*' -y`：装全部技能、装到所有检测到的 agent、跳过确认。只想装给某一个 agent：

```bash
npx skills add https://github.com/dlazy-ai/ecommerce-skills --skill '*' --agent claude-code
```

只装用得上的几个（技能名就是下面索引表第一列，一个技能一个 `--skill`）：

```bash
npx skills add https://github.com/dlazy-ai/ecommerce-skills \
  --skill flat-lay --skill fission-pattern --skill detect-task
```

先看看有哪些：

```bash
npx skills add https://github.com/dlazy-ai/ecommerce-skills --list
```

默认装到当前项目（`.claude/skills/<name>/`），加 `-g` 装到用户级、所有项目共用。后续 `npx skills update` 更新、`npx skills remove` 卸载。

不想装也行：任何一份 `skill.md` 的内容直接贴进对话，Agent 照着执行即可——
每份技能都保留了不依赖脚本的等价手动步骤。

### 依赖

| 依赖 | 何时需要 | 装法 |
| --- | --- | --- |
| Node ≥ 20 | 用统一入口 `gen.mjs`、批量、闭环、视频合成 | 已有即可 |
| 任一后端的 key | 真正出图 | `dlazy login`，或设 `OPENAI_API_KEY` 等，见下 |
| Python + Pillow | 平台合规校验 | `pip install Pillow` |
| ffmpeg | 视频拼接与字幕 | `brew install ffmpeg` |

都没有也能跑通 `--dry-run`，看清每一步要发什么、花多少。

### 选后端

```bash
node shared/scripts/gen.mjs --doctor      # 看当前哪个后端可用
```

| 后端 | 环境变量 |
| --- | --- |
| `dlazy`（默认） | `dlazy login` 或 `DLAZY_API_KEY` |
| `openai` | `OPENAI_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |
| `fal` | `FAL_KEY` |
| `replicate` | `REPLICATE_API_TOKEN` |
| `ark`（火山方舟） | `ARK_API_KEY` + `ARK_MODEL` |

优先级：`--provider` 参数 > `PROVIDER` 环境变量 > 第一个配了 key 的 > `dlazy`。

---

## 三种用法

同一份资产，三个消费面：

```bash
# 1. 作为 Agent 技能（Claude Code / Cursor / Codex）
npx skills add https://github.com/dlazy-ai/ecommerce-skills --all

# 2. 作为命令行流水线
node shared/scripts/batch.mjs --input skus.csv --task flat-lay \
  --template prompt.txt --outdir out/ --concurrency 4 --max-credits 3000

# 3. 作为 MCP server（任意 MCP 客户端）
node mcp/server.mjs
```

MCP 配置：

```json
{ "mcpServers": { "ecommerce": {
    "command": "node",
    "args": ["/abs/path/to/ecommerce-skills/mcp/server.mjs"] } } }
```

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

### 视频 — 静态素材之外的另一半

| 技能 | 做什么 | 输入 → 输出 | 需要 |
| --- | --- | --- | --- |
| [main-image-video](skills/main-image-video/skill.md) | 静态主图转主图视频 | 一张商品图 → 3–5 秒短视频 | 视频模型 |
| [product-video-ad](skills/product-video-ad/skill.md) | 商品短视频广告 | 卖点 → 分镜 → 成片带字幕 | 视频模型 + ffmpeg |
| [ugc-testimonial](skills/ugc-testimonial/skill.md) | UGC 口播种草视频 | 商品 + 人设 → 口播脚本与成片 | 视频模型 + ffmpeg |

### 企业功能 — 规模化与质量把关

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [batch-image](skills/batch-image/skill.md) | 多商品批量生图流水线 | 商品清单 CSV → 整批统一视觉的商拍图 | `seedream-5.0` |
| [detect-task](skills/detect-task/skill.md) | 投前检测（AI 图质检） | 待检图 → 风险报告 + prompt 修正句 | `claude-sonnet-5` |
| [platform-compliance](skills/platform-compliance/skill.md) | 上架前合规校验与自动修复 | 待上架图 → 各平台通过/驳回报告 + 合规图 | 无（读像素） |
| [brand-kit](skills/brand-kit/skill.md) | 店铺视觉统一 | brand.yaml → 全技能共用的画面约束 | 无（纯规范） |

### 上架与投放 — 交付指标而不只是图

| 技能 | 做什么 | 输入 → 输出 | 模型 |
| --- | --- | --- | --- |
| [listing-optimizer](skills/listing-optimizer/skill.md) | 主图 A/B 组与转化复盘 | 商品图 + 卖点 → 对照组 + 假设 + 复盘表 | `gpt-image-2` |
| [cross-border-localize](skills/cross-border-localize/skill.md) | 跨境多区域本地化 | 一套素材 → 多语言文案、尺码表、区域版主图 | `seedream-5.0-pro` |

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

## 工程化：脚本干了什么

技能正文只写「要生成什么」，其余交给脚本。全部支持 `--dry-run`。

| 脚本 | 干什么 |
| --- | --- |
| `gen.mjs` | 统一生成入口：后端选路、默认参数、429/5xx 指数退避重试、建目录落盘、成本估算 |
| `run_loop.mjs` | **真闭环**：生成 → 质检 → 自动把修正句追加回 prompt → 重跑，直到达标或到轮次上限，产出 manifest |
| `batch.mjs` | 批量流水线：CSV 驱动、并发池、失败重试、断点续跑、成本熔断、挑图联系表 |
| `check_listing.py` | 平台合规客观校验与自动修复（背景纯度、主体占比、分辨率、比例、alpha、体积） |
| `brand.mjs` | 把 brand.yaml 翻成画面约束，按技能自动过滤该给哪几段 |
| `video.mjs` | 分镜编排、片段拼接、字幕（烧录 → 软字幕 → 留 srt 三级降级） |

一条命令看懂闭环：

```bash
node shared/scripts/run_loop.mjs --task flat-lay \
  --prompt-file prompt.txt --images garment.jpg pose.jpg \
  --save out/sku001.jpg --platform amazon --max-rounds 3
```

生成完自动过一遍 Amazon 机检和 AI 质检，不达标就把修正句接回 prompt 重跑，
每一轮的 prompt、风险等级、合规结论、成本都记进 `out/sku001.manifest.json`。

### 合规校验能抓到什么

拿本仓库自己的示例图试，一秒出结论：

```bash
python3 shared/scripts/check_listing.py docs/flat-lay/example-output.jpg --platform amazon
```

```
docs/flat-lay/example-output.jpg  ·  Amazon 主图  ·  有驳回风险
  ✗ 纯白背景   边缘仅 0.0% 为纯白，背景基色约 RGB(208, 208, 208)
  ! 分辨率     最长边 1536px，达标但不足以触发放大镜
```

这张图肉眼看是干净的浅灰棚拍背景，**但 Amazon 主图要求精确 RGB(255,255,255)**，
208 的灰会被驳回。加 `--fix out/` 一步修好：压白底 → 按 85% 目标重构画布 → 补到 1600px。

---

## 生成效果示例

每个技能的输入素材、原样可复现的命令和实际生成的输出图，都在 **[docs/examples.md](docs/examples.md)**——按「商品上身 / 单图变多图 / 图片创作 / 企业功能 / 自定义功能」分组，输出图均为实际执行生成，非效果图。

单个技能的示例也内联在它自己的 `skills/<name>/skill.md` 开头。

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

**跨境上架（一套素材铺多国）**

```
flat-lay 或已有商拍图
  └→ cross-border-localize   多语言文案、尺码表、区域版主图
      └→ platform-compliance  按各区域平台规格逐个校验
```

**主图位补视频**

```
已有主图
  └→ main-image-video     3–5 秒主图视频
product-video-ad          卖点 → 分镜 → 成片带字幕（投流素材）
ugc-testimonial           人设 → 口播种草视频
```

**主图不达标，想知道换哪版更好**

```
listing-optimizer    单变量对照组 + 假设 + 复盘模板
  └→ platform-compliance   每组先过机检，别让驳回污染实验数据
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
- **合规**：带文案的技能（[item-detail](skills/item-detail/skill.md)、[item-selling-point](skills/item-selling-point/skill.md)）注意绝对化用语与虚假促销；上架前建议过一遍 [detect-task](skills/detect-task/skill.md) 与 [platform-compliance](skills/platform-compliance/skill.md)。
- **平台规则会变**。`check_listing.py` 内置的是可机检子集，以各平台最新官方文档为准；需要改口径用 `--rules` 传自己的 JSON。
- **AI 生成内容的标注**：[ugc-testimonial](skills/ugc-testimonial/skill.md) 这类拟真内容不得声称是真实买家评价；部分平台强制标注 AI 生成，投放前确认目标平台规则。
- **视频模型不写死**。各家视频模型 ID 差异大更新快，写死只会误导，所以要你显式指定 `DLAZY_VIDEO_MODEL`。

---

## 开发（维护者）

`shared/` 是**单一真相源**，`skills/<name>/` 下的脚本与参考文件由构建脚本同步生成——
因为 `npx skills add` 按目录拷贝安装，技能必须自包含。**改共享文件后一定要跑一次 `npm run build`。**

```bash
npm run build          # 把 shared/ 同步进 26 个技能目录
npm run build:check    # 只校验是否已同步（CI 用）
npm test               # 单元测试 + 合规脚本测试
npm run eval           # 结构与可执行性回归：把文档里的命令真的跑一遍（--dry-run，不计费）
npm run eval:live      # 跑 evals/<skill>/cases.json 的 golden case（真生成，需要 key）
npm run doctor         # 看当前哪个后端可用
```

`npm run eval` 会检查：frontmatter 合法、description 不超长且带触发语、正文 ≤500 行、
相对链接与图片指得到、golden case 素材存在、**文档里写的每条命令都能跑通**。
改坏了 prompt 模板或参数，这一步会直接红。

新增技能的清单：

1. `skills/<name>/skill.md`
2. `scripts/skills.config.json` 里补 description 与需要的共享文件
3. `shared/scripts/lib/tasks.json` 里补默认模型与参数
4. `scripts/skill-display-names.json` 里补中文显示名（不补的话发布脚本直接退出）
5. `npm run build && npm test && npm run eval`

---

## 发布到 ClawHub（维护者）

发布脚本是 `scripts/publish-skills.mjs`，它会把 `skills/<name>/skill.md` 改写成 ClawHub 要的 `SKILL.md`（重命名、把 `../../docs/…` 素材引用换成 GitHub 绝对地址、补版本号），在 `.publish-tmp/` 里暂存后逐个发布，源文件不动。

```bash
npm install                # 装 clawhub CLI（devDependency）
npm run clawhub:login      # 首次发布前登录，token 存在本机
npm run publish:dry        # 只打印 slug / 版本 / 显示名，不发布
npm run publish:skills     # 正式发布（跳过 .publish-skills.done 里已发成功的）
```

| 命令 | 作用 |
| --- | --- |
| `npm run publish:dry` | `--dry-run`，预览将要发布的技能与版本 |
| `npm run publish:skills` | 发布，断点续传：已成功的技能记在 `scripts/.publish-skills.done` |
| `npm run publish:force` | `--force`，忽略断点记录，全部重发 |
| `npm run publish:reset` | 清掉断点记录与 `.publish-tmp/` 暂存目录 |
| `npm run clawhub:whoami` | 校验登录状态 |

追加参数用 `--` 透传给脚本：

```bash
npm run publish:skills -- --only flat-lay,one-shot     # 只发指定技能
npm run publish:skills -- --ref main --keep-staging    # 指定素材 ref，保留暂存目录便于排查
npm run publish:skills -- --changelog "修正尺寸参数"    # 自定义 changelog
```

其它参数见脚本头部注释：`--owner`、`--repo`、`--tags`。

两个前置条件：

- **新增技能必须先在 `scripts/skill-display-names.json` 里补中文显示名**，否则脚本直接报错退出；
- **`docs/` 和 `skills/` 的改动要先 push**——线上素材地址指向 `<owner>/<repo>@<ref>`，没推上去线上就是碎图；有未提交改动时脚本会 WARN。

---

## License

见 [LICENSE](LICENSE)。
