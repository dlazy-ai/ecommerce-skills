#!/usr/bin/env node
/**
 * slim-skills.mjs —— 把每份 skill.md 里逐字重复的 CLI 手册切出去。
 *
 * 切除：Authentication / About & Provenance / How It Works / Output Format / Error Handling
 *       （19 份完全相同 → 移到 references/provider-cli.md）
 * 外移：Usage 里的 `-h` 参数全量清单 → 各技能自己的 references/model-flags.md
 * 保留：技能特有的「参数约定」表与 Command Examples
 * 新增：统一入口调用方式 + 延伸阅读指路
 *
 * 幂等：已经改过的文件会跳过。
 *   node scripts/slim-skills.mjs [--dry-run]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CFG = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'skills.config.json'), 'utf8'))
const DRY = process.argv.includes('--dry-run')

const MARKER = '### 延伸阅读'

/** 按 `### ` 把一段正文切成有序块 */
function splitBlocks(section) {
  const lines = section.split('\n')
  const blocks = []
  let cur = { head: null, lines: [] }
  for (const l of lines) {
    if (/^### /.test(l)) {
      blocks.push(cur)
      cur = { head: l.replace(/^### /, '').trim(), lines: [l] }
    } else cur.lines.push(l)
  }
  blocks.push(cur)
  return blocks
}

const text = (b) => b.lines.join('\n').replace(/\s+$/, '')

async function processOne(name) {
  const file = path.join(ROOT, 'skills', name, 'skill.md')
  let src
  try { src = await readFile(file, 'utf8') } catch { return { name, status: 'missing' } }
  if (src.includes(MARKER)) return { name, status: 'skipped', before: src.split('\n').length }

  const before = src.split('\n').length

  /* ---- 1. frontmatter description ---- */
  const desc = CFG.skills[name]?.description
  if (desc) {
    src = src.replace(/^(---\n(?:.*\n)*?description:)[\s\S]*?(\n(?:[a-zA-Z_]+:|---)\s*\n)/m,
      (_m, head, tail) => `${head} ${desc}${tail}`)
  }

  /* ---- 2. 定位「N、dLazy 工具调用」整节 ---- */
  const heads = [...src.matchAll(/^## .*$/gm)]
  const idx = heads.findIndex((h) => /dLazy 工具调用/.test(h[0]))
  if (idx === -1) return { name, status: 'no-section', before }
  const start = heads[idx].index
  const end = idx + 1 < heads.length ? heads[idx + 1].index : src.length
  const section = src.slice(start, end)
  const headLine = heads[idx][0]

  const blocks = splitBlocks(section)
  const intro = text(blocks[0]).split('\n').slice(1).join('\n').trim() // 去掉 ## 标题行
  const find = (h) => blocks.find((b) => b.head === h)

  /* ---- 3. Usage 拆成「参数清单」与「参数约定」 ---- */
  const usage = find('Usage')
  let flagsDoc = '', conventions = ''
  if (usage) {
    const u = text(usage)
    const cut = u.indexOf('**参数约定')
    flagsDoc = (cut === -1 ? u : u.slice(0, cut)).replace(/^### Usage\s*/, '').trim()
    conventions = cut === -1 ? '' : u.slice(cut).trim()
  }

  const examples = find('Command Examples')

  /* ---- 4. 重新拼装 ---- */
  const model = (intro.match(/`([a-z0-9.\-]+)`/i) || [, '模型'])[1]
  const rebuilt = [
    headLine.replace('dLazy 工具调用', '工具调用'),
    '',
    intro,
    '',
    '### 调用方式',
    '',
    '两种等价写法，选一种。统一入口会自动选后端、失败重试、建目录落盘、估算成本：',
    '',
    '```bash',
    `# A. 统一入口（推荐）：可切任意后端，加 --dry-run 不计费空跑`,
    `node scripts/gen.mjs --task ${name} \\`,
    `  --prompt '<见下方 Prompt 模板>' \\`,
    `  --images <按下表顺序> \\`,
    `  --save output/${name}-<sku>.jpg`,
    '',
    `# B. 直接用 dLazy CLI（不想引入 Node 依赖时，效果等价）`,
    `dlazy ${model} --prompt '...' --images ... --save output/${name}.jpg`,
    '```',
    '',
    conventions,
    '',
    examples ? text(examples) : '',
    '',
    MARKER,
    '',
    '| 要查什么 | 去哪 |',
    '| --- | --- |',
    '| 认证、多后端配置、输出结构、错误码 | [`references/provider-cli.md`](references/provider-cli.md) |',
    `| \`${model}\` 的全部可用参数 | [\`references/model-flags.md\`](references/model-flags.md) |`,
    '| 统一入口的全部选项 | `node scripts/gen.mjs --help` |',
    '',
  ].filter((l) => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')

  const out = src.slice(0, start) + rebuilt + '\n' + src.slice(end)
  const after = out.split('\n').length

  if (!DRY) {
    await mkdir(path.join(ROOT, 'skills', name, 'references'), { recursive: true })
    await writeFile(
      path.join(ROOT, 'skills', name, 'references', 'model-flags.md'),
      [`# \`${model}\` 参数清单`, '',
        '本技能默认用的模型的完整参数。日常只需要「参数约定」里那几个，',
        '这份清单在需要用到非常规参数时再看。', '', flagsDoc, '',
        '---', '',
        '换其他后端时参数由 `scripts/gen.mjs` 统一翻译，见 [`provider-cli.md`](provider-cli.md)。', ''].join('\n'),
    )
    await writeFile(file, out)
  }
  return { name, status: 'slimmed', before, after }
}

const names = Object.keys(CFG.skills)
const results = []
for (const n of names) results.push(await processOne(n))

const done = results.filter((r) => r.status === 'slimmed')
console.log(`${DRY ? '[空跑] ' : ''}处理 ${done.length} 份：\n`)
for (const r of results) {
  if (r.status === 'slimmed') {
    console.log(`  ✓ ${r.name.padEnd(24)} ${r.before} → ${r.after} 行  (-${r.before - r.after})`)
  } else if (r.status !== 'missing') {
    console.log(`  · ${r.name.padEnd(24)} ${r.status}`)
  }
}
const b = done.reduce((s, r) => s + r.before, 0)
const a = done.reduce((s, r) => s + r.after, 0)
if (done.length) console.log(`\n合计 ${b} → ${a} 行，减少 ${b - a} 行（${((1 - a / b) * 100).toFixed(0)}%）`)
