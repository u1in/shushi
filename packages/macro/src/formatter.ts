import type { MacroCall, MacroNode } from './types'
import { parseMacro } from './parser'

const INDENT = '  '

/** 只有遇到语法分隔符时才需要为裸文本补上引号，避免格式化改变宏参数语义。 */
const serializeLiteral = (value: string): string => (
  value !== '' && !/[\s,()"\\]/u.test(value) ? value : JSON.stringify(value)
)

const serializeNode = (node: MacroNode): string => {
  if (node.kind === 'literal') return serializeLiteral(node.value)
  if (node.kind === 'symbol') return node.name
  return `${node.name}(${node.arguments.map(serializeNode).join(',')})`
}

const canInlineCall = (node: MacroCall): boolean => node.arguments.every((argument) => argument.kind !== 'call')

/** 将简单参数保持在一行，包含嵌套函数的调用则按参数逐行展开并增加缩进。 */
const formatNode = (node: MacroNode, level: number): string => {
  if (node.kind !== 'call') return serializeNode(node)
  if (node.arguments.length === 0) return `${node.name}()`
  if (canInlineCall(node)) return `${node.name}(${node.arguments.map(serializeNode).join(', ')})`

  const childIndent = INDENT.repeat(level + 1)
  const closingIndent = INDENT.repeat(level)
  return `${node.name}(\n${node.arguments.map((argument) => `${childIndent}${formatNode(argument, level + 1)}`).join(',\n')}\n${closingIndent})`
}

const hasExplicitGrid = (source: string): boolean => /^\s*GRID\s*\(/u.test(source)

const formatRoot = (root: MacroCall, source: string, pretty: boolean): string => {
  const nodes = hasExplicitGrid(source) ? [root] : root.arguments
  if (!pretty) return nodes.map(serializeNode).join(',')
  return nodes.map((node) => formatNode(node, 0)).join(',\n')
}

/** 将宏源码解析为 AST 后按函数层级格式化，保留显式或隐式 GRID 的写法。 */
export const formatMacro = (source: string): string => formatRoot(parseMacro(source), source, true)

/** 将宏源码解析后压缩为无换行、无多余空格的最短可读写法。 */
export const minifyMacro = (source: string): string => formatRoot(parseMacro(source), source, false)
