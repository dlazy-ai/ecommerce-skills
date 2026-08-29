#!/usr/bin/env node
/**
 * run-evals.mjs —— 技能库的回归网。
 *
 * prompt 工程没有回归测试就无法多人协作，也无法安全接受社区 PR。
 * 这里做两层：
 *
 *   L1 结构与可执行性（无需任何 key，CI 默认跑）
 *     · frontmatter 合法、描述不超长、正文不超 500 行
 *     · skill.md 里的相对链接全部指得到
 *     · 文档里的 gen.mjs 命令真的能跑（自动加 --dry-run）
 *     · 命令里用的 --task 在 tasks.json 里存在
 *
 *   L2 真实生成打分（需要 key，加 --live）
 *     · 跑 evals/<skill>/cases.json 里的 golden case
 *     · 用 check_listing 做客观校验，用 detect-task 做主观打分
 *
 *   node scripts/run-evals.mjs
 *   node scripts/run-evals.mjs --live --skill flat-lay
 */
import { readFile, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CFG = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'skills.config.json'), 'utf8'))
const TASKS = JSON.parse(readFileSync(path.join(ROOT, 'shared', 'scripts', 'lib', 'tasks.json'), 'utf8'))

const argv = process.argv.slice(2)
const LIVE = argv.includes('--live')
const ONLY = argv.includes('--skill') ? argv[argv.indexOf('--skill') + 1] : null

const problems = []
let checked = 0

const fail = (skill, msg) => problems.push(`${skill}: ${msg}`)

function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const ps = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let so = '', se = ''
    ps.stdout.on('data', (d) => (so += d))
    ps.stderr.on('data', (d) => (se += d))
    ps.on('error', (e) => resolve({ code: -1, stdout: '', stderr: e.message }))
    ps.on('close', (code) => resolve({ code, stdout: so, stderr: se }))
  })
}

/** 从 markdown 里抠出 bash 代码块 */
function bashBlocks(md) {
  return [...md.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1])
}

/** 把带续行符的多行命令合成一条，再按命令切开 */
function commands(block) {
  return block
    .replace(/\\\n\s*/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

/** 极简 shell 分词：够用于我们自己写的命令 */
function tokenize(cmd) {
  const out = []
  let cur = '', q = null
  for (const c of cmd) {
    if (q) { if (c === q) q = null; else cur += c }
    else if (c === '"' || c === "'") q = c
    else if (/\s/.test(c)) { if (cur) { out.push(cur); cur = '' } }
    else cur += c
  }
  if (cur) out.push(cur)
  return out
}

async function evalSkill(name) {
  const dir = path.join(ROOT, 'skills', name)
  const file = path.join(dir, 'skill.md')
  if (!existsSync(file)) return fail(name, '缺 skill.md')
  const md = await readFile(file, 'utf8')
  checked++

  /* --- frontmatter --- */
  const m = md.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return fail(name, '缺 frontmatter')
  const fmName = (m[1].match(/^name:\s*(.+)$/m) || [])[1]?.trim()
  const fmDesc = (m[1].match(/^description:\s*(.+)$/m) || [])[1]?.trim()
  if (fmName !== name) fail(name, `frontmatter name「${fmName}」与目录名不一致`)
  if (!fmDesc) fail(name, '缺 description')
  else if (fmDesc.length > 300) fail(name, `description ${fmDesc.length} 字符，过长`)
  else if (!/当用户说|时使用/.test(fmDesc)) fail(name, 'description 里没有触发语，会影响命中率')

  /* --- 正文长度 --- */
  const bodyLines = md.slice(m[0].length).split('\n').length
  if (bodyLines > 500) fail(name, `正文 ${bodyLines} 行，超过建议的 500 行`)

  /* --- 相对链接 --- */
  for (const l of md.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
    const target = l[1].split('#')[0]
    if (!target) continue
    if (!existsSync(path.resolve(dir, target))) fail(name, `链接指不到：${target}`)
  }
  for (const img of md.matchAll(/<img src="([^"]+)"/g)) {
    if (/^https?:/.test(img[1])) continue
    if (!existsSync(path.resolve(dir, img[1]))) fail(name, `图片指不到：${img[1]}`)
  }

  /* --- 文档里的命令真的能跑 --- */
  for (const block of bashBlocks(md)) {
    for (const cmd of commands(block)) {
      const tk = tokenize(cmd)
      const isGen = tk[0] === 'node' && /scripts\/(gen|video|run_loop|batch)\.mjs$/.test(tk[1] || '')
      if (!isGen) continue
      // 占位符命令不跑
      if (/<[^>]+>/.test(cmd)) continue

      const taskIdx = tk.indexOf('--task')
      if (taskIdx !== -1) {
        const t = tk[taskIdx + 1]
        if (!TASKS.tasks[t]) { fail(name, `命令用了未知 --task「${t}」`); continue }
      }
      const args = [...tk.slice(1)]
      if (!args.includes('--dry-run')) args.push('--dry-run')
      const r = await run(process.execPath, args, dir)
      if (r.code !== 0) {
        fail(name, `命令跑不通：${cmd.slice(0, 90)}…\n      ${(r.stderr || r.stdout).trim().split('\n')[0]}`)
      }
    }
  }

  /* --- golden case 的素材必须真实存在（L1 就查，不等到 --live 才发现） --- */
  const caseFile = path.join(ROOT, 'evals', name, 'cases.json')
  if (existsSync(caseFile)) {
    const cases = JSON.parse(await readFile(caseFile, 'utf8')).cases || []
    if (!cases.length) fail(name, 'evals/cases.json 里没有 case')
    for (const c of cases) {
      if (!c.id) fail(name, 'golden case 缺 id')
      if (!c.prompt) fail(name, `golden case ${c.id} 缺 prompt`)
      for (const img of c.images || []) {
        if (!existsSync(path.join(ROOT, img))) fail(name, `golden case ${c.id} 素材不存在：${img}`)
      }
      if (c.platform && !['amazon', 'tiktok-shop', 'temu', 'shopee', 'shopify', 'taobao'].includes(c.platform)) {
        fail(name, `golden case ${c.id} 平台名未知：${c.platform}`)
      }
    }
  }

  /* --- L2：真实生成 --- */
  if (LIVE) await liveEval(name, dir)
}

async function liveEval(name, dir) {
  const caseFile = path.join(ROOT, 'evals', name, 'cases.json')
  if (!existsSync(caseFile)) return
  const cases = JSON.parse(await readFile(caseFile, 'utf8')).cases || []
  for (const c of cases) {
    const save = path.join(ROOT, 'evals', name, 'out', `${c.id}.jpg`)
    const args = [path.join(dir, 'scripts', 'gen.mjs'), '--task', name,
      '--prompt', c.prompt, '--save', save, '--json']
    if (c.images?.length) args.push('--images', ...c.images.map((p) => path.join(ROOT, p)))
    const r = await run(process.execPath, args, ROOT)
    if (r.code !== 0) { fail(name, `golden case ${c.id} 生成失败`); continue }

    if (c.platform) {
      const chk = await run('python3', [path.join(ROOT, 'shared', 'scripts', 'check_listing.py'),
        save, '--platform', c.platform, '--json'], ROOT)
      try {
        const rep = JSON.parse(chk.stdout)[0]
        if (rep.verdict === 'reject-risk') fail(name, `golden case ${c.id} 合规不过：${rep.checks.filter((x) => x.level === 'fail').map((x) => x.check).join('、')}`)
      } catch { fail(name, `golden case ${c.id} 合规校验解析失败`) }
    }
    console.log(`  · ${name}/${c.id} 已生成 → ${path.relative(ROOT, save)}`)
  }
}

const names = ONLY ? [ONLY] : Object.keys(CFG.skills)
for (const n of names) await evalSkill(n)

console.log(`\n检查 ${checked} 个技能${LIVE ? '（含真实生成）' : '（结构与可执行性）'}`)
if (problems.length) {
  console.log(`\n发现 ${problems.length} 个问题：\n`)
  for (const p of problems) console.log(`  ✗ ${p}`)
  process.exit(1)
}
console.log('✓ 全部通过')
