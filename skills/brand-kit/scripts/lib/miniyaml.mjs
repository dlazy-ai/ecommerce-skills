// ⚠️ 由 scripts/build-skills.mjs 从 shared/scripts/lib/miniyaml.mjs 同步生成，不要直接改这里。
/**
 * 极简 YAML 子集解析 —— 只为 brand.yaml 服务，不引入依赖。
 *
 * 支持：2 空格缩进的嵌套映射、标量、`- ` 列表、# 注释、单双引号、
 *       true/false/null/数字自动转型、行内 [a, b] 短列表。
 * 不支持：锚点、多行标量、复杂流式语法 —— 用到那些就该换真 YAML 库了。
 */
function coerce(v) {
  const s = v.trim()
  if (s === '' || s === '~' || s === 'null') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  if (/^\[.*\]$/.test(s)) {
    const inner = s.slice(1, -1).trim()
    return inner ? inner.split(',').map((x) => coerce(x)) : []
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

export function parseYaml(text) {
  const lines = text.split('\n')
    .map((l) => (l.includes('#') && !/["'].*#/.test(l) ? l.slice(0, l.indexOf('#')) : l))
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '')

  const root = {}
  // stack[i] = { indent, container }
  const stack = [{ indent: -1, container: root }]

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    const indent = line.length - line.trimStart().length
    const body = line.trim()
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop()
    const top = stack[stack.length - 1].container

    if (body.startsWith('- ')) {
      if (!Array.isArray(top)) throw new Error(`YAML: 列表项出现在非列表位置 → ${line}`)
      const item = body.slice(2).trim()
      if (/^[\w.-]+:/.test(item)) {
        const obj = {}
        const [k, ...rest] = item.split(':')
        const val = rest.join(':').trim()
        if (val) obj[k.trim()] = coerce(val)
        else {
          const child = {}
          obj[k.trim()] = child
          stack.push({ indent, container: child })
        }
        top.push(obj)
      } else top.push(coerce(item))
      continue
    }

    const m = body.match(/^([\w.-]+):\s*(.*)$/)
    if (!m) throw new Error(`YAML: 看不懂这一行 → ${line}`)
    const [, key, rest] = m
    if (rest === '') {
      // 下一行更深才算子结构；否则这个键就是空值
      const next = lines[li + 1]
      const nextIndent = next ? next.length - next.trimStart().length : -1
      const hasChild = next && nextIndent > indent
      if (!hasChild) { top[key] = null; continue }
      const child = next.trim().startsWith('- ') ? [] : {}
      top[key] = child
      stack.push({ indent, container: child })
    } else {
      top[key] = coerce(rest)
    }
  }
  return root
}
