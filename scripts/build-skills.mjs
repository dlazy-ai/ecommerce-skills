#!/usr/bin/env node
/**
 * build-skills.mjs —— 把 shared/ 的单一真相源同步进各技能目录。
 *
 * 为什么要拷贝而不是共享一份：`npx skills add` 按目录拷贝安装，
 * 装到 .claude/skills/<name>/ 之后技能必须自包含。
 * 所以维护上单源（shared/），产出上自包含（skills/<name>/）。
 *
 *   node scripts/build-skills.mjs            # 同步
 *   node scripts/build-skills.mjs --check    # 只校验是否已同步（CI 用，不写文件）
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CFG = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'skills.config.json'), 'utf8'))
const CHECK = process.argv.includes('--check')

const BANNER = {
  '.mjs': (rel) => `// ⚠️ 由 scripts/build-skills.mjs 从 ${rel} 同步生成，不要直接改这里。\n`,
  '.py': (rel) => `# ⚠️ 由 scripts/build-skills.mjs 从 ${rel} 同步生成，不要直接改这里。\n`,
  '.md': (rel) => `<!-- 由 scripts/build-skills.mjs 从 ${rel} 同步生成，不要直接改这里。 -->\n`,
  '.json': () => '',
  '.yaml': (rel) => `# ⚠️ 由 scripts/build-skills.mjs 从 ${rel} 同步生成，不要直接改这里。\n`,
}

function withBanner(src, rel, ext) {
  const b = BANNER[ext]
  if (!b) return src
  const banner = b(`shared/${rel}`)
  if (!banner) return src
  // shebang 必须留在第一行
  if (src.startsWith('#!')) {
    const nl = src.indexOf('\n')
    return src.slice(0, nl + 1) + banner + src.slice(nl + 1)
  }
  return banner + src
}

const stale = []
let written = 0

for (const [name, cfg] of Object.entries(CFG.skills)) {
  const dir = path.join(ROOT, 'skills', name)
  if (!existsSync(dir)) { console.log(`  · ${name} —— 目录不存在，跳过`); continue }

  const assets = [...new Set([...(CFG.defaultAssets || []), ...(cfg.assets || [])])]
  for (const rel of assets) {
    const src = path.join(ROOT, CFG.sharedRoot, rel)
    if (!existsSync(src)) { console.log(`  ! ${name} ← 缺源文件 ${rel}`); continue }
    const dst = path.join(dir, rel)
    const ext = path.extname(rel)
    const body = withBanner(await readFile(src, 'utf8'), rel, ext)
    const cur = existsSync(dst) ? await readFile(dst, 'utf8') : null
    if (cur === body) continue
    if (CHECK) { stale.push(`${name}/${rel}`); continue }
    await mkdir(path.dirname(dst), { recursive: true })
    await writeFile(dst, body)
    written++
  }
}

/* --- 顺带校验 frontmatter 与配置一致 --- */
const problems = []
for (const [name, cfg] of Object.entries(CFG.skills)) {
  const f = path.join(ROOT, 'skills', name, 'skill.md')
  if (!existsSync(f)) { problems.push(`${name}: 缺 skill.md`); continue }
  const src = await readFile(f, 'utf8')
  const m = src.match(/^---\n([\s\S]*?)\n---/)
  if (!m) { problems.push(`${name}: 缺 frontmatter`); continue }
  const fm = m[1]
  if (!/^name:\s*/m.test(fm)) problems.push(`${name}: frontmatter 缺 name`)
  const d = fm.match(/^description:\s*(.*)$/m)
  if (!d) problems.push(`${name}: frontmatter 缺 description`)
  else {
    if (d[1].trim() !== cfg.description.trim()) problems.push(`${name}: description 与 config 不一致`)
    if (d[1].length > 400) problems.push(`${name}: description 过长 ${d[1].length} 字符`)
  }
  const body = src.slice(m[0].length).split('\n').length
  if (body > 500) problems.push(`${name}: 正文 ${body} 行，超过建议的 500 行`)
}

if (CHECK) {
  if (stale.length) console.log(`未同步（跑一次 node scripts/build-skills.mjs）：\n  ${stale.join('\n  ')}`)
  if (problems.length) console.log(`结构问题：\n  ${problems.join('\n  ')}`)
  if (!stale.length && !problems.length) console.log('✓ 全部技能已同步且结构合规')
  process.exit(stale.length || problems.length ? 1 : 0)
}

console.log(`✓ 同步完成，写入 ${written} 个文件`)
if (problems.length) { console.log('结构问题：'); for (const p of problems) console.log('  ! ' + p) }
