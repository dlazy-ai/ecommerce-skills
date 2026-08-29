/**
 * 单元测试 —— 跑：node --test tests/
 * 覆盖那些「错了不会报错、只会悄悄出错」的纯函数。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseYaml } from '../shared/scripts/lib/miniyaml.mjs'
import { buildBrand } from '../shared/scripts/brand.mjs'

/* ---------------- miniyaml ---------------- */

test('miniyaml：嵌套映射与标量转型', () => {
  const d = parseYaml(`
brand:
  name: 示例
  scale: 1.5
  active: true
  missing:
photography:
  background: seamless white
`)
  assert.equal(d.brand.name, '示例')
  assert.equal(d.brand.scale, 1.5)
  assert.equal(d.brand.active, true)
  assert.equal(d.brand.missing, null)
  assert.equal(d.photography.background, 'seamless white')
})

test('miniyaml：列表与注释', () => {
  const d = parseYaml(`
# 整行注释
forbid:
  - no text or watermark   # 行尾注释
  - no borders
inline: [a, b, 3]
`)
  assert.deepEqual(d.forbid, ['no text or watermark', 'no borders'])
  assert.deepEqual(d.inline, ['a', 'b', 3])
})

test('miniyaml：带冒号的值不会被截断', () => {
  const d = parseYaml('photography:\n  grade: white balance: 5200K\n')
  assert.equal(d.photography.grade, 'white balance: 5200K')
})

test('miniyaml：看不懂的行要报错，不能静默吞掉', () => {
  assert.throws(() => parseYaml('这不是 yaml\n'), /看不懂/)
})

/* ---------------- brand ---------------- */

const DOC = {
  brand: { tone: 'quiet minimalist' },
  model: { description: 'East Asian woman', body: 'slim' },
  photography: { background: 'white backdrop', lighting: 'softbox' },
  layout: { margin: '8%' },
  forbid: ['no text'],
}

test('brand：出人像的技能拿到模特段，排版段不给它', () => {
  const r = buildBrand(DOC, 'flat-lay')
  assert.match(r.append, /East Asian woman/)
  assert.match(r.append, /white backdrop/)
  assert.doesNotMatch(r.append, /Layout margin/)
})

test('brand：排版技能拿到 layout，不给模特脸', () => {
  const r = buildBrand(DOC, 'item-detail')
  assert.match(r.append, /Layout margin/)
  assert.doesNotMatch(r.append, /East Asian woman/)
})

test('brand：forbid 对所有技能生效', () => {
  for (const t of ['flat-lay', 'item-detail', 'remove-watermark']) {
    assert.match(buildBrand(DOC, t).append, /Hard constraints: no text/)
  }
})

test('brand：模特参考图不存在时只警告，不抛错', () => {
  const r = buildBrand({ ...DOC, model: { ...DOC.model, reference: '不存在.jpg' } }, 'flat-lay')
  assert.equal(r.images.length, 0)
  assert.equal(r.warnings.length, 1)
  assert.doesNotMatch(r.append, /不存在\.jpg/)
})

/* ---------------- 质检报告解析 ---------------- */
// 从 run_loop.mjs 复制的解析逻辑走的是同一份实现，这里直接验证契约。
// 报告格式变了而解析没跟上，是这条闭环最容易悄悄失效的地方。

const REPORT = `
## 1. 风险等级
中风险
## 2. 风险项逐条判定
| 风险项 | 结论 | 证据 |
| --- | --- | --- |
| 商品崩坏 | 通过 | 织法完整 |
| 文字乱码 | 命中 | 袖口织标模糊 |
| 手部异常 | 命中 | 左手第五指粘连 |
## 3. 投放建议
建议重跑
## 4. 修正建议
- \`clear and legible brand tag embroidery on cuff, sharp fine detail\`
- \`anatomically correct hands, five separated fingers\`
`

test('质检报告：等级、命中项、修正句都要抠得出来', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../shared/scripts/run_loop.mjs', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('function parseReport'), src.indexOf('async function main'))
  const parseReport = new Function(`${body}; return parseReport`)()

  const r = parseReport(REPORT)
  assert.equal(r.level, '中风险')
  assert.equal(r.advice, '建议重跑')
  assert.deepEqual(r.hits.map((h) => h.item), ['文字乱码', '手部异常'])
  assert.equal(r.fixes.length, 2)
  assert.match(r.fixes[0], /legible brand tag/)
})

test('质检报告：低风险且无修正建议时，闭环应当停止', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../shared/scripts/run_loop.mjs', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('function parseReport'), src.indexOf('async function main'))
  const parseReport = new Function(`${body}; return parseReport`)()

  const r = parseReport('## 1. 风险等级\n低风险\n## 3. 投放建议\n建议投放\n## 4. 修正建议\n无需修正\n')
  assert.equal(r.level, '低风险')
  assert.equal(r.fixes.length, 0)
})

/* ---------------- CSV ---------------- */

test('CSV：引号包裹、内嵌逗号与转义引号', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../shared/scripts/batch.mjs', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('function parseCsv'), src.indexOf('const render ='))
  const parseCsv = new Function(`${body}; return parseCsv`)()

  const rows = parseCsv('sku,note\nA001,"红, 蓝两色"\nA002,"他说 ""好"" "\n')
  assert.equal(rows.length, 2)
  assert.equal(rows[0].note, '红, 蓝两色')
  // 约定：字段一律 trim —— 表格软件导出的首尾空格是噪音，不是数据
  assert.equal(rows[1].note, '他说 "好"')
})

test('CSV：空行被跳过，缺列补空串', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../shared/scripts/batch.mjs', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('function parseCsv'), src.indexOf('const render ='))
  const parseCsv = new Function(`${body}; return parseCsv`)()

  const rows = parseCsv('sku,color,images\nA001,红\n\nA002,蓝,x.jpg\n')
  assert.equal(rows.length, 2)
  assert.equal(rows[0].images, '')
})

/* ---------------- 尺寸映射 ---------------- */

test('尺寸映射：任意比例落到 OpenAI 支持的档位', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('../shared/scripts/lib/providers.mjs', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('function mapSize'), src.indexOf('/* ---------- Gemini'))
  const mapSize = new Function(`${body}; return mapSize`)()

  assert.equal(mapSize('1024x1536'), '1024x1536')   // 竖版
  assert.equal(mapSize('1536x1024'), '1536x1024')   // 横版
  assert.equal(mapSize('1024x1024'), '1024x1024')   // 方图
  assert.equal(mapSize('3:4'), '1024x1536')         // 比例写法也认
  assert.equal(mapSize(undefined), 'auto')
  assert.equal(mapSize('乱写'), 'auto')
})
