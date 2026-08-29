#!/usr/bin/env node
// ⚠️ 由 scripts/build-skills.mjs 从 shared/scripts/gen.mjs 同步生成，不要直接改这里。
/**
 * gen.mjs —— 全部技能的统一生成入口。
 *
 * 为什么存在：技能正文只描述「要生成什么」，把「怎么调、调谁、失败怎么办、
 * 存哪里、花多少钱」这些确定性动作交给脚本，而不是让模型每次现编 bash。
 *
 *   node scripts/gen.mjs --task flat-lay --prompt '...' --images a.jpg b.jpg --save out.jpg
 *   node scripts/gen.mjs --task flat-lay --prompt '...' --dry-run      # 不花钱，只看要发什么
 *   node scripts/gen.mjs --doctor                                      # 看哪个后端可用
 *   PROVIDER=openai OPENAI_API_KEY=... node scripts/gen.mjs --task flat-lay ...
 *
 * 后端优先级：--provider > $PROVIDER > 第一个配了 key 的 > dlazy（默认）
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROVIDERS, pickProvider, credentialReport } from './lib/providers.mjs'
import { loadBrand, buildBrand } from './brand.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CFG = JSON.parse(readFileSync(path.join(HERE, 'lib', 'tasks.json'), 'utf8'))

/* ---------- 参数解析 ---------- */

function parseArgs(argv) {
  const o = { images: [], batch: 1, retries: 3, timeout: 1800 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    switch (a) {
      case '--task': o.task = next(); break
      case '--model': o.model = next(); break
      case '--prompt': o.prompt = next(); break
      case '--prompt-file': o.promptFile = next(); break
      case '--images': while (argv[i + 1] && !argv[i + 1].startsWith('--')) o.images.push(argv[++i]); break
      case '--size': o.size = next(); break
      case '--quality': o.quality = next(); break
      case '--resolution': o.resolution = next(); break
      case '--format': case '--imageFormat': o.format = next(); break
      case '--batch': o.batch = Number(next()); break
      case '--save': o.save = next(); break
      case '--provider': o.provider = next(); break
      case '--brand': o.brand = next(); break
      case '--retries': o.retries = Number(next()); break
      case '--timeout': o.timeout = Number(next()); break
      case '--dry-run': o.dryRun = true; break
      case '--doctor': o.doctor = true; break
      case '--json': o.json = true; break
      case '-h': case '--help': o.help = true; break
      default:
        if (a.startsWith('--')) die(`未知参数 ${a}（--help 看用法）`)
    }
  }
  return o
}

const die = (m) => { console.error(`✗ ${m}`); process.exit(1) }

const HELP = `
gen.mjs —— 电商技能库统一生成入口

必填
  --task <name>         技能名，决定默认模型与尺寸（见 lib/tasks.json）
  --prompt <text>       提示词；或用 --prompt-file <path> 从文件读

常用
  --images <p...>       参考图，本地路径或 URL，顺序即 prompt 里的 image 1/2/3
  --save <path>         落盘路径；--batch>1 时自动加 -1 -2 后缀
  --dry-run             只打印将要发出的请求与预估成本，不调用、不计费
  --doctor              打印各后端凭据状态

覆盖
  --model --size --quality --resolution --format --batch
  --provider <id>       dlazy | openai | gemini | fal | replicate | ark
  --brand <brand.yaml>  读品牌规范，自动追加统一的画面约束与模特参考图
  --retries <n>         默认 3，对 429/5xx 指数退避
  --timeout <sec>       默认 1800

环境变量
  PROVIDER              默认后端
  DLAZY_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / FAL_KEY /
  REPLICATE_API_TOKEN / ARK_API_KEY + ARK_MODEL
  GEN_MODEL_<PROVIDER>  覆盖该后端使用的模型 ID
`.trim()

/* ---------- 主流程 ---------- */

async function main() {
  const o = parseArgs(process.argv.slice(2))
  if (o.help) return console.log(HELP)

  if (o.doctor) {
    const rows = credentialReport()
    console.log('后端凭据状态：\n')
    for (const r of rows) {
      const mark = r.ready === 'cli' ? '·' : r.ready ? '✓' : '✗'
      const note = r.ready === 'cli' ? '（本机装了 dlazy 即可用）' : r.ready ? '' : `缺 ${r.envKey}`
      console.log(`  ${mark} ${r.id.padEnd(10)} ${note}`)
    }
    const p = pickProvider()
    console.log(`\n当前会选：${p.id}`)
    return
  }

  if (!o.task) die('缺 --task。可用：' + Object.keys(CFG.tasks).join(' / '))
  const profile = CFG.tasks[o.task]
  if (!profile) die(`未知技能 "${o.task}"。可用：${Object.keys(CFG.tasks).join(' / ')}`)

  if (o.promptFile) o.prompt = readFileSync(o.promptFile, 'utf8').trim()
  if (!o.prompt) die('缺 --prompt 或 --prompt-file')

  let model = o.model || profile.model
  if (model?.startsWith('$')) {
    const key = model.slice(1)
    model = process.env[key]
    if (!model && !o.dryRun) {
      die(`${o.task} 是视频技能，需先指定模型：export ${key}=<你后端可用的视频模型 ID>`)
    }
    model = model || `<${key} 未设置>`
  }

  // 品牌规范：把统一的画面约束追加进 prompt，把模特参考图并进 --images
  let brandNote = null
  if (o.brand) {
    const b = buildBrand(await loadBrand(o.brand), o.task)
    for (const w of b.warnings) console.error(`  ! ${w}`)
    if (b.append) o.prompt = `${o.prompt}\n${b.append}`
    if (b.images.length) o.images = [...o.images, ...b.images]
    brandNote = { file: o.brand, appendedChars: b.append.length, extraImages: b.images }
  }

  const provider = pickProvider(o.provider)
  const req = {
    model,
    prompt: o.prompt,
    images: o.images,
    size: o.size || profile.size,
    quality: o.quality || profile.quality,
    resolution: o.resolution || profile.resolution,
    format: o.format || profile.format,
    batch: Math.max(1, o.batch),
    timeoutMs: o.timeout * 1000,
    video: Boolean(profile.video),
    text: Boolean(profile.text),
  }

  const credits = (CFG._credits[model] || 0) * req.batch

  if (o.dryRun) {
    const report = {
      task: o.task, provider: provider.id, model, size: req.size,
      quality: req.quality, batch: req.batch, images: req.images,
      estimatedCredits: credits || null,
      request: provider.describe(req),
      promptChars: req.prompt.length,
      brand: brandNote,
    }
    if (o.json) console.log(JSON.stringify(report, null, 2))
    else {
      console.log(`\n【空跑】不会调用、不会计费\n`)
      console.log(`  技能      ${report.task}`)
      console.log(`  后端      ${report.provider}`)
      console.log(`  模型      ${report.model}`)
      console.log(`  尺寸/档位 ${report.size || '-'} / ${report.quality || '-'}`)
      console.log(`  参考图    ${req.images.length ? req.images.join(', ') : '（无）'}`)
      console.log(`  预估算力  ${credits ? credits + ' credits' : '未知'}`)
      if (brandNote) console.log(`  品牌规范  ${brandNote.file}（追加 ${brandNote.appendedChars} 字符${brandNote.extraImages.length ? `，+${brandNote.extraImages.length} 张参考图` : ''}）`)
      console.log(`\n  将要发出：\n  ${report.request}\n`)
      console.log(`  Prompt（${req.prompt.length} 字符）：\n${indent(req.prompt)}\n`)
    }
    return
  }

  const started = Date.now()
  const out = await withRetry(() => provider.run(req), o.retries)
  const saved = await persist(out.files, o.save, req)

  const envelope = {
    ok: true,
    task: o.task,
    provider: provider.id,
    model,
    files: saved,
    texts: out.texts || [],
    estimatedCredits: credits || null,
    elapsedMs: Date.now() - started,
    brand: brandNote,
  }
  if (o.json) console.log(JSON.stringify(envelope, null, 2))
  else {
    console.log(`✓ ${o.task} · ${provider.id}/${model} · ${((Date.now() - started) / 1000).toFixed(1)}s`)
    for (const f of saved) console.log(`  ${f}`)
    for (const t of envelope.texts) console.log(`\n${t}`)
  }
}

function indent(s) { return s.split('\n').map((l) => '    ' + l).join('\n') }

async function withRetry(fn, times) {
  let last
  for (let i = 0; i <= times; i++) {
    try { return await fn() } catch (e) {
      last = e
      const retriable = e.status === 429 || (e.status >= 500 && e.status < 600) ||
        /timeout|ETIMEDOUT|ECONNRESET|fetch failed/i.test(e.message)
      if (!retriable || i === times) break
      const wait = Math.min(2 ** i * 1000, 30000)
      console.error(`  ↻ 第 ${i + 1} 次失败（${e.message.slice(0, 120)}），${wait / 1000}s 后重试`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw last
}

async function persist(files, savePath, req) {
  if (!files?.length) return []
  const out = []
  for (const [i, f] of files.entries()) {
    let target
    if (savePath) {
      const ext = path.extname(savePath) || f.ext || '.jpg'
      const base = savePath.slice(0, savePath.length - path.extname(savePath).length)
      target = files.length > 1 ? `${base}-${i + 1}${ext}` : `${base}${ext}`
    } else {
      target = path.join('output', `${Date.now()}-${i + 1}${f.ext || '.jpg'}`)
    }
    await mkdir(path.dirname(target), { recursive: true })
    const buf = f.buffer || Buffer.from(await (await fetch(f.url)).arrayBuffer())
    await writeFile(target, buf)
    out.push(target)
  }
  return out
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1) })
