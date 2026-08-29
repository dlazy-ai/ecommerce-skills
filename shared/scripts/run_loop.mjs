#!/usr/bin/env node
/**
 * run_loop.mjs —— 生成 → 质检 → 自动改 prompt → 重跑，直到达标或到轮次上限。
 *
 * detect-task 早就会输出「该追加到 prompt 的英文修正句」，但一直要人手工复制回去。
 * 这个脚本把那一步接上，顺便接上 check_listing.py 的客观合规校验。
 *
 *   node scripts/run_loop.mjs --task flat-lay \
 *     --prompt-file prompt.txt --images garment.jpg pose.jpg \
 *     --save out/sku001.jpg --platform amazon --max-rounds 3
 *
 * 产出 out/sku001.manifest.json：每一轮的 prompt、风险等级、合规结论、成本、产物路径。
 */
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RISK_ORDER = { 低风险: 0, 中风险: 1, 高风险: 2 }

function parseArgs(argv) {
  const o = { images: [], maxRounds: 3, accept: '低风险', batch: 1 }
  for (let i = 0; i < argv.length; i++) {
    const n = () => argv[++i]
    switch (argv[i]) {
      case '--task': o.task = n(); break
      case '--prompt': o.prompt = n(); break
      case '--prompt-file': o.promptFile = n(); break
      case '--images': while (argv[i + 1] && !argv[i + 1].startsWith('--')) o.images.push(argv[++i]); break
      case '--save': o.save = n(); break
      case '--platform': o.platform = n(); break
      case '--max-rounds': o.maxRounds = Number(n()); break
      case '--accept': o.accept = n(); break
      case '--batch': o.batch = Number(n()); break
      case '--provider': o.provider = n(); break
      case '--dry-run': o.dryRun = true; break
      case '-h': case '--help': o.help = true; break
    }
  }
  return o
}

const HELP = `
run_loop.mjs —— 生成 / 质检 / 修正 的自动闭环

  --task <name>          生成用的技能名
  --prompt-file <path>   初始 prompt（或 --prompt）
  --images <p...>        参考图
  --save <path>          产物路径
  --platform <id>        同时做平台合规校验（amazon / tiktok-shop / temu / shopee / taobao / shopify）
  --max-rounds <n>       最多重跑几轮，默认 3
  --accept <等级>        达标线：低风险（默认）/ 中风险
  --dry-run              只打印每轮会做什么，不真调用
`.trim()

function run(cmd, args, { capture = true } = {}) {
  return new Promise((resolve) => {
    const ps = spawn(cmd, args, { stdio: ['ignore', capture ? 'pipe' : 'inherit', 'pipe'] })
    let so = '', se = ''
    ps.stdout?.on('data', (d) => (so += d))
    ps.stderr.on('data', (d) => (se += d))
    ps.on('error', (e) => resolve({ code: -1, stdout: '', stderr: e.message }))
    ps.on('close', (code) => resolve({ code, stdout: so, stderr: se }))
  })
}

/** 从质检报告里抠出风险等级、命中项与修正句 */
function parseReport(md) {
  const level = (md.match(/(低风险|中风险|高风险)/) || [])[1] || '未知'
  const hits = [...md.matchAll(/^\|\s*([^|]+?)\s*\|\s*命中\s*\|\s*([^|]*)\|/gm)]
    .map((m) => ({ item: m[1].trim(), evidence: m[2].trim() }))
  // 第 4 节里的英文修正句：以反引号包裹或以英文起首的行
  const sec = md.split(/##\s*4\.?\s*修正建议/)[1] || ''
  const fixes = [...sec.matchAll(/`([^`\n]{12,})`/g)].map((m) => m[1].trim())
  const plain = sec.split('\n')
    .map((l) => l.replace(/^[-*\d.\s]+/, '').trim())
    .filter((l) => /^[A-Za-z][\x20-\x7E]{15,}$/.test(l))
  const advice = (md.match(/(建议投放|建议重跑|建议人工修图)/) || [])[1] || ''
  return { level, hits, fixes: [...new Set([...fixes, ...plain])].slice(0, 3), advice }
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  if (o.help || !o.task) return console.log(HELP)
  if (o.promptFile) o.prompt = (await readFile(o.promptFile, 'utf8')).trim()
  if (!o.prompt) return console.log(HELP)
  if (!o.save) o.save = `output/${o.task}.jpg`

  const gen = path.join(HERE, 'gen.mjs')
  const checker = path.join(HERE, 'check_listing.py')
  const rounds = []
  let prompt = o.prompt
  let accepted = false
  let finalFiles = []

  for (let r = 1; r <= o.maxRounds; r++) {
    const save = o.save.replace(/(\.\w+)$/, `-r${r}$1`)
    console.log(`\n── 第 ${r} 轮 ──────────────────────────────`)

    const genArgs = [gen, '--task', o.task, '--prompt', prompt, '--save', save, '--json']
    if (o.images.length) genArgs.push('--images', ...o.images)
    if (o.batch > 1) genArgs.push('--batch', String(o.batch))
    if (o.provider) genArgs.push('--provider', o.provider)
    if (o.dryRun) genArgs.push('--dry-run')

    const g = await run(process.execPath, genArgs)
    if (g.code !== 0) {
      console.error(`✗ 生成失败：${g.stderr.trim() || g.stdout.trim()}`)
      rounds.push({ round: r, prompt, error: g.stderr.trim() || g.stdout.trim() })
      break
    }
    if (o.dryRun) {
      console.log(g.stdout.trim())
      rounds.push({ round: r, prompt, dryRun: true })
      break
    }

    const genOut = JSON.parse(g.stdout)
    const files = genOut.files || []
    finalFiles = files
    console.log(`  生成 ${files.join(', ')}`)

    /* --- 客观合规 --- */
    let compliance = null
    if (o.platform && files.length && existsSync(checker)) {
      const c = await run('python3', [checker, files[0], '--platform', o.platform, '--json'])
      try {
        const rep = JSON.parse(c.stdout)[0]
        compliance = {
          verdict: rep.verdict,
          failed: rep.checks.filter((x) => x.level === 'fail').map((x) => `${x.check}：${x.detail}`),
        }
        console.log(`  合规[${o.platform}] ${compliance.verdict}` +
          (compliance.failed.length ? `\n    ✗ ${compliance.failed.join('\n    ✗ ')}` : ''))
      } catch { compliance = { verdict: 'unknown', failed: [], raw: c.stdout.slice(0, 200) } }
    }

    /* --- 主观质检 --- */
    const qcPrompt = await buildQcPrompt()
    const d = await run(process.execPath,
      [gen, '--task', 'detect-task', '--prompt', qcPrompt, '--images', files[0], '--json'])
    let report = { level: '未知', hits: [], fixes: [], advice: '' }
    if (d.code === 0) {
      try {
        const md = (JSON.parse(d.stdout).texts || []).join('\n')
        report = parseReport(md)
        report.raw = md
      } catch { /* 保持默认 */ }
    } else {
      console.error(`  ! 质检调用失败，跳过本轮判定：${d.stderr.trim().slice(0, 160)}`)
    }
    console.log(`  质检 ${report.level}` +
      (report.hits.length ? ` · 命中 ${report.hits.map((h) => h.item).join('、')}` : ''))

    rounds.push({
      round: r, prompt, files,
      risk: report.level, hits: report.hits, advice: report.advice,
      fixes: report.fixes, compliance,
      estimatedCredits: genOut.estimatedCredits, elapsedMs: genOut.elapsedMs,
    })

    const riskOk = (RISK_ORDER[report.level] ?? 9) <= (RISK_ORDER[o.accept] ?? 0)
    const compOk = !compliance || compliance.verdict !== 'reject-risk'
    if (riskOk && compOk) {
      accepted = true
      console.log(`\n✓ 第 ${r} 轮达标，停止。`)
      break
    }
    if (r === o.maxRounds) {
      console.log(`\n! 到达轮次上限仍未达标，交人工。`)
      break
    }

    /* --- 把修正句接回 prompt --- */
    const extra = [...report.fixes]
    if (compliance?.failed.length) {
      // 合规问题翻成生成侧能听懂的英文约束
      if (compliance.failed.some((f) => f.startsWith('纯白背景')))
        extra.push('Pure seamless white background, RGB 255,255,255, no gradient, no shadow on the backdrop.')
      if (compliance.failed.some((f) => f.startsWith('主体占比')))
        extra.push('The product fills at least 88% of the frame, tight crop, minimal empty margin.')
    }
    if (!extra.length) {
      console.log('  ! 质检未给出可用的修正句，停止自动重跑。')
      break
    }
    prompt = `${prompt}\n${extra.join(' ')}`
    console.log(`  → 追加修正句 ${extra.length} 条，进入下一轮`)
  }

  const manifestPath = o.save.replace(/\.\w+$/, '') + '.manifest.json'
  await mkdir(path.dirname(manifestPath), { recursive: true })
  await writeFile(manifestPath, JSON.stringify({
    task: o.task, accepted, rounds: rounds.length, acceptLine: o.accept,
    platform: o.platform || null, finalFiles,
    totalCredits: rounds.reduce((s, x) => s + (x.estimatedCredits || 0), 0),
    history: rounds,
  }, null, 2))
  console.log(`\n记录：${manifestPath}`)
  process.exit(accepted ? 0 : 1)
}

async function buildQcPrompt() {
  return `你是电商投放前的图片质检员。审查这张 AI 生成的商拍图能否直接用于电商投放。全部用中文作答（第 4 项的 prompt 修正句除外）。严格按以下结构输出：
## 1. 风险等级
低风险 / 中风险 / 高风险（三选一）
## 2. 风险项逐条判定
用表格输出，三列：风险项 / 结论（通过 或 命中）/ 证据。风险项固定为这 8 条：商品崩坏、人脸不自然、手部异常、肢体结构错误、文字乱码、光影矛盾、边缘融合痕迹、平台合规。
## 3. 投放建议
建议投放 / 建议重跑 / 建议人工修图
## 4. 修正建议
若建议重跑或人工修图，给出应追加到生成 prompt 的英文修正句 1-3 条，每条用反引号包裹；若建议投放，写「无需修正」。
只输出报告，不要寒暄。`
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1) })
