import type { MacroCall, MacroLiteral, MacroNode, MacroSymbol } from './types'
import { getCanonicalMacroName } from './macro-aliases'

/** CELL 中允许裸写的零参数图元；其他裸名称会被视为漏写了参数的文字定位宏。 */
const CELL_ZERO_ARGUMENT_SYMBOLS = new Set(['DOT', 'MTD', 'EMPTY', 'STYLE', 'BRACKET', 'TBD', 'RBD', 'BBD', 'LBD'])

/** 带位置的错误信息让主页输入框能直接指出宏源码的问题。 */
const createSyntaxError = (source: string, index: number, message: string): Error => (
  new Error(`${message}（第 ${index + 1} 个字符附近：${source.slice(index, index + 18)}）`)
)

const isNameStart = (character: string): boolean => /[A-Za-z_]/.test(character)
const isNamePart = (character: string): boolean => /[A-Za-z0-9_-]/.test(character)

/** 解析紧凑的 FUNCTION(arg, child) 宏语言；文本仅在有分隔符时需要使用引号。 */
export const parseMacro = (source: string): MacroCall => {
  let index = 0

  const skipWhitespace = (): void => {
    while (/\s/.test(source[index] ?? '')) index += 1
  }

  const parseQuotedLiteral = (): MacroLiteral => {
    const start = index
    index += 1
    let value = ''
    while (index < source.length && source[index] !== '"') {
      if (source[index] === '\\') {
        const escaped = source[index + 1]
        if (escaped === undefined) throw createSyntaxError(source, index, '字符串转义未完成')
        value += escaped
        index += 2
        continue
      }
      value += source[index]
      index += 1
    }
    if (source[index] !== '"') throw createSyntaxError(source, start, '字符串缺少结束引号')
    index += 1
    return { kind: 'literal', value }
  }

  const parseBareLiteral = (): MacroLiteral => {
    const start = index
    while (index < source.length && !/[,;)\]\s]/.test(source[index])) index += 1
    const value = source.slice(start, index)
    if (!value) throw createSyntaxError(source, start, '此处需要参数')
    return { kind: 'literal', value }
  }

  /** 方括号仅是 CELL 的源码语法糖，AST 与编译阶段仍只处理稳定的 CELL 调用。 */
  const parseCellShorthand = (): MacroCall => {
    const start = index
    index += 1
    const argumentsList: MacroNode[] = []
    skipWhitespace()
    while (source[index] !== ']') {
      if (index >= source.length) throw createSyntaxError(source, start, 'CELL 简写缺少结束方括号')
      argumentsList.push(parseExpression())
      skipWhitespace()
      if (source[index] === ',') {
        index += 1
        skipWhitespace()
        continue
      }
      if (index >= source.length) throw createSyntaxError(source, start, 'CELL 简写缺少结束方括号')
      if (source[index] !== ']') throw createSyntaxError(source, index, 'CELL 简写参数之间必须使用逗号分隔')
    }
    index += 1

    if (argumentsList.length === 0) {
      throw createSyntaxError(source, start, 'CELL 简写至少需要首项文字')
    }

    const [firstArgument, ...remainingArguments] = argumentsList
    // 方括号的首项固定为单元格中心文字。裸文本只在这个明确位置补成 MM，避免把其他参数误当文字。
    const normalizedFirstArgument = firstArgument.kind === 'literal'
      ? { kind: 'call' as const, name: 'MM', arguments: [firstArgument] }
      : firstArgument
    if (normalizedFirstArgument.kind !== 'call' || normalizedFirstArgument.name !== 'MM') {
      throw createSyntaxError(source, start, 'CELL 简写首项必须是 MM(text) 或可省略 MM 的文字值')
    }

    for (const argument of remainingArguments) {
      if (argument.kind === 'literal' || (argument.kind === 'symbol' && !CELL_ZERO_ARGUMENT_SYMBOLS.has(argument.name))) {
        throw createSyntaxError(source, start, 'CELL 简写只有首项可以省略 MM；后续项必须写成完整宏调用')
      }
    }
    return { kind: 'call', name: 'CELL', arguments: [normalizedFirstArgument, ...remainingArguments] }
  }

  const parseExpression = (): MacroNode => {
    skipWhitespace()
    const start = index
    if (source[index] === '"') return parseQuotedLiteral()
    if (source[index] === '[') return parseCellShorthand()
    if (!isNameStart(source[index] ?? '')) return parseBareLiteral()
    while (isNamePart(source[index] ?? '')) index += 1
    const inputName = source.slice(start, index)
    const name = getCanonicalMacroName(inputName)
    skipWhitespace()
    if (source[index] !== '(') {
      // 语义样式 token 可以使用 division.subtraction-bar 这类含点的裸值。
      const nextCharacter = source[index]
      // 源码末尾、逗号、右括号、右方括号都是无参数宏的合法终止位置。
      if (nextCharacter !== undefined && !/[,);\]]|\s/.test(nextCharacter)) {
        index = start
        return parseBareLiteral()
      }
      const symbol: MacroSymbol = { kind: 'symbol', name }
      return symbol
    }
    index += 1
    const argumentsList: MacroNode[] = []
    skipWhitespace()
    while (source[index] !== ')') {
      if (index >= source.length) throw createSyntaxError(source, start, `${inputName} 缺少结束括号`)
      argumentsList.push(parseExpression())
      skipWhitespace()
      if (source[index] === ',') {
        index += 1
        skipWhitespace()
        continue
      }
      if (index >= source.length) throw createSyntaxError(source, start, `${inputName} 缺少结束括号`)
      if (source[index] !== ')') throw createSyntaxError(source, index, '参数之间必须使用逗号分隔')
    }
    index += 1
    return { kind: 'call', name, arguments: argumentsList }
  }

  const rootStatements: MacroNode[][] = []
  let statement: MacroNode[] = [parseExpression()]
  let usesRowShorthand = false
  skipWhitespace()
  while (index < source.length) {
    const separator = source[index]
    if (separator === ',') {
      index += 1
      skipWhitespace()
      if (index >= source.length) throw createSyntaxError(source, index - 1, '顶层宏后不能只有逗号')
      statement.push(parseExpression())
    } else if (separator === ';') {
      // 顶层分号是简写语法的行界：该行的节点会在下方自动包裹为 ROW。
      usesRowShorthand = true
      rootStatements.push(statement)
      index += 1
      skipWhitespace()
      if (index >= source.length) {
        statement = []
        break
      }
      statement = [parseExpression()]
    } else {
      throw createSyntaxError(source, index, '顶层宏之间必须使用逗号或分号分隔')
    }
    skipWhitespace()
  }
  if (statement.length > 0) rootStatements.push(statement)

  const rootExpressions = usesRowShorthand
    ? rootStatements.flatMap((nodes) => {
      const [node] = nodes
      // 保留显式结构命令，便于在简写中表达横线或继续兼容已有 ROW / GRID 源码。
      if (nodes.length === 1 && node.kind === 'call' && ['GRID', 'ROW', 'LINE'].includes(node.name)) return node
      if (nodes.length === 1 && node.kind === 'symbol' && node.name === 'LINE') return node
      // 分号行中的裸文本固定落在单元格正中，与 MM(text) 完全等价；显式宏则保持原样。
      return {
        kind: 'call' as const,
        name: 'ROW',
        arguments: nodes.map((item) => (
          item.kind === 'literal' ? { kind: 'call' as const, name: 'MM', arguments: [item] } : item
        )),
      }
    })
    : rootStatements.flat()

  const [root] = rootExpressions
  if (rootExpressions.length === 1 && root.kind === 'call' && root.name === 'GRID') return root
  // 没有 GRID 配置时，顶层 ROW / LINE 列表即是隐式 GRID 的子节点。
  return { kind: 'call', name: 'GRID', arguments: rootExpressions }
}
