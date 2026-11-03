import type { MacroCall, MacroNode } from './types'
import { parseMacro } from './parser'
import { getShortestMacroName } from './macro-aliases'

const INDENT = '  '

/** 只有遇到语法分隔符时才需要为裸文本补上引号，避免格式化改变宏参数语义。 */
const serializeLiteral = (value: string): string => (
  value !== '' && !/[\s,()"\\]/u.test(value) && !value.includes('[') && !value.includes(']') ? value : JSON.stringify(value)
)

/** 仅在省略 MM 后仍会被解析为文字的场景压缩；例如 MM(LINE) 不能缩为 LINE。 */
const getElidableMiddleText = (node: MacroNode): string | undefined => {
  if (node.kind !== 'call' || node.name !== 'MM' || node.arguments.length !== 1) return undefined
  const [argument] = node.arguments
  if (argument.kind !== 'literal') return undefined
  const text = serializeLiteral(argument.value)
  return text.startsWith('"') || !/[A-Za-z_]/.test(text[0] ?? '') ? text : undefined
}

const serializeCellArgument = (node: MacroNode, index: number, usesCellShorthand: boolean): string => {
  const elidedText = index === 0 ? getElidableMiddleText(node) : undefined
  return elidedText ?? serializeNode(node, usesCellShorthand)
}

const serializeNode = (node: MacroNode, usesCellShorthand = false): string => {
  if (node.kind === 'literal') return serializeLiteral(node.value)
  if (node.kind === 'symbol') return getShortestMacroName(node.name)
  if (usesCellShorthand && node.name === 'CELL') return `[${node.arguments.map((argument, index) => serializeCellArgument(argument, index, true)).join(',')}]`
  if (usesCellShorthand && node.name === 'ROW') {
    return `${getShortestMacroName(node.name)}(${node.arguments.map((argument) => getElidableMiddleText(argument) ?? serializeNode(argument, true)).join(',')})`
  }
  return `${getShortestMacroName(node.name)}(${node.arguments.map((argument) => serializeNode(argument, usesCellShorthand)).join(',')})`
}

const canInlineCall = (node: MacroCall): boolean => node.arguments.every((argument) => argument.kind !== 'call')

/** 将简单参数保持在一行，包含嵌套函数的调用则按参数逐行展开并增加缩进。 */
const formatNode = (node: MacroNode, level: number, usesCellShorthand = false): string => {
  if (node.kind !== 'call') return serializeNode(node, usesCellShorthand)
  if (usesCellShorthand && node.name === 'CELL') {
    return `[${node.arguments.map((argument, index) => serializeCellArgument(argument, index, true)).join(', ')}]`
  }
  if (node.arguments.length === 0) return `${getShortestMacroName(node.name)}()`
  if (canInlineCall(node)) return `${getShortestMacroName(node.name)}(${node.arguments.map((argument) => serializeNode(argument, usesCellShorthand)).join(', ')})`

  const childIndent = INDENT.repeat(level + 1)
  const closingIndent = INDENT.repeat(level)
  return `${getShortestMacroName(node.name)}(\n${node.arguments.map((argument) => `${childIndent}${formatNode(argument, level + 1, usesCellShorthand)}`).join(',\n')}\n${closingIndent})`
}

const hasExplicitGrid = (source: string): boolean => /^\s*GRID\s*\(/u.test(source)

/** 只识别引号与括号之外的分号，避免把普通文本误判为行分隔符。 */
const hasTopLevelSemicolon = (source: string): boolean => {
  let depth = 0
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '\\') index += 1
      else if (character === '"') quoted = false
      continue
    }
    if (character === '"') quoted = true
    else if (character === '(') depth += 1
    else if (character === ')') depth -= 1
    else if (character === ';' && depth === 0) return true
  }
  return false
}

/** 方括号是 CELL 简写的专属语法；跳过引号，避免普通文本触发格式风格切换。 */
const hasCellShorthand = (source: string): boolean => {
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '\\') index += 1
      else if (character === '"') quoted = false
      continue
    }
    if (character === '"') quoted = true
    else if (character === '[') return true
  }
  return false
}

/** 将隐式 ROW 还原为分号行，保证格式化不会把快捷输入重新展开。 */
const formatRowShorthand = (root: MacroCall, pretty: boolean, usesCellShorthand: boolean): string => root.arguments
  .map((node) => {
    const row = node.kind === 'call' && node.name === 'ROW' ? node.arguments : [node]
    return pretty
      ? row.map((child) => getElidableMiddleText(child) ?? formatNode(child, 0, usesCellShorthand)).join(', ')
      : row.map((child) => getElidableMiddleText(child) ?? serializeNode(child, usesCellShorthand)).join(',')
  })
  .join(pretty ? ';\n' : ';')
  .concat(';')

const formatRoot = (root: MacroCall, source: string, pretty: boolean): string => {
  const usesCellShorthand = hasCellShorthand(source)
  if (!hasExplicitGrid(source) && hasTopLevelSemicolon(source)) {
    return formatRowShorthand(root, pretty, usesCellShorthand)
  }
  const nodes = hasExplicitGrid(source) ? [root] : root.arguments
  if (!pretty) return nodes.map((node) => serializeNode(node, usesCellShorthand)).join(',')
  return nodes.map((node) => formatNode(node, 0, usesCellShorthand)).join(',\n')
}

/**
 * 最简化时允许把没有 GRID 配置的完整根节点降级为顶层分号行。
 * 一旦根节点包含 KV 配置，仍需保留 GRID，避免把场景级设置误放进 ROW。
 */
const minifyRoot = (root: MacroCall, source: string): string => {
  const hasGridOptions = root.arguments.some((node) => node.kind === 'call' && node.name === 'KV')
  if (hasExplicitGrid(source) && !hasGridOptions && root.arguments.length > 0) return formatRowShorthand(root, false, true)
  if (!hasExplicitGrid(source) && hasTopLevelSemicolon(source)) return formatRowShorthand(root, false, true)
  return (hasExplicitGrid(source) ? serializeNode(root, true) : root.arguments.map((node) => serializeNode(node, true)).join(','))
}

/** 直接序列化 AST 时不保留输入风格，始终选择可用的最简表达。 */
export const minifyMacroAst = (root: MacroCall): string => {
  const hasGridOptions = root.arguments.some((node) => node.kind === 'call' && node.name === 'KV')
  return hasGridOptions ? serializeNode(root, true) : formatRowShorthand(root, false, true)
}

/** 将已更新的 AST 按调用方选择的输入框风格重新输出，避免编辑后被强制降级为最简式。 */
export const formatMacroAst = (root: MacroCall, style: 'formatted' | 'minified' = 'formatted'): string => (
  style === 'minified' ? minifyMacroAst(root) : formatRoot(root, 'GRID(', true)
)

/** 将宏源码解析为 AST 后按函数层级格式化，保留显式或隐式 GRID 的写法。 */
export const formatMacro = (source: string): string => formatRoot(parseMacro(source), source, true)

/** 将完整宏源码压缩为最简合法写法，并在可行时降级为分号行与方括号语法糖。 */
export const minifyMacro = (source: string): string => minifyRoot(parseMacro(source), source)

