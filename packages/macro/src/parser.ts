import type { MacroCall, MacroLiteral, MacroNode, MacroSymbol } from './types'

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
    while (index < source.length && !/[,)\s]/.test(source[index])) index += 1
    const value = source.slice(start, index)
    if (!value) throw createSyntaxError(source, start, '此处需要参数')
    return { kind: 'literal', value }
  }

  const parseExpression = (): MacroNode => {
    skipWhitespace()
    const start = index
    if (source[index] === '"') return parseQuotedLiteral()
    if (!isNameStart(source[index] ?? '')) return parseBareLiteral()
    while (isNamePart(source[index] ?? '')) index += 1
    const name = source.slice(start, index)
    skipWhitespace()
    if (source[index] !== '(') {
      // 语义样式 token 可以使用 division.subtraction-bar 这类含点的裸值。
      const nextCharacter = source[index]
      // 源码末尾与逗号、右括号一样都是无参数宏的合法终止位置。
      if (nextCharacter !== undefined && !/[,)]|\s/.test(nextCharacter)) {
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
      if (index >= source.length) throw createSyntaxError(source, start, `${name} 缺少结束括号`)
      argumentsList.push(parseExpression())
      skipWhitespace()
      if (source[index] === ',') {
        index += 1
        skipWhitespace()
        continue
      }
      if (index >= source.length) throw createSyntaxError(source, start, `${name} 缺少结束括号`)
      if (source[index] !== ')') throw createSyntaxError(source, index, '参数之间必须使用逗号分隔')
    }
    index += 1
    return { kind: 'call', name, arguments: argumentsList }
  }

  const rootExpressions: MacroNode[] = [parseExpression()]
  skipWhitespace()
  while (index < source.length) {
    if (source[index] !== ',') throw createSyntaxError(source, index, '顶层宏之间必须使用逗号分隔')
    index += 1
    skipWhitespace()
    if (index >= source.length) throw createSyntaxError(source, index - 1, '顶层宏后不能只有逗号')
    rootExpressions.push(parseExpression())
    skipWhitespace()
  }

  const [root] = rootExpressions
  if (rootExpressions.length === 1 && root.kind === 'call' && root.name === 'GRID') return root
  // 没有 GRID 配置时，顶层 ROW / LINE 列表即是隐式 GRID 的子节点。
  return { kind: 'call', name: 'GRID', arguments: rootExpressions }
}
