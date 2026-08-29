#!/usr/bin/env node
/**
 * video.mjs —— 商品视频：单镜生成、分镜串联、字幕烧录。
 *
 * 生成本身交给 gen.mjs（后端选路、重试、落盘都在那）；这里只做视频特有的事：
 * 分镜编排、片段拼接、字幕。
 *
 *   # 单镜：主图转 3 秒视频
 *   node scripts/video.mjs --mode clip --task main-image-video \
 *     --image main.jpg --prompt 'slow push-in, fabric ripples gently' --save out/main.mp4
 *
 *   # 分镜：一份 board.json 出整条广告
 *   node scripts/video.mjs --mode storyboard --task product-video-ad \
 *     --board board.json --outdir out/ad --subtitles
 *
 * board.json：
 *   { "shots": [ { "id":"s1", "seconds":3, "image":"a.jpg",
 *                  "prompt":"...", "caption":"三层加厚，零下也不怕" } ] }
 *
 * ⚠️ 视频模型 ID 因后端而异，必须自己指定：
 *      export DLAZY_VIDEO_MODEL=<你账号里可用的视频模型>
 *    或 --model <id>。拼接与字幕需要 ffmpeg。
 */
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const o = { mode: 'clip', outdir: 'output', seconds: 3 }
  for (let i = 0; i < argv.length; i++) {
    const n = () => argv[++i]
    switch (argv[i]) {
      case '--mode': o.mode = n(); break
      case '--task': o.task = n(); break
      case '--model': o.model = n(); break
      case '--image': o.image = n(); break
      case '--prompt': o.prompt = n(); break
      case '--board': o.board = n(); break
      case '--save': o.save = n(); break
      case '--outdir': o.outdir = n(); break
      case '--seconds': o.seconds = Number(n()); break
      case '--brand': o.brand = n(); break
      case '--provider': o.provider = n(); break
      case '--subtitles': o.subtitles = true; break
      case '--dry-run': o.dryRun = true; break
      case '-h': case '--help': o.help = true; break
    }
  }
  return o
}

const HELP = `
video.mjs —— 商品视频生成与合成

  --mode clip|storyboard   单镜 / 分镜串联
  --task <name>            main-image-video | product-video-ad | ugc-testimonial
  --model <id>             视频模型（或设 DLAZY_VIDEO_MODEL）
  clip:       --image <p> --prompt '...' --save out.mp4 [--seconds 3]
  storyboard: --board board.json --outdir out/ [--subtitles]
  通用:       --brand brand.yaml --provider <id> --dry-run
`.trim()

function run(cmd, args, inherit = false) {
  return new Promise((resolve) => {
    const ps = spawn(cmd, args, { stdio: ['ignore', inherit ? 'inherit' : 'pipe', 'pipe'] })
    let so = '', se = ''
    ps.stdout?.on('data', (d) => (so += d))
    ps.stderr.on('data', (d) => (se += d))
    ps.on('error', (e) => resolve({ code: -1, stdout: '', stderr: e.message }))
    ps.on('close', (code) => resolve({ code, stdout: so, stderr: se }))
  })
}

async function hasFfmpeg() {
  const r = await run('ffmpeg', ['-version'])
  return r.code === 0
}

async function genOne({ task, model, prompt, image, save, provider, brand, dryRun, seconds }) {
  const args = [path.join(HERE, 'gen.mjs'), '--task', task, '--prompt',
    `${prompt}${seconds ? ` Duration about ${seconds} seconds.` : ''}`, '--save', save, '--json']
  if (image) args.push('--images', image)
  if (model) args.push('--model', model)
  if (provider) args.push('--provider', provider)
  if (brand) args.push('--brand', brand)
  if (dryRun) args.push('--dry-run')
  const r = await run(process.execPath, args)
  if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim().split('\n').pop())
  if (dryRun) return { dryRun: true, detail: r.stdout.trim() }
  return JSON.parse(r.stdout)
}

/** 秒 → SRT 时间戳 */
function ts(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(Math.floor(sec % 60)).padStart(2, '0')
  const ms = String(Math.round((sec % 1) * 1000)).padStart(3, '0')
  return `${h}:${m}:${s},${ms}`
}

function buildSrt(shots) {
  let t = 0
  return shots.map((sh, i) => {
    const start = t, end = t + (sh.seconds || 3)
    t = end
    return sh.caption ? `${i + 1}\n${ts(start)} --> ${ts(end)}\n${sh.caption}\n` : null
  }).filter(Boolean).join('\n')
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  if (o.help || !o.task) return console.log(HELP)
  const model = o.model || process.env.DLAZY_VIDEO_MODEL

  if (o.mode === 'clip') {
    if (!o.prompt) return console.log(HELP)
    const save = o.save || path.join(o.outdir, `${o.task}.mp4`)
    const r = await genOne({ ...o, model, save })
    if (r.dryRun) return console.log(r.detail)
    console.log(`✓ ${r.files.join(', ')}`)
    return
  }

  if (o.mode !== 'storyboard') return console.log(HELP)
  if (!o.board) return console.log(HELP)

  const board = JSON.parse(await readFile(o.board, 'utf8'))
  const shots = board.shots || []
  if (!shots.length) return console.error('✗ board 里没有 shots')
  await mkdir(o.outdir, { recursive: true })

  console.log(`分镜 ${shots.length} 个，总时长约 ${shots.reduce((s, x) => s + (x.seconds || 3), 0)}s`)

  const clips = []
  for (const [i, sh] of shots.entries()) {
    const id = sh.id || `s${i + 1}`
    const save = path.join(o.outdir, `${id}.mp4`)
    console.log(`\n  [${i + 1}/${shots.length}] ${id} · ${sh.seconds || 3}s`)
    try {
      const r = await genOne({
        task: o.task, model, provider: o.provider, brand: o.brand, dryRun: o.dryRun,
        prompt: sh.prompt, image: sh.image, save, seconds: sh.seconds || 3,
      })
      if (r.dryRun) { console.log(r.detail.split('\n').slice(0, 3).join('\n')); continue }
      clips.push(r.files[0])
      console.log(`    ✓ ${r.files[0]}`)
    } catch (e) {
      console.error(`    ✗ ${id} 失败：${e.message}`)
    }
  }

  if (o.dryRun) return

  const srtPath = path.join(o.outdir, 'captions.srt')
  const srt = buildSrt(shots)
  if (srt) { await writeFile(srtPath, srt); console.log(`\n字幕：${srtPath}`) }

  if (!clips.length) return console.error('\n✗ 没有可拼接的片段')
  if (!(await hasFfmpeg())) {
    console.log(`\n! 没装 ffmpeg，跳过拼接。片段在 ${o.outdir}/`)
    console.log(`  装好后手动拼：ffmpeg -f concat -safe 0 -i ${o.outdir}/concat.txt -c copy final.mp4`)
    await writeFile(path.join(o.outdir, 'concat.txt'),
      clips.map((c) => `file '${path.resolve(c)}'`).join('\n'))
    return
  }

  const listFile = path.join(o.outdir, 'concat.txt')
  await writeFile(listFile, clips.map((c) => `file '${path.resolve(c)}'`).join('\n'))
  const merged = path.join(o.outdir, 'final.mp4')
  let r = await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', merged])
  if (r.code !== 0) {
    // 片段编码不一致时退回重编码
    r = await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', merged])
  }
  if (r.code !== 0) return console.error(`✗ 拼接失败：${r.stderr.split('\n').slice(-3).join('\n')}`)
  console.log(`✓ 成片：${merged}`)

  if (o.subtitles && srt) await attachSubtitles(merged, srtPath, o.outdir)
}

/**
 * 字幕三级降级：
 *   1. 烧录进画面（需要 ffmpeg 带 libass，很多发行版没有）
 *   2. 封装成软字幕轨（几乎总能成，播放器可开关）
 *   3. 都不行就把 .srt 留在旁边
 */
async function attachSubtitles(merged, srtPath, outdir) {
  const out = path.join(outdir, 'final-sub.mp4')

  const filters = await run('ffmpeg', ['-hide_banner', '-filters'])
  if (/\ssubtitles\s/.test(filters.stdout)) {
    const b = await run('ffmpeg', ['-y', '-i', merged,
      '-vf', `subtitles=${srtPath}:force_style='FontSize=18,Outline=1,MarginV=40'`,
      '-c:a', 'copy', out])
    if (b.code === 0) return console.log(`✓ 带字幕（已烧录）：${out}`)
  }

  const m = await run('ffmpeg', ['-y', '-i', merged, '-i', srtPath,
    '-c', 'copy', '-c:s', 'mov_text', out])
  if (m.code === 0) {
    return console.log(`✓ 带字幕（软字幕轨，播放器可开关）：${out}`)
  }

  console.log(`! 字幕合成失败，成片仍可用：${merged}`)
  console.log(`  字幕文件在 ${srtPath}，可导入剪辑软件`)
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1) })
