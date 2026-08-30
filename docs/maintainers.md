# 维护者指南

[← 回到 README](../README.md)

中文 · [English](maintainers.en.md)

面向本仓库的维护者：本地构建、回归、以及发布到 ClawHub。外部贡献者请先看 [CONTRIBUTING.md](../CONTRIBUTING.md)。

---

## 开发

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

### 新增技能的清单

1. `skills/<name>/skill.md`
2. `scripts/skills.config.json` 里补 description 与需要的共享文件
3. `shared/scripts/lib/tasks.json` 里补默认模型与参数
4. `scripts/skill-display-names.json` 里补中文显示名（不补的话发布脚本直接退出）
5. `npm run build && npm test && npm run eval`

---

## 发布到 ClawHub

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

## 重画 README 里的 SVG（repolish）

README 顶部的 banner、概览卡、页脚评分卡和所有表格图都是 [repolish](https://github.com/asale-ai/repolish) 生成的普通文件。**不要直接跑 `repolish --apply` 就收工**——它有两个坑：

- 简介文案默认按 `auto` 选语言，会把英文简介画进中文版的 banner 和概览卡；
- `.repolish/en/` 下的三张英文图它根本不认，永远不会更新。

所以按下面的顺序跑，两版才都对：

```bash
repolish --stages artifacts --apply                  # 徽章 + 全部表格图（中英文都在内）

# 中文版三张图，必须显式指定语言
repolish --stages artifacts --apply --artifact hero     --lang zh-CN -o .repolish/hero.svg
repolish --stages artifacts --apply --artifact overview --lang zh-CN -o .repolish/overview.svg
repolish --stages artifacts --apply --artifact score    --lang zh-CN -o .repolish/card.svg

# 英文版三张图
repolish --stages artifacts --apply --artifact hero     --lang en -o .repolish/en/hero.svg
repolish --stages artifacts --apply --artifact overview --lang en -o .repolish/en/overview.svg
repolish --stages artifacts --apply --artifact score    --lang en -o .repolish/en/card.svg
```

表格图按标题 slug 命名，**改了小标题文字就等于换了文件名**——改完记得同步 README 里的 `<img src>`，并删掉旧的孤儿 SVG。
