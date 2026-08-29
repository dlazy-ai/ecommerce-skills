#!/usr/bin/env node
/**
 * ecommerce-skills MCP server
 *
 * 同一份 prompt 与脚本资产的第三种消费方式：
 *   1. Skills —— npx skills add（给 Claude Code / Cursor 这类 agent）
 *   2. 插件市场 —— .claude-plugin/marketplace.json
 *   3. MCP —— 这个文件（给任意 MCP 客户端）
 *
 * 零依赖，stdio JSON-RPC。配置：
 *   { "mcpServers": { "ecommerce": { "command": "node",
 *       "args": ["/abs/path/to/ecommerce-skills/mcp/server.mjs"] } } }
 */
import { spawn } from 'node:child_process'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPTS = path.join(ROOT, 'shared', 'scripts')
const TASKS = JSON.parse(readFileSync(path.join(SCRIPTS, 'lib', 'tasks.json'), 'utf8'))
const CFG = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'skills.config.json'), 'utf8'))

const PROTOCOL = '2024-11-05'
const imageTasks = Object.entries(TASKS.tasks)
  .filter(([, v]) => !v.text && !v.video).map(([k]) => k)
const videoTasks = Object.entries(TASKS.tasks)
  .filter(([, v]) => v.video).map(([k]) => k)

/* ---------------- 工具定义 ---------------- */

const TOOLS = [
  {
    name: 'list_skills',
    description: '列出全部电商视觉技能：名字、做什么、什么时候用。先调它决定用哪个技能。',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_skill',
    description: '读某个技能的完整说明，含能力边界、prompt 模板、参数约定与常见问题。生成前先读它。',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: '技能名，来自 list_skills' } },
      required: ['name'],
    },
  },
  {
    name: 'generate_image',
    description: '按指定技能生成电商图。先用 get_skill 读该技能的 prompt 模板再调。' +
      'dry_run=true 只返回将要发出的请求与预估成本，不计费。',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', enum: imageTasks, description: '用哪个技能' },
        prompt: { type: 'string', description: '生成提示词，建议英文' },
        images: { type: 'array', items: { type: 'string' }, description: '参考图路径，顺序即 prompt 里的 image 1/2/3' },
        save: { type: 'string', description: '产物落盘路径' },
        size: { type: 'string' },
        quality: { type: 'string', enum: ['low', 'medium', 'high'] },
        batch: { type: 'number', description: '一次出几张挑图' },
        brand: { type: 'string', description: 'brand.yaml 路径，用于跨 SKU 视觉统一' },
        provider: { type: 'string', enum: ['dlazy', 'openai', 'gemini', 'fal', 'replicate', 'ark'] },
        dry_run: { type: 'boolean' },
      },
      required: ['task', 'prompt'],
    },
  },
  {
    name: 'generate_video',
    description: '生成商品视频。mode=clip 出单镜；mode=storyboard 按分镜文件出整条并拼接。' +
      '需要先设 DLAZY_VIDEO_MODEL 环境变量指定视频模型。',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', enum: videoTasks },
        mode: { type: 'string', enum: ['clip', 'storyboard'], default: 'clip' },
        prompt: { type: 'string', description: 'mode=clip 时必填' },
        image: { type: 'string', description: 'mode=clip 的输入图' },
        board: { type: 'string', description: 'mode=storyboard 的分镜 JSON 路径' },
        outdir: { type: 'string' },
        save: { type: 'string' },
        seconds: { type: 'number' },
        subtitles: { type: 'boolean' },
        dry_run: { type: 'boolean' },
      },
      required: ['task'],
    },
  },
  {
    name: 'check_compliance',
    description: '上架前客观合规校验：背景纯度、主体占比、分辨率、比例、透明通道、格式、体积。' +
      '返回每项的实测值与阈值。fix_dir 非空时同时产出修好的合规图。',
    inputSchema: {
      type: 'object',
      properties: {
        images: { type: 'array', items: { type: 'string' }, description: '待检图路径' },
        platform: { type: 'string', enum: ['amazon', 'tiktok-shop', 'temu', 'shopee', 'shopify', 'taobao'], default: 'amazon' },
        fix_dir: { type: 'string', description: '给了就自动修复并输出到这个目录' },
      },
      required: ['images'],
    },
  },
  {
    name: 'run_quality_loop',
    description: '生成 → 质检 → 自动改 prompt → 重跑，直到达标或到轮次上限。' +
      '产出 manifest 记录每一轮。适合要求一次交付合格图的场景。',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', enum: imageTasks },
        prompt: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        save: { type: 'string' },
        platform: { type: 'string' },
        max_rounds: { type: 'number', default: 3 },
        accept: { type: 'string', enum: ['低风险', '中风险'], default: '低风险' },
      },
      required: ['task', 'prompt'],
    },
  },
  {
    name: 'batch_generate',
    description: '按商品清单 CSV 批量出图：并发、重试、断点续跑、成本熔断、挑图联系表。',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'CSV 路径，需含 sku 列' },
        task: { type: 'string', enum: imageTasks },
        template: { type: 'string', description: 'prompt 模板文件，用 {{列名}} 取值' },
        outdir: { type: 'string' },
        concurrency: { type: 'number', default: 3 },
        max_credits: { type: 'number', description: '成本熔断线' },
        resume: { type: 'boolean' },
        dry_run: { type: 'boolean' },
      },
      required: ['input', 'task', 'template'],
    },
  },
]

/* ---------------- 执行 ---------------- */

function exec(cmd, args, cwd = ROOT) {
  return new Promise((resolve) => {
    const ps = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let so = '', se = ''
    ps.stdout.on('data', (d) => (so += d))
    ps.stderr.on('data', (d) => (se += d))
    ps.on('error', (e) => resolve({ code: -1, stdout: '', stderr: e.message }))
    ps.on('close', (code) => resolve({ code, stdout: so, stderr: se }))
  })
}

const flag = (args, name, val) => { if (val !== undefined && val !== null && val !== '') args.push(name, String(val)) }

async function callTool(name, a = {}) {
  switch (name) {
    case 'list_skills': {
      const rows = Object.entries(CFG.skills).map(([k, v]) => `- **${k}** — ${v.description}`)
      return rows.join('\n')
    }
    case 'get_skill': {
      const f = path.join(ROOT, 'skills', a.name, 'skill.md')
      if (!existsSync(f)) {
        return `没有叫 "${a.name}" 的技能。可用：${readdirSync(path.join(ROOT, 'skills')).join(', ')}`
      }
      return readFileSync(f, 'utf8')
    }
    case 'generate_image': {
      const args = [path.join(SCRIPTS, 'gen.mjs'), '--task', a.task, '--prompt', a.prompt, '--json']
      if (a.images?.length) args.push('--images', ...a.images)
      flag(args, '--save', a.save); flag(args, '--size', a.size); flag(args, '--quality', a.quality)
      flag(args, '--batch', a.batch); flag(args, '--brand', a.brand); flag(args, '--provider', a.provider)
      if (a.dry_run) args.push('--dry-run')
      const r = await exec(process.execPath, args)
      return r.code === 0 ? r.stdout : `生成失败：\n${r.stderr || r.stdout}`
    }
    case 'generate_video': {
      const args = [path.join(SCRIPTS, 'video.mjs'), '--task', a.task, '--mode', a.mode || 'clip']
      flag(args, '--prompt', a.prompt); flag(args, '--image', a.image); flag(args, '--board', a.board)
      flag(args, '--outdir', a.outdir); flag(args, '--save', a.save); flag(args, '--seconds', a.seconds)
      if (a.subtitles) args.push('--subtitles')
      if (a.dry_run) args.push('--dry-run')
      const r = await exec(process.execPath, args)
      return r.code === 0 ? r.stdout : `视频生成失败：\n${r.stderr || r.stdout}`
    }
    case 'check_compliance': {
      const args = [path.join(SCRIPTS, 'check_listing.py'), ...a.images,
        '--platform', a.platform || 'amazon', '--json']
      if (a.fix_dir) args.push('--fix', a.fix_dir)
      const r = await exec('python3', args)
      if (r.code === -1) return `跑不起来（需要 python3 与 Pillow）：${r.stderr}`
      return r.stdout || r.stderr
    }
    case 'run_quality_loop': {
      const args = [path.join(SCRIPTS, 'run_loop.mjs'), '--task', a.task, '--prompt', a.prompt]
      if (a.images?.length) args.push('--images', ...a.images)
      flag(args, '--save', a.save); flag(args, '--platform', a.platform)
      flag(args, '--max-rounds', a.max_rounds); flag(args, '--accept', a.accept)
      const r = await exec(process.execPath, args)
      return r.stdout || r.stderr
    }
    case 'batch_generate': {
      const args = [path.join(SCRIPTS, 'batch.mjs'), '--input', a.input,
        '--task', a.task, '--template', a.template]
      flag(args, '--outdir', a.outdir); flag(args, '--concurrency', a.concurrency)
      flag(args, '--max-credits', a.max_credits)
      if (a.resume) args.push('--resume')
      if (a.dry_run) args.push('--dry-run')
      const r = await exec(process.execPath, args)
      return r.stdout || r.stderr
    }
    default:
      throw new Error(`未知工具 ${name}`)
  }
}

/* ---------------- JSON-RPC over stdio ---------------- */

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')

async function handle(req) {
  const { id, method, params } = req
  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: PROTOCOL,
            capabilities: { tools: {} },
            serverInfo: { name: 'ecommerce-skills', version: '2.0.0' },
          },
        }
      case 'notifications/initialized':
        return null
      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: TOOLS } }
      case 'tools/call': {
        const text = await callTool(params.name, params.arguments || {})
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(text) }] } }
      }
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} }
      default:
        if (id === undefined) return null
        return { jsonrpc: '2.0', id, error: { code: -32601, message: `方法未实现：${method}` } }
    }
  } catch (e) {
    return { jsonrpc: '2.0', id, error: { code: -32603, message: e.message } }
  }
}

let buf = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', async (chunk) => {
  buf += chunk
  let nl
  while ((nl = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, nl).trim()
    buf = buf.slice(nl + 1)
    if (!line) continue
    let req
    try { req = JSON.parse(line) } catch { continue }
    const res = await handle(req)
    if (res) send(res)
  }
})
