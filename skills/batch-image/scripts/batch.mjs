#!/usr/bin/env node
// ⚠️ 由 scripts/build-skills.mjs 从 shared/scripts/batch.mjs 同步生成，不要直接改这里。
/**
 * batch.mjs —— 商品清单批量出图的流水线。
 *
 * 真实批量作业需要的东西：并发池、失败重试、断点续跑、成本熔断、产物清单、挑图联系表。
 * 这些是确定性动作，不该每次让模型现编。
 *
 *   node scripts/batch.mjs --input skus.csv --task flat-lay \
 *     --template prompt.txt --outdir out/ --concurrency 4 --max-credits 3000
 *
 * CSV 第一行是表头，必须有 sku 列；images 列用 `;` 分隔多张参考图；
 * 其余任意列都能在模板里用 {{列名}} 引用。
 *
 *   sku,images,color,category
 *   A001,flat/a001.jpg;pose/std.jpg,军绿,针织衫
 *
 * 断点续跑：产物目录下的 .batch-state.json 记录已完成的 sku，加 --resume 跳过它们。
 */
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const o = { concurrency: 3, retries: 2, outdir: 'output', maxCredits: 0 }
  for (let i = 0; i < argv.length; i++) {
    const n = () => argv[++i]
    switch (argv[i]) {
      case '--input': o.input = n(); break
      case '--task': o.task = n(); break
      case '--template': o.template = n(); break
      case '--outdir': o.outdir = n(); break
      case '--concurrency': o.concurrency = Number(n()); break
      case '--retries': o.retries = Number(n()); break
      case '--max-credits': o.maxCredits = Number(n()); break
      case '--platform': o.platform = n(); break
      case '--provider': o.provider = n(); break
      case '--limit': o.limit = Number(n()); break
      case '--resume': o.resume = true; break
      case '--loop': o.loop = true; break
      case '--contact-sheet': o.sheet = true; break
      case '--dry-run': o.dryRun = true; break
      case '-h': case '--help': o.help = true; break
    }
  }
  return o
}

const HELP = `
batch.mjs —— 批量出图流水线

  --input <csv>        商品清单，需含 sku 列；images 列用 ; 分隔
  --task <name>        用哪个技能生成
  --template <file>    prompt 模板，用 {{列名}} 取值
  --outdir <dir>       产物目录，默认 output
  --concurrency <n>    并发，默认 3
  --retries <n>        单个 sku 重试次数，默认 2
  --max-credits <n>    成本熔断：预估累计超过就停，0 表示不限
  --platform <id>      顺带做平台合规校验
  --loop               每个 sku 走 run_loop（生成→质检→重跑），而不是单次生成
  --limit <n>          只跑前 n 条，用来试水
  --resume             跳过 .batch-state.json 里已完成的 sku
  --contact-sheet      产出 contact-sheet.html 供人工挑图
  --dry-run            只打印计划，不调用
`.trim()

/** 极简 CSV 解析：支持双引号包裹与转义 */
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const head = rows.shift().map((h) => h.trim())
  return rows.filter((r) => r.some((c) => c.trim()))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const render = (tpl, row) =>
  tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => row[k] ?? '')

function run(cmd, args) {
  return new Promise((resolve) => {
    const ps = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let so = '', se = ''
    ps.stdout.on('data', (d) => (so += d))
    ps.stderr.on('data', (d) => (se += d))
    ps.on('error', (e) => resolve({ code: -1, stdout: '', stderr: e.message }))
    ps.on('close', (code) => resolve({ code, stdout: so, stderr: se }))
  })
}

/** 并发池：不用 Promise.all 一把梭，避免打爆速率限制 */
async function pool(items, size, worker) {
  const out = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      out[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return out
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  if (o.help || !o.input || !o.task || !o.template) return console.log(HELP)

  const rows = parseCsv(await readFile(o.input, 'utf8'))
  if (!rows.length) return console.error('✗ 清单是空的')
  if (!('sku' in rows[0])) return console.error('✗ CSV 缺 sku 列')
  const tpl = await readFile(o.template, 'utf8')

  await mkdir(o.outdir, { recursive: true })
  const statePath = path.join(o.outdir, '.batch-state.json')
  const state = o.resume && existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, 'utf8')) : { done: {} }

  let queue = rows
  if (o.resume) {
    const before = queue.length
    queue = queue.filter((r) => !state.done[r.sku])
    if (before !== queue.length) console.log(`断点续跑：跳过已完成 ${before - queue.length} 条`)
  }
  if (o.limit) queue = queue.slice(0, o.limit)

  const credits = JSON.parse(readFileSync(path.join(HERE, 'lib', 'tasks.json'), 'utf8'))
  const unit = credits._credits[credits.tasks[o.task]?.model] || 0
  const budget = o.maxCredits
  console.log(`清单 ${rows.length} 条 → 本次跑 ${queue.length} 条 · 并发 ${o.concurrency}` +
    (unit ? ` · 单张约 ${unit} credits，预计 ${unit * queue.length}` : '') +
    (budget ? ` · 熔断线 ${budget}` : ''))

  if (o.dryRun) {
    for (const r of queue.slice(0, 5)) {
      console.log(`\n  ${r.sku}  images=${(r.images || '').split(';').filter(Boolean).join(' ')}`)
      console.log('    ' + render(tpl, r).replace(/\n/g, '\n    ').slice(0, 400))
    }
    if (queue.length > 5) console.log(`\n  …… 其余 ${queue.length - 5} 条同理`)
    return
  }

  let spent = 0
  let halted = false
  const results = await pool(queue, o.concurrency, async (row) => {
    if (halted) return { sku: row.sku, status: 'skipped-budget' }
    if (budget && spent + unit > budget) {
      if (!halted) { halted = true; console.log(`\n⛔ 预估成本触及熔断线 ${budget}，停止派发新任务`) }
      return { sku: row.sku, status: 'skipped-budget' }
    }
    spent += unit

    const prompt = render(tpl, row)
    const images = (row.images || '').split(';').map((s) => s.trim()).filter(Boolean)
    const save = path.join(o.outdir, `${row.sku}.jpg`)

    for (let attempt = 0; attempt <= o.retries; attempt++) {
      const script = o.loop ? 'run_loop.mjs' : 'gen.mjs'
      const args = [path.join(HERE, script), '--task', o.task, '--prompt', prompt, '--save', save]
      if (images.length) args.push('--images', ...images)
      if (o.provider) args.push('--provider', o.provider)
      if (o.platform) args.push('--platform', o.platform)
      if (!o.loop) args.push('--json')

      const r = await run(process.execPath, args)
      if (r.code === 0) {
        let files = [save]
        if (!o.loop) { try { files = JSON.parse(r.stdout).files } catch { /* 用默认 */ } }
        state.done[row.sku] = { files, at: new Date().toISOString() }
        await writeFile(statePath, JSON.stringify(state, null, 2))
        console.log(`  ✓ ${row.sku}`)
        return { sku: row.sku, status: 'ok', files, row }
      }
      if (attempt < o.retries) {
        const wait = 2 ** attempt * 1500
        console.log(`  ↻ ${row.sku} 第 ${attempt + 1} 次失败，${wait / 1000}s 后重试`)
        await new Promise((s) => setTimeout(s, wait))
      } else {
        const msg = (r.stderr || r.stdout).trim().split('\n').pop()
        console.log(`  ✗ ${row.sku} —— ${msg?.slice(0, 140)}`)
        return { sku: row.sku, status: 'failed', error: msg, row }
      }
    }
  })

  const ok = results.filter((r) => r?.status === 'ok')
  const failed = results.filter((r) => r?.status === 'failed')
  const skipped = results.filter((r) => r?.status === 'skipped-budget')

  const manifest = {
    task: o.task, input: o.input, total: rows.length, attempted: queue.length,
    ok: ok.length, failed: failed.length, skippedByBudget: skipped.length,
    estimatedCredits: spent, results,
  }
  await writeFile(path.join(o.outdir, 'batch-manifest.json'), JSON.stringify(manifest, null, 2))

  console.log(`\n完成 ${ok.length} · 失败 ${failed.length} · 熔断跳过 ${skipped.length}`)
  console.log(`清单：${path.join(o.outdir, 'batch-manifest.json')}`)
  if (failed.length) console.log(`重跑失败项：加 --resume 再跑一次即可（已成功的会跳过）`)

  if (o.sheet) {
    const sheet = path.join(o.outdir, 'contact-sheet.html')
    await writeFile(sheet, contactSheet(manifest, o))
    console.log(`挑图联系表：${sheet}`)
  }
}

function contactSheet(m, o) {
  const cells = m.results.filter(Boolean).map((r) => {
    const img = r.files?.[0] ? path.basename(r.files[0]) : null
    const cls = r.status === 'ok' ? 'ok' : r.status === 'failed' ? 'bad' : 'skip'
    return `<figure class="${cls}">
  ${img ? `<img src="./${img}" loading="lazy" alt="${r.sku}">` : '<div class="ph"></div>'}
  <figcaption><b>${r.sku}</b><span>${r.status}</span></figcaption>
</figure>`
  }).join('\n')
  return `<!doctype html><meta charset="utf-8"><title>挑图 · ${m.task}</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;padding:24px;font:14px/1.5 system-ui,-apple-system,"PingFang SC",sans-serif;
       background:Canvas;color:CanvasText}
  h1{font-size:18px;margin:0 0 4px} .meta{opacity:.7;margin:0 0 20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
  figure{margin:0;border:1px solid color-mix(in srgb,CanvasText 18%,transparent);border-radius:4px;overflow:hidden}
  img,.ph{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:color-mix(in srgb,CanvasText 8%,transparent)}
  figcaption{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;font-size:12px}
  figcaption span{opacity:.6}
  .bad{outline:2px solid #c0392b} .skip{opacity:.45}
</style>
<h1>${m.task} · 挑图联系表</h1>
<p class="meta">清单 ${m.total} 条 · 本次 ${m.attempted} 条 · 成功 ${m.ok} · 失败 ${m.failed}
 · 熔断跳过 ${m.skippedByBudget} · 预估 ${m.estimatedCredits} credits${o.platform ? ` · 合规目标 ${o.platform}` : ''}</p>
<div class="grid">
${cells}
</div>`
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1) })
