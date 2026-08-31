#!/usr/bin/env node
// ⚠️ 由 scripts/build-skills.mjs 从 shared/scripts/brand.mjs 同步生成，不要直接改这里。
/**
 * brand.mjs —— 把 brand.yaml 翻译成可直接追加到任意 prompt 的英文约束句。
 *
 * 跨 SKU 视觉统一靠的是可复用的资产，不是每次重写 prompt。
 *
 *   node scripts/brand.mjs --init > brand.yaml          # 生成模板
 *   node scripts/brand.mjs --brand brand.yaml --for flat-lay
 *   node scripts/brand.mjs --brand brand.yaml --for item-detail --json
 *
 * gen.mjs 加 --brand brand.yaml 会自动调用它，无需手工拼接。
 */
import { readFile } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseYaml } from './lib/miniyaml.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** 哪些技能吃哪些段落 —— 排版类才需要 layout，去水印这类不需要模特 */
const NEEDS = {
  model: ['flat-lay', 'wear-everything', 'image-fusion', 'one-shot', 'fission-pattern',
    'creative-scene', 'clothing-grass-planting', 'batch-image', 'main-image-video',
    'product-video-ad', 'ugc-testimonial', 'listing-optimizer'],
  layout: ['item-detail', 'item-selling-point', 'listing-optimizer', 'cross-border-localize'],
  photography: ['flat-lay', 'wear-everything', 'image-fusion', 'one-shot', 'fission-pattern',
    'creative-scene', 'clothing-grass-planting', 'item-change-background', 'to-3d',
    'clothing-detail', 'item-repair', 'batch-image', 'listing-optimizer',
    'main-image-video', 'product-video-ad', 'ugc-testimonial'],
}

export function buildBrand(doc, task) {
  const parts = []
  const images = []
  const b = doc.brand || {}
  const wants = (k) => !task || (NEEDS[k] || []).includes(task)

  if (b.tone) parts.push(`Overall art direction: ${b.tone}.`)

  if (wants('model') && doc.model) {
    const m = doc.model
    const bits = [m.description, m.body].filter(Boolean).join(', ')
    if (bits) parts.push(`Model must stay consistent: ${bits}.`)
    if (m.reference) {
      if (existsSync(m.reference)) images.push(m.reference)
      else parts.push(`(模特参考图 ${m.reference} 找不到，已跳过)`)
    }
  }

  if (wants('photography') && doc.photography) {
    const p = doc.photography
    const map = {
      background: 'Background', lighting: 'Lighting', camera: 'Camera',
      grade: 'Color grade', crop: 'Framing',
    }
    for (const [k, label] of Object.entries(map)) {
      if (p[k]) parts.push(`${label}: ${p[k]}.`)
    }
  }

  if (wants('layout') && doc.layout) {
    const l = doc.layout
    if (l.margin) parts.push(`Layout margin: ${l.margin}.`)
    if (l.typeface) parts.push(`Typography: ${l.typeface}.`)
    if (l.text_color) parts.push(`Text color: ${l.text_color}.`)
  }

  if (Array.isArray(doc.forbid) && doc.forbid.length) {
    parts.push(`Hard constraints: ${doc.forbid.join('; ')}.`)
  }

  return {
    append: parts.filter((s) => !s.startsWith('(')).join(' '),
    warnings: parts.filter((s) => s.startsWith('(')),
    images,
    platform: doc.compliance?.platform || null,
  }
}

export async function loadBrand(file) {
  const raw = await readFile(file, 'utf8')
  return file.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw)
}

/* ---------- CLI ---------- */

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  const get = (f) => { const i = argv.indexOf(f); return i === -1 ? null : argv[i + 1] }

  if (argv.includes('--init')) {
    const tpl = path.join(HERE, '..', 'examples', 'brand.yaml')
    if (!existsSync(tpl)) {
      console.error(`✗ 找不到模板 ${tpl}\n  模板只随 brand-kit 技能分发，装一下：` +
        `npx skills add https://github.com/dlazy-ai/ecommerce-skills --skill brand-kit`)
      process.exit(1)
    }
    console.log(readFileSync(tpl, 'utf8'))
    process.exit(0)
  }

  const file = get('--brand')
  if (!file) {
    console.log(`用法：
  node scripts/brand.mjs --init > brand.yaml
  node scripts/brand.mjs --brand brand.yaml --for <技能名> [--json]`)
    process.exit(argv.length ? 1 : 0)
  }
  const doc = await loadBrand(file)
  const out = buildBrand(doc, get('--for'))
  if (argv.includes('--json')) console.log(JSON.stringify(out, null, 2))
  else {
    for (const w of out.warnings) console.error('  ! ' + w)
    if (out.images.length) console.error(`  额外参考图：${out.images.join(', ')}`)
    console.log(out.append)
  }
}
