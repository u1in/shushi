import type { MacroCall, MacroNode } from './types'
import { parseMacro } from './parser'
import { getShortestMacroName } from './macro-aliases'
import { BASIC_ZERO_ARGUMENT_MACROS } from './basic-macros'
import { SUGAR_ZERO_ARGUMENT_MACROS } from './sugar-macros'

const INDENT = '  '
const MINIFIED_ZERO_ARGUMENT_MACROS = new Set([...BASIC_ZERO_ARGUMENT_MACROS, ...SUGAR_ZERO_ARGUMENT_MACROS])

interface MacroKv {
  key: string
  value: string
}

interface GridMinifyContext {
  trackUnit: 'full' | 'half'
  hasDivider: boolean
}

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
  return elidedText ?? serializeNode(node, {
    usesCellShorthand,
    useShortestNames: true,
    omitZeroArgumentParentheses: true,
  })
}

/** 方括号首项可承载文字或完整图元宏；纯进位单元格可由 CELL(RB(1)) 缩为 [RB(1)]。 */
const canUseCellShorthand = (node: MacroCall): boolean => {
  const [firstArgument] = node.arguments
  if (firstArgument?.kind === 'literal' || firstArgument?.kind === 'call') return true
  return firstArgument?.kind === 'symbol' && ['DOT', 'MTD', 'BRACKET', 'TBD', 'RBD', 'BBD', 'LBD'].includes(firstArgument.name)
}

/** 读取简单 KV 的键值；复杂表达式不参与自动省略，避免压缩器误判。 */
const readMacroKv = (node: MacroNode): MacroKv | undefined => {
  if (node.kind !== 'call' || node.name !== 'KV' || node.arguments.length !== 2) return undefined
  const readValue = (value: MacroNode): string | undefined => {
    if (value.kind === 'literal') return value.value
    if (value.kind === 'symbol') return value.name
    return undefined
  }
  const key = readValue(node.arguments[0])
  const value = readValue(node.arguments[1])
  return key === undefined || value === undefined ? undefined : { key, value }
}

const isMacroCall = (node: MacroNode, name: string): node is MacroCall => node.kind === 'call' && node.name === name

/** 这些单图元在 ROW 中本来就可独立作为一个单元格，最简化时无需保留无配置的 CELL 外壳。 */
const CELL_ELIDABLE_CALLS = new Set(['LT', 'MT', 'RT', 'ML', 'MM', 'MR', 'LB', 'MB', 'RB', 'RBL', 'MTD', 'BRACKET'])
const CELL_ELIDABLE_SYMBOLS = new Set(['DOT', 'MTD', 'BRACKET'])

const canElideSingletonCell = (node: MacroNode): boolean => (
  node.kind === 'call' && CELL_ELIDABLE_CALLS.has(node.name)
  || node.kind === 'symbol' && CELL_ELIDABLE_SYMBOLS.has(node.name)
)

const getOptionValue = (nodes: MacroNode[], key: string): string | undefined => (
  nodes.map(readMacroKv).find((option) => option?.key === key)?.value
)

const isPositiveInteger = (value: string | undefined): value is string => value !== undefined && /^[1-9]\d*$/u.test(value)

const isPositiveNumber = (value: string | undefined): value is string => value !== undefined && Number.isFinite(Number(value)) && Number(value) > 0

/** 计算当前 GRID 的最长行，供最简式判断 columns 是否已经可以由结构推导。 */
const inferGridColumns = (nodes: MacroNode[], trackUnit: 'full' | 'half'): number | undefined => {
  const rowWidths = nodes.filter((node): node is MacroCall => isMacroCall(node, 'ROW')).map((row) => row.arguments
    .filter((child) => readMacroKv(child) === undefined)
    .reduce((width, child) => {
      const cellCall = isMacroCall(child, 'CELL') || isMacroCall(child, 'EMPTY') ? child : undefined
      const defaultSpan = trackUnit === 'half' ? 2 : 1
      const span = getOptionValue(cellCall?.arguments ?? [], 'columnSpan')
      if (isMacroCall(child, 'BRACKET') || child.kind === 'symbol' && child.name === 'BRACKET') return width + 1
      return width + (isPositiveInteger(span) ? Number(span) : defaultSpan)
    }, 0))
  return rowWidths.length > 0 ? Math.max(...rowWidths) : undefined
}

const hasDividerRow = (nodes: MacroNode[]): boolean => nodes.some((node) => (
  isMacroCall(node, 'ROW') && node.arguments.some((child) => (
    isMacroCall(child, 'DIV') || child.kind === 'symbol' && child.name === 'DIV'
  ))
))

/** 删除宿主宏已定义的默认配置，同时保留所有非默认的视觉与布局配置。 */
const filterDefaultOptions = (
  nodes: MacroNode[],
  defaults: Readonly<Record<string, string>>,
  extraFilter?: (option: MacroKv) => boolean,
): MacroNode[] => nodes.filter((node) => {
  const option = readMacroKv(node)
  if (!option) return true
  if (extraFilter?.(option)) return false
  return defaults[option.key] !== option.value
})

const pruneMinifyNode = (node: MacroNode, context: GridMinifyContext): MacroNode => {
  if (node.kind !== 'call') return node
  if (node.name === 'GRID') return pruneGridNode(node)
  if (node.name === 'ROW') {
    return {
      ...node,
      arguments: filterDefaultOptions(node.arguments, { align: 'right' }).map((child) => pruneMinifyNode(child, context)),
    }
  }
  // 横线的共同跨度需要在 GRID 层归并，不能在这里按旧的 previous 默认值提前删除。
  if (node.name === 'LINE') return { ...node, arguments: node.arguments.map((child) => pruneMinifyNode(child, context)) }
  if (node.name === 'CELL' || node.name === 'EMPTY') {
    const hasBracket = node.arguments.some((child) => isMacroCall(child, 'BRACKET') || child.kind === 'symbol' && child.name === 'BRACKET')
    const defaultSpan = hasBracket || context.hasDivider ? 1 : context.trackUnit === 'half' ? 2 : 1
    const argumentsList = filterDefaultOptions(node.arguments, { columnSpan: String(defaultSpan) }).map((child) => pruneMinifyNode(child, context))
    // CELL 只包裹一个本可直接放进 ROW 的图元时不提供额外语义；例如 [1] → 1、[RB(1)] → RB(1)。
    if (node.name === 'CELL' && argumentsList.length === 1 && canElideSingletonCell(argumentsList[0])) return argumentsList[0]
    return {
      ...node,
      arguments: argumentsList,
    }
  }
  if (node.name === 'STYLE') {
    return {
      ...node,
      arguments: filterDefaultOptions(node.arguments, { thickness: '2' }).map((child) => pruneMinifyNode(child, context)),
    }
  }
  return {
    ...node,
    arguments: node.arguments.map((child) => pruneMinifyNode(child, context)),
  }
}

const pruneGridNode = (root: MacroCall): MacroCall => {
  const gridOptions = root.arguments.map(readMacroKv).filter((option): option is MacroKv => option !== undefined)
  const content = root.arguments.filter((node) => readMacroKv(node) === undefined)
  const hasDivider = hasDividerRow(content)
  const trackUnit = gridOptions.find(({ key }) => key === 'trackUnit')?.value === 'half' ? 'half' : 'full'
  const inferredColumns = inferGridColumns(content, trackUnit)
  const resolvedUnitWidth = Number(getOptionValue(root.arguments, 'unitWidth') ?? 30)
  const resolvedFontSizeRatio = Number(getOptionValue(root.arguments, 'fontSizeRatio') ?? 1)
  const defaultAriaLabel = hasDivider ? '短除法宏公式预览' : '宏公式预览'
  const gridDefaults: Readonly<Record<string, string>> = {
    autoColor: 'true',
    unitWidth: '30',
    unitHeight: '46',
    fontSizeRatio: '1',
    showGrid: 'false',
    showGuideGrid: 'false',
    trackUnit: 'full',
    ariaLabel: defaultAriaLabel,
  }
  const filteredOptions = root.arguments.filter((node) => {
    const option = readMacroKv(node)
    if (!option) return false
    // lineSpan 在过滤完所有 LINE 后统一决定，避免根配置与行级配置重复。
    if (option.key === 'lineSpan') return false
    if (option.key === 'columns' && (hasDivider || isPositiveInteger(option.value) && Number(option.value) === inferredColumns)) return false
    if (option.key === 'paddingX' && getOptionValue(root.arguments, 'padding') === undefined && option.value === '20') return false
    if (option.key === 'paddingY' && getOptionValue(root.arguments, 'padding') === undefined && option.value === '12') return false
    if (option.key === 'fontSize' && isPositiveNumber(option.value) && Number(option.value) === resolvedUnitWidth * resolvedFontSizeRatio) return false
    if ((option.key === 'showGrid' || option.key === 'showGuideGrid') && (getOptionValue(root.arguments, 'showGrid') ?? getOptionValue(root.arguments, 'showGuideGrid')) === 'false') return false
    if (hasDivider && option.key === 'trackUnit') return false
    return gridDefaults[option.key] !== option.value
  }).map((node) => pruneMinifyNode(node, { trackUnit, hasDivider }))
  const filteredContent = content.map((node) => pruneMinifyNode(node, { trackUnit, hasDivider }))
  const lineNodes = filteredContent.filter((node): node is MacroCall => isMacroCall(node, 'LINE'))
  const configuredLineSpan = getOptionValue(root.arguments, 'lineSpan')
  const fallbackLineSpan = configuredLineSpan ?? (lineNodes.length === 1 ? 'full' : 'previous')
  const resolvedColumns = Math.max(inferredColumns ?? 0, Number(getOptionValue(root.arguments, 'columns') ?? 0))
  const getLineSpan = (line: MacroCall): string => getOptionValue(line.arguments, 'span') ?? fallbackLineSpan
  const replaceLineSpan = (line: MacroCall, span: string | undefined): MacroCall => {
    const argumentsWithoutSpan = line.arguments.filter((argument) => readMacroKv(argument)?.key !== 'span')
    if (span === undefined) return { ...line, arguments: argumentsWithoutSpan }
    return {
      ...line,
      arguments: [...argumentsWithoutSpan, {
        kind: 'call',
        name: 'KV',
        arguments: [{ kind: 'literal', value: 'span' }, { kind: 'literal', value: span }],
      }],
    }
  }
  const resolvedLineSpans = lineNodes.map(getLineSpan)
  const sharedLineSpan = lineNodes.length > 1 && resolvedLineSpans.length > 0 && resolvedLineSpans.every((span) => span === resolvedLineSpans[0])
    ? resolvedLineSpans[0]
    : undefined
  const canElideSinglePreviousSpan = (line: MacroCall): boolean => {
    const lineIndex = filteredContent.indexOf(line)
    const previousRow = filteredContent.slice(0, lineIndex).reverse().find((node): node is MacroCall => isMacroCall(node, 'ROW'))
    return previousRow !== undefined && inferGridColumns([previousRow], trackUnit) === resolvedColumns
  }
  const normalizedContent = filteredContent.map((node) => {
    if (!isMacroCall(node, 'LINE')) return node
    const span = getLineSpan(node)
    if (lineNodes.length === 1) {
      const canUseSingleLineDefault = span === 'full' || span === 'previous' && canElideSinglePreviousSpan(node)
      return replaceLineSpan(node, canUseSingleLineDefault ? undefined : span)
    }
    if (sharedLineSpan !== undefined) return replaceLineSpan(node, undefined)
    return replaceLineSpan(node, span === 'previous' ? undefined : span)
  })
  const normalizedOptions: MacroNode[] = sharedLineSpan !== undefined && sharedLineSpan !== 'previous'
    ? [...filteredOptions, {
      kind: 'call',
      name: 'KV',
      arguments: [{ kind: 'literal', value: 'lineSpan' }, { kind: 'literal', value: sharedLineSpan }],
    }]
    : filteredOptions
  return { ...root, arguments: [...normalizedOptions, ...normalizedContent] }
}

/** 分号行无法承载 ROW 的非默认对齐配置，保留显式 GRID 以避免生成不可编译的源码。 */
const canUseTopLevelRowShorthand = (root: MacroCall): boolean => root.arguments.every((node) => (
  !isMacroCall(node, 'ROW') || getOptionValue(node.arguments, 'align') === undefined || getOptionValue(node.arguments, 'align') === 'right'
))

interface MacroSerializeOptions {
  usesCellShorthand: boolean
  useShortestNames: boolean
  omitZeroArgumentParentheses: boolean
}

const getMacroName = (name: string, useShortestNames: boolean): string => (
  useShortestNames ? getShortestMacroName(name) : name
)

const serializeNode = (
  node: MacroNode,
  options: MacroSerializeOptions = {
    usesCellShorthand: false,
    useShortestNames: true,
    omitZeroArgumentParentheses: true,
  },
): string => {
  if (node.kind === 'literal') return serializeLiteral(node.value)
  if (node.kind === 'symbol') return getMacroName(node.name, options.useShortestNames)
  const name = getMacroName(node.name, options.useShortestNames)
  if (node.arguments.length === 0 && options.omitZeroArgumentParentheses && MINIFIED_ZERO_ARGUMENT_MACROS.has(node.name)) return name
  if (options.usesCellShorthand && node.name === 'CELL' && canUseCellShorthand(node)) {
    return `[${node.arguments.map((argument, index) => serializeCellArgument(argument, index, true)).join(',')}]`
  }
  return `${name}(${node.arguments.map((argument) => serializeNode(argument, options)).join(',')})`
}

const canInlineCall = (node: MacroCall): boolean => node.arguments.every((argument) => argument.kind !== 'call')

/** 将简单参数保持在一行，包含嵌套函数的调用则按参数逐行展开并增加缩进。 */
const formatNode = (
  node: MacroNode,
  level: number,
  options: MacroSerializeOptions = {
    usesCellShorthand: false,
    useShortestNames: true,
    omitZeroArgumentParentheses: true,
  },
): string => {
  if (node.kind !== 'call') return serializeNode(node, options)
  const name = getMacroName(node.name, options.useShortestNames)
  if (options.usesCellShorthand && node.name === 'CELL' && canUseCellShorthand(node)) {
    return `[${node.arguments.map((argument, index) => serializeCellArgument(argument, index, true)).join(', ')}]`
  }
  if (node.arguments.length === 0) return options.omitZeroArgumentParentheses ? name : `${name}()`
  if (canInlineCall(node)) return `${name}(${node.arguments.map((argument) => serializeNode(argument, options)).join(', ')})`

  const childIndent = INDENT.repeat(level + 1)
  const closingIndent = INDENT.repeat(level)
  return `${name}(\n${node.arguments.map((argument) => `${childIndent}${formatNode(argument, level + 1, options)}`).join(',\n')}\n${closingIndent})`
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
const formatRowShorthand = (root: MacroCall, pretty: boolean, options: MacroSerializeOptions): string => root.arguments
  .map((node) => {
    const row = node.kind === 'call' && node.name === 'ROW' ? node.arguments : [node]
    return pretty
      ? row.map((child) => getElidableMiddleText(child) ?? formatNode(child, 0, options)).join(', ')
      : row.map((child) => getElidableMiddleText(child) ?? serializeNode(child, options)).join(',')
  })
  .join(pretty ? ';\n' : ';')
  .concat(';')

const formatRoot = (
  root: MacroCall,
  source: string,
  pretty: boolean,
  options?: Partial<MacroSerializeOptions>,
): string => {
  const serializeOptions: MacroSerializeOptions = {
    usesCellShorthand: hasCellShorthand(source),
    useShortestNames: true,
    omitZeroArgumentParentheses: !pretty,
    ...options,
  }
  if (options?.useShortestNames === false) {
    return formatNode(root, 0, serializeOptions)
  }
  if (!hasExplicitGrid(source) && hasTopLevelSemicolon(source)) {
    return formatRowShorthand(root, pretty, serializeOptions)
  }
  const nodes = hasExplicitGrid(source) ? [root] : root.arguments
  if (!pretty) return nodes.map((node) => serializeNode(node, serializeOptions)).join(',')
  return nodes.map((node) => formatNode(node, 0, serializeOptions)).join(',\n')
}

/**
 * 最简化时允许把没有生效 GRID 配置的根节点降级为顶层分号行。
 * 仍然生效的场景级配置或 ROW 非默认对齐会保留显式 GRID，避免生成不可编译的源码。
 */
const minifyRoot = (root: MacroCall, source: string, omitDefaults = false): string => {
  const normalizedRoot = omitDefaults ? pruneGridNode(root) : root
  const hasGridOptions = normalizedRoot.arguments.some((node) => node.kind === 'call' && node.name === 'KV')
  if (hasExplicitGrid(source) && !hasGridOptions && normalizedRoot.arguments.length > 0 && canUseTopLevelRowShorthand(normalizedRoot)) {
    return formatRowShorthand(normalizedRoot, false, { usesCellShorthand: true, useShortestNames: true, omitZeroArgumentParentheses: true })
  }
  if (!hasExplicitGrid(source) && hasTopLevelSemicolon(source)) return formatRowShorthand(normalizedRoot, false, { usesCellShorthand: true, useShortestNames: true, omitZeroArgumentParentheses: true })
  const options = { usesCellShorthand: true, useShortestNames: true, omitZeroArgumentParentheses: true }
  return (hasExplicitGrid(source) ? serializeNode(normalizedRoot, options) : normalizedRoot.arguments.map((node) => serializeNode(node, options)).join(','))
}

/** 直接序列化 AST 时不保留输入风格，始终选择可用的最简表达。 */
export const minifyMacroAst = (root: MacroCall, omitDefaults = true): string => {
  const normalizedRoot = omitDefaults ? pruneGridNode(root) : root
  const hasGridOptions = normalizedRoot.arguments.some((node) => node.kind === 'call' && node.name === 'KV')
  return hasGridOptions || !canUseTopLevelRowShorthand(normalizedRoot)
    ? serializeNode(normalizedRoot, { usesCellShorthand: true, useShortestNames: true, omitZeroArgumentParentheses: true })
    : formatRowShorthand(normalizedRoot, false, { usesCellShorthand: true, useShortestNames: true, omitZeroArgumentParentheses: true })
}

/**
 * 计算器导出的宏不应携带网页朗读文案或仅供页面着色的语义 token。
 * 保留尺寸、辅助网格等会影响可见几何的配置，确保粘贴到宏实验的宏源码框仍可复刻当前竖式。
 */
const removeCopyOnlyOptions = (node: MacroNode): MacroNode => {
  if (node.kind !== 'call') return node
  return {
    ...node,
    arguments: node.arguments
      .filter((argument) => {
        const option = readMacroKv(argument)
        return option?.key !== 'ariaLabel' && option?.key !== 'style'
      })
      .map(removeCopyOnlyOptions),
  }
}

/** 生成适合复制到宏实验的宏源码框的最简 AST 宏，移除页面专属朗读和样式配置。 */
export const minifyMacroForCopyAst = (root: MacroCall): string => {
  const cleanedRoot = removeCopyOnlyOptions(root)
  if (cleanedRoot.kind !== 'call') throw new Error('复制宏的根节点必须是 GRID(...)。')
  return minifyMacroAst(cleanedRoot)
}

/** 将已更新的 AST 按调用方选择的输入框风格重新输出，并保留源码原本的 GRID/分号行外层形式。 */
export const formatMacroAst = (root: MacroCall, style: 'formatted' | 'minified' = 'formatted', source = 'GRID('): string => (
  style === 'minified' ? minifyMacroAst(root) : formatRoot(root, source, true)
)

/** 将宏源码解析为 AST 后按函数层级格式化，保留显式或隐式 GRID 的写法。 */
export const formatMacro = (source: string): string => formatRoot(parseMacro(source), source, true)

/** 将源码压成单行但保留原有的完整/简写结构，不省略默认配置或语法糖层级。 */
export const unformatMacro = (source: string): string => formatRoot(parseMacro(source), source, false)

/** 将源码展开为显式 GRID、ROW、CELL 与完整宏名，供“完整形式”按钮使用。 */
export const completeMacro = (source: string): string => formatRoot(parseMacro(source), source, true, {
  usesCellShorthand: false,
  useShortestNames: false,
  omitZeroArgumentParentheses: false,
})

/** 将完整宏源码压缩为最简合法写法，并在可行时降级为分号行与方括号语法糖。 */
export const minifyMacro = (source: string, omitDefaults = true): string => minifyRoot(parseMacro(source), source, omitDefaults)

/** 生成适合复制到宏实验的宏源码框的最简源码；由计算器页面统一调用，避免各页面自行裁剪字符串。 */
export const minifyMacroForCopy = (source: string): string => minifyMacroForCopyAst(parseMacro(source))

