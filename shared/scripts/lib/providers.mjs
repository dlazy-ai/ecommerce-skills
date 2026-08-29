/**
 * 多后端路由 —— 每个 provider 暴露同一组接口：
 *   { id, kind, hasCredentials(), describe(req), run(req) }
 *
 * req = {
 *   model, prompt, images:[本地路径|URL], size, quality, format,
 *   batch, timeoutMs, video:boolean, text:boolean
 * }
 * run() 返回 { files:[{buffer|url, ext}], raw }
 *
 * ⚠️ 模型 ID 随各厂商目录变动，下面只是默认值，均可用环境变量覆盖：
 *    GEN_MODEL_OPENAI / GEN_MODEL_GEMINI / GEN_MODEL_FAL /
 *    GEN_MODEL_REPLICATE / GEN_MODEL_ARK
 *    以各家最新文档为准。
 */
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const env = process.env

/* ---------- 工具函数 ---------- */

const isUrl = (s) => /^https?:\/\//i.test(s)

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif',
}
const mimeOf = (p) => MIME[path.extname(p).toLowerCase()] || 'image/jpeg'

async function asBase64(p) {
  if (isUrl(p)) {
    const r = await fetch(p)
    if (!r.ok) throw new Error(`拉取参考图失败 ${r.status}: ${p}`)
    return Buffer.from(await r.arrayBuffer()).toString('base64')
  }
  return (await readFile(p)).toString('base64')
}

const asDataUri = async (p) =>
  isUrl(p) ? p : `data:${mimeOf(p)};base64,${await asBase64(p)}`

async function postJson(url, body, headers, timeoutMs) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
    const text = await r.text()
    let json
    try { json = JSON.parse(text) } catch { json = { _raw: text } }
    if (!r.ok) {
      const err = new Error(`${url} → HTTP ${r.status}: ${text.slice(0, 400)}`)
      err.status = r.status
      throw err
    }
    return json
  } finally { clearTimeout(t) }
}

/* ---------- dlazy（默认后端）---------- */

const dlazy = {
  id: 'dlazy',
  kind: 'cli',
  hasCredentials: () => Boolean(env.DLAZY_API_KEY) || true, // CLI 自带 config，交给它自己判断
  describe(req) {
    return ['dlazy', req.model, ...dlazyArgs(req)]
      .map((a) => (/[\s']/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a))
      .join(' ')
  },
  async run(req) {
    const args = [req.model, ...dlazyArgs(req)]
    const out = await execFileJson(env.DLAZY_BIN || 'dlazy', args, req.timeoutMs)
    const urls = out?.result?.data?.urls || out?.result?.data?.videos || []
    const texts = out?.result?.data?.texts || []
    return {
      files: urls.map((u) => ({ url: u, ext: path.extname(new URL(u).pathname) || '.jpg' })),
      texts,
      raw: out,
    }
  },
}

function dlazyArgs(req) {
  const a = ['--prompt', req.prompt]
  if (req.images?.length) a.push('--images', ...req.images)
  if (req.size) a.push('--size', req.size)
  if (req.quality) a.push('--quality', req.quality)
  if (req.format) a.push('--imageFormat', req.format)
  if (req.resolution) a.push('--resolution', req.resolution)
  if (req.batch > 1) a.push('--batch', String(req.batch))
  return a
}

function execFileJson(bin, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const ps = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let so = '', se = ''
    const timer = setTimeout(() => { ps.kill('SIGKILL'); reject(new Error('dlazy 调用超时')) }, timeoutMs)
    ps.stdout.on('data', (d) => (so += d))
    ps.stderr.on('data', (d) => (se += d))
    ps.on('error', (e) => {
      clearTimeout(timer)
      reject(new Error(
        e.code === 'ENOENT'
          ? `找不到 dlazy 命令。装它：npm i -g @dlazy/cli  ——  或换后端：PROVIDER=openai|gemini|fal|replicate|ark`
          : e.message))
    })
    ps.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) return reject(new Error(`dlazy 退出码 ${code}: ${se || so}`))
      try { resolve(JSON.parse(so)) }
      catch { reject(new Error(`dlazy 输出不是 JSON: ${so.slice(0, 400)}`)) }
    })
  })
}

/* ---------- OpenAI ---------- */

const openai = {
  id: 'openai',
  kind: 'http',
  hasCredentials: () => Boolean(env.OPENAI_API_KEY),
  model: () => env.GEN_MODEL_OPENAI || 'gpt-image-1',
  describe(req) {
    const ep = req.images?.length ? 'images/edits' : 'images/generations'
    return `POST https://api.openai.com/v1/${ep}  model=${openai.model()} size=${mapSize(req.size)} n=${req.batch}`
  },
  async run(req) {
    const key = env.OPENAI_API_KEY
    const size = mapSize(req.size)
    let r
    if (req.images?.length) {
      const fd = new FormData()
      fd.append('model', openai.model())
      fd.append('prompt', req.prompt)
      fd.append('size', size)
      fd.append('n', String(req.batch))
      if (req.quality) fd.append('quality', req.quality)
      for (const p of req.images) {
        const buf = isUrl(p)
          ? Buffer.from(await (await fetch(p)).arrayBuffer())
          : await readFile(p)
        fd.append('image[]', new Blob([buf], { type: mimeOf(p) }), path.basename(p))
      }
      r = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST', headers: { authorization: `Bearer ${key}` }, body: fd,
      })
    } else {
      r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: openai.model(), prompt: req.prompt, size, n: req.batch,
          ...(req.quality ? { quality: req.quality } : {}),
        }),
      })
    }
    const text = await r.text()
    if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}: ${text.slice(0, 400)}`)
    const j = JSON.parse(text)
    return {
      files: (j.data || []).map((d) =>
        d.b64_json
          ? { buffer: Buffer.from(d.b64_json, 'base64'), ext: `.${req.format || 'png'}` }
          : { url: d.url, ext: '.png' }),
      raw: j,
    }
  },
}

// OpenAI 只认这几档，把 1024x1536 之类映射过去
function mapSize(size) {
  if (!size) return 'auto'
  const [w, h] = String(size).split(/[x×:]/).map(Number)
  if (!w || !h) return 'auto'
  const r = w / h
  if (r > 1.15) return '1536x1024'
  if (r < 0.87) return '1024x1536'
  return '1024x1024'
}

/* ---------- Gemini（Nano Banana）---------- */

const gemini = {
  id: 'gemini',
  kind: 'http',
  hasCredentials: () => Boolean(env.GEMINI_API_KEY || env.GOOGLE_API_KEY),
  model: () => env.GEN_MODEL_GEMINI || 'gemini-2.5-flash-image',
  describe(req) {
    return `POST generativelanguage.googleapis.com/v1beta/models/${gemini.model()}:generateContent  parts=${1 + (req.images?.length || 0)}`
  },
  async run(req) {
    const key = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
    const parts = [{ text: req.prompt }]
    for (const p of req.images || []) {
      parts.push({ inline_data: { mime_type: mimeOf(p), data: await asBase64(p) } })
    }
    const j = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${gemini.model()}:generateContent`,
      { contents: [{ parts }] },
      { 'x-goog-api-key': key },
      req.timeoutMs,
    )
    const out = j?.candidates?.[0]?.content?.parts || []
    return {
      files: out.filter((p) => p.inline_data || p.inlineData).map((p) => {
        const d = p.inline_data || p.inlineData
        return { buffer: Buffer.from(d.data, 'base64'), ext: '.png' }
      }),
      texts: out.filter((p) => p.text).map((p) => p.text),
      raw: j,
    }
  },
}

/* ---------- fal ---------- */

const fal = {
  id: 'fal',
  kind: 'http',
  hasCredentials: () => Boolean(env.FAL_KEY),
  model: (req) =>
    env.GEN_MODEL_FAL || (req?.images?.length ? 'fal-ai/flux-pro/kontext' : 'fal-ai/flux/dev'),
  describe(req) { return `POST https://fal.run/${fal.model(req)}` },
  async run(req) {
    const body = { prompt: req.prompt, num_images: req.batch }
    if (req.images?.length) body.image_url = await asDataUri(req.images[0])
    if (req.images?.length > 1) body.image_urls = await Promise.all(req.images.map(asDataUri))
    const j = await postJson(
      `https://fal.run/${fal.model(req)}`, body,
      { authorization: `Key ${env.FAL_KEY}` }, req.timeoutMs,
    )
    const outs = j.images || j.image || j.videos || j.video || []
    return {
      files: (Array.isArray(outs) ? outs : [outs])
        .map((i) => (typeof i === 'string' ? { url: i } : i))
        .filter((i) => i?.url)
        .map((i) => ({ url: i.url, ext: path.extname(new URL(i.url).pathname) || (req.video ? '.mp4' : '.jpg') })),
      raw: j,
    }
  },
}

/* ---------- Replicate ---------- */

const replicate = {
  id: 'replicate',
  kind: 'http',
  hasCredentials: () => Boolean(env.REPLICATE_API_TOKEN),
  model: (req) =>
    env.GEN_MODEL_REPLICATE ||
    (req?.images?.length ? 'black-forest-labs/flux-kontext-pro' : 'black-forest-labs/flux-dev'),
  describe(req) { return `POST https://api.replicate.com/v1/models/${replicate.model(req)}/predictions` },
  async run(req) {
    const input = { prompt: req.prompt, num_outputs: req.batch }
    if (req.images?.length) input.input_image = await asDataUri(req.images[0])
    const j = await postJson(
      `https://api.replicate.com/v1/models/${replicate.model(req)}/predictions`,
      { input },
      { authorization: `Bearer ${env.REPLICATE_API_TOKEN}`, prefer: 'wait' },
      req.timeoutMs,
    )
    const out = Array.isArray(j.output) ? j.output : j.output ? [j.output] : []
    if (j.error) throw new Error(`Replicate: ${j.error}`)
    return {
      files: out.filter((u) => typeof u === 'string').map((u) => ({
        url: u, ext: path.extname(new URL(u).pathname) || (req.video ? '.mp4' : '.png'),
      })),
      raw: j,
    }
  },
}

/* ---------- 火山方舟（Seedream）---------- */

const ark = {
  id: 'ark',
  kind: 'http',
  hasCredentials: () => Boolean(env.ARK_API_KEY),
  model: () => env.GEN_MODEL_ARK || env.ARK_MODEL,
  describe(req) {
    return `POST ${env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'}/images/generations  model=${ark.model() || '<需设 ARK_MODEL>'}`
  },
  async run(req) {
    if (!ark.model()) throw new Error('火山方舟需指定模型：export ARK_MODEL=<你开通的 seedream 模型 ID>')
    const base = env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
    const body = {
      model: ark.model(), prompt: req.prompt,
      size: req.size || '2K', response_format: 'url', watermark: false,
    }
    if (req.images?.length) body.image = await Promise.all(req.images.map(asDataUri))
    const j = await postJson(`${base}/images/generations`, body,
      { authorization: `Bearer ${env.ARK_API_KEY}` }, req.timeoutMs)
    return {
      files: (j.data || []).map((d) =>
        d.b64_json
          ? { buffer: Buffer.from(d.b64_json, 'base64'), ext: '.jpg' }
          : { url: d.url, ext: '.jpg' }),
      raw: j,
    }
  },
}

export const PROVIDERS = { dlazy, openai, gemini, fal, replicate, ark }

/** 选路：显式 flag > PROVIDER 环境变量 > 有 key 的第一个 > dlazy */
export function pickProvider(explicit) {
  if (explicit) {
    const p = PROVIDERS[explicit]
    if (!p) throw new Error(`未知后端 "${explicit}"，可选：${Object.keys(PROVIDERS).join(' / ')}`)
    return p
  }
  if (env.PROVIDER) return pickProvider(env.PROVIDER)
  for (const id of ['openai', 'gemini', 'fal', 'replicate', 'ark']) {
    if (PROVIDERS[id].hasCredentials()) return PROVIDERS[id]
  }
  return dlazy
}

/** 各后端凭据状态，给 doctor / dry-run 用 */
export function credentialReport() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    ready: p.id === 'dlazy' ? 'cli' : p.hasCredentials(),
    envKey: {
      dlazy: 'dlazy login  或  DLAZY_API_KEY',
      openai: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY',
      fal: 'FAL_KEY', replicate: 'REPLICATE_API_TOKEN', ark: 'ARK_API_KEY (+ ARK_MODEL)',
    }[p.id],
  }))
}
