import type { GridElement, GridPosition, GridStrikeContent, GridTextContent } from '@u1in/shushi-grid'
import type { MacroCall, MacroNode } from './types'
import { getMacroCall, getMacroValue, getPositiveNumber, splitMacroOptions } from './macro-ast'
import { resolveLineStyle } from './basic-macros'

/**
 * 语法糖宏是对基础 CELL 图元的便捷表达：定位文字、点、边框与厂字弯。
 * 它们不会引入新的 GridScene 契约，编译后全部还原为已有的通用位置与图元。
 */
export const SUGAR_MACRO_NAMES = [
  'LT',
  'MT',
  'RT',
  'ML',
  'MM',
  'MR',
  'LB',
  'MB',
  'RB',
  'RBL',
  'MTD',
  'DOT',
  'STRIKE',
  'STRIKEDOT',
  'BRACKET',
  'SQUARE',
  'TRIANGLE',
  'ROUND',
  'TBD',
  'RBD',
  'BBD',
  'LBD',
] as const

export const SUGAR_ZERO_ARGUMENT_MACROS = new Set([
  'TBD',
  'RBD',
  'BBD',
  'LBD',
  'BRACKET',
  'MTD',
  'SQUARE',
  'TRIANGLE',
  'ROUND',
  'STRIKE',
  'STRIKEDOT',
])

const POSITION_MACRO_NAMES = new Set([
  'LT',
  'MT',
  'RT',
  'ML',
  'MM',
  'MR',
  'LB',
  'MB',
  'RB',
  'RBL',
  'MTD',
  'SQUARE',
  'TRIANGLE',
  'ROUND',
])
const BORDER_MACRO_NAMES = new Set(['TBD', 'RBD', 'BBD', 'LBD'])
const ANNOTATION_FONT_SIZE_RATIO = 0.42
const FIXED_SYMBOL_TEXT: Readonly<Record<string, string>> = {
  SQUARE: '☐', // U+2610 BALLOT BOX
  TRIANGLE: '△',
  ROUND: '◯',
}
const FIXED_SYMBOL_FONT_SIZE_RATIOS: Readonly<Record<string, number>> = {
  // U+2610 的字形本身偏小，放大后仍以单元格中心为锚点，避免方框落到数字基线下方。
  SQUARE: 1.25,
}
export const BRACKET_TRACK_SIZE = 0.5
const BRACKET_RADIUS_RATIO = 1
export const BRACKET_STROKE_THICKNESS = 2

export interface SugarCellPlacement {
  column: number
  columnSpan: number
  styleToken?: string
}

/** MTD 等零参数定位宏在 AST 中是 symbol，这里统一按可省略括号的调用识别。 */
export const isPositionMacro = (node: MacroNode): boolean => {
  const call = getMacroCall(node, undefined, SUGAR_ZERO_ARGUMENT_MACROS)
  return call !== undefined && POSITION_MACRO_NAMES.has(call.name)
}

export type BorderMacroName = 'TBD' | 'RBD' | 'BBD' | 'LBD'

export const getBorderMacro = (node: MacroNode): (MacroCall & { name: BorderMacroName }) | undefined => {
  const call = getMacroCall(node, undefined, SUGAR_ZERO_ARGUMENT_MACROS)
  return call && BORDER_MACRO_NAMES.has(call.name) ? (call as MacroCall & { name: BorderMacroName }) : undefined
}

export const isBorderMacro = (node: MacroNode): boolean => getBorderMacro(node) !== undefined

export const getBracketMacro = (node: MacroNode): MacroCall | undefined =>
  getMacroCall(node, 'BRACKET', SUGAR_ZERO_ARGUMENT_MACROS)

export const isDotMacro = (node: MacroNode): boolean => node.kind === 'symbol' && node.name === 'DOT'

/** STRIKEDOT 与 DOT 同属零参数图元，但会额外生成独立的小数点删除线。 */
export const isStrikeDotMacro = (node: MacroNode): boolean => node.kind === 'symbol' && node.name === 'STRIKEDOT'

export const getStrikeMacro = (node: MacroNode): MacroCall | undefined =>
  getMacroCall(node, 'STRIKE', SUGAR_ZERO_ARGUMENT_MACROS)

const getFiniteNumber = (value: string | undefined, label: string, fallback: number): number => {
  if (value === undefined) return fallback
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) throw new Error(`${label} 必须是有限数字。`)
  return numericValue
}

/** 删除线的预设端点以单元格宽高比例表达；小数点预设允许略越过右边界。 */
const STRIKE_PRESETS = {
  // 以默认 0.68 跨度为基准，数字删除线按中心缩短约 10%。
  digit: { x1: 0.194, y1: 0.194, x2: 0.806, y2: 0.806 },
  // DOT 位于右侧边中点，小数点删除线按中心缩短为数字删除线的一半。
  decimal: { x1: 0.92, y1: 0.46, x2: 1.08, y2: 0.66 },
} as const

/** STRIKE 的端点可由调用方覆盖；普通 STRIKE 始终使用数字删除线预设。 */
const getStrikeContent = (call: MacroCall): GridStrikeContent => {
  const { content, options } = splitMacroOptions(call.arguments, SUGAR_ZERO_ARGUMENT_MACROS)
  if (content.length > 0) throw new Error('STRIKE 只接受 KV 配置，不接受文字或其他图元。')
  const allowedOptions = new Set(['style', 'color', 'thickness', 'x1', 'y1', 'x2', 'y2'])
  options.forEach((_, key) => {
    if (!allowedOptions.has(key)) throw new Error(`STRIKE 不支持 ${key} 配置。`)
  })
  const preset = STRIKE_PRESETS.digit
  const thickness = options.has('thickness')
    ? getPositiveNumber(options.get('thickness'), 'STRIKE 的 thickness', 2)
    : undefined
  return {
    kind: 'strike',
    // 预设始终从左上划向右下，避免与普通算式横线混淆。
    x1Ratio: getFiniteNumber(options.get('x1'), 'STRIKE 的 x1', preset.x1),
    y1Ratio: getFiniteNumber(options.get('y1'), 'STRIKE 的 y1', preset.y1),
    x2Ratio: getFiniteNumber(options.get('x2'), 'STRIKE 的 x2', preset.x2),
    y2Ratio: getFiniteNumber(options.get('y2'), 'STRIKE 的 y2', preset.y2),
    ...(options.has('color') ? { color: options.get('color') } : {}),
    ...(thickness === undefined ? {} : { thickness }),
  }
}

const getTextAlignment = (name: string): Pick<GridTextContent, 'horizontalAlign' | 'verticalAlign'> => {
  const alignments: Record<string, Pick<GridTextContent, 'horizontalAlign' | 'verticalAlign'>> = {
    LT: { horizontalAlign: 'left', verticalAlign: 'top' },
    MT: { horizontalAlign: 'center', verticalAlign: 'top' },
    RT: { horizontalAlign: 'right', verticalAlign: 'top' },
    ML: { horizontalAlign: 'left', verticalAlign: 'center' },
    MM: { horizontalAlign: 'center', verticalAlign: 'center' },
    MR: { horizontalAlign: 'right', verticalAlign: 'center' },
    LB: { horizontalAlign: 'left', verticalAlign: 'bottom' },
    MB: { horizontalAlign: 'center', verticalAlign: 'bottom' },
    RB: { horizontalAlign: 'right', verticalAlign: 'bottom' },
    MTD: { horizontalAlign: 'center', verticalAlign: 'top' },
    SQUARE: { horizontalAlign: 'center', verticalAlign: 'center' },
    TRIANGLE: { horizontalAlign: 'center', verticalAlign: 'center' },
    ROUND: { horizontalAlign: 'center', verticalAlign: 'center' },
  }
  const alignment = alignments[name]
  if (!alignment) throw new Error(`未知的单元格定位宏 ${name}。`)
  return alignment
}

/** 将语法糖单元格图元降级为通用 GridScene 元素。 */
export const compileSugarCellElement = (
  node: MacroNode,
  cell: SugarCellPlacement,
  row: number,
  id: number,
): GridElement | GridElement[] => {
  const literal = node.kind === 'literal' ? node : undefined
  const dot = isDotMacro(node)
  const strikeDot = isStrikeDotMacro(node)
  const call = literal || dot || strikeDot ? undefined : getMacroCall(node, undefined, SUGAR_ZERO_ARGUMENT_MACROS)
  if (!literal && !dot && !strikeDot && !call) throw new Error('单元格包含无法编译的内容。')
  if (strikeDot) {
    return [
      {
        id: `macro-text-${id}`,
        position: { kind: 'edgeMidpoint', column: cell.column, row, columnSpan: cell.columnSpan, edge: 'right' },
        content: {
          kind: 'text',
          text: '.',
          styleToken: cell.styleToken,
          horizontalAlign: 'center',
          verticalAlign: 'center',
        },
      },
      {
        id: `macro-strike-${id}`,
        position: { kind: 'cell', column: cell.column, row, columnSpan: cell.columnSpan },
        content: {
          kind: 'strike',
          x1Ratio: STRIKE_PRESETS.decimal.x1,
          y1Ratio: STRIKE_PRESETS.decimal.y1,
          x2Ratio: STRIKE_PRESETS.decimal.x2,
          y2Ratio: STRIKE_PRESETS.decimal.y2,
        },
        styleToken: cell.styleToken,
      },
    ]
  }
  const bracketCall = dot ? undefined : getBracketMacro(node)
  if (bracketCall) {
    if (bracketCall.arguments.length > 0) throw new Error('BRACKET 是零参数宏；请在 CELL 上设置样式配置。')
    return {
      id: `macro-bracket-${id}`,
      position: { kind: 'cell', column: cell.column, row, columnSpan: cell.columnSpan },
      content: {
        kind: 'corner',
        corner: 'bottomRight',
        radiusRatio: BRACKET_RADIUS_RATIO,
        thickness: BRACKET_STROKE_THICKNESS,
      },
      styleToken: cell.styleToken,
    }
  }
  const strikeCall = dot ? undefined : getStrikeMacro(node)
  if (strikeCall) {
    const { options } = splitMacroOptions(strikeCall.arguments, SUGAR_ZERO_ARGUMENT_MACROS)
    const resolvedStyleToken = options.get('style') ?? cell.styleToken
    return {
      id: `macro-strike-${id}`,
      position: { kind: 'cell', column: cell.column, row, columnSpan: cell.columnSpan },
      content: getStrikeContent(strikeCall),
      styleToken: resolvedStyleToken,
    }
  }
  const borderCall = dot ? undefined : getBorderMacro(node)
  if (borderCall) {
    const { content, options } = splitMacroOptions(borderCall.arguments, SUGAR_ZERO_ARGUMENT_MACROS)
    if (content.length > 1) throw new Error(`${borderCall.name} 最多接受一个 STYLE 参数。`)
    const edgeByName = { TBD: 'top', RBD: 'right', BBD: 'bottom', LBD: 'left' } as const
    const styleToken = options.get('style') ?? cell.styleToken
    const style = resolveLineStyle(content[0], styleToken)
    return {
      id: `macro-border-${id}`,
      position: {
        kind: 'edge',
        column: cell.column,
        row,
        columnSpan: cell.columnSpan,
        edge: edgeByName[borderCall.name],
      },
      content: { kind: 'line', ...style },
      styleToken,
    }
  }
  const name = dot ? 'RBL' : literal ? 'MM' : call?.name
  const isMiddleTopDot = name === 'MTD'
  const fixedSymbolText = name ? FIXED_SYMBOL_TEXT[name] : undefined
  const { content, options } = literal
    ? { content: [literal], options: new Map<string, string>() }
    : call
      ? splitMacroOptions(call.arguments, SUGAR_ZERO_ARGUMENT_MACROS)
      : { content: [], options: new Map<string, string>() }
  if (isMiddleTopDot && content.length > 0) throw new Error('MTD 是 MT(·) 的零参数简写，不接受文字参数。')
  if (fixedSymbolText !== undefined && content.length > 0) throw new Error(`${name} 是零参数符号宏，不接受文字参数。`)
  const text = dot
    ? '.'
    : isMiddleTopDot
      ? '·'
      : (fixedSymbolText ?? getMacroValue(content[0] ?? { kind: 'literal', value: '' }, `${name} 的文本`))
  if (!dot && !isMiddleTopDot && fixedSymbolText === undefined && content.length !== 1)
    throw new Error(`${name} 必须包含一个文本参数。`)
  // DOT 的默认颜色由 GRID(autoColor) 统一注入；关闭时不保留旧的蓝色 token，回退为黑色。
  const styleToken = options.get('style') ?? cell.styleToken
  const fixedSymbolFontSizeRatio = name ? FIXED_SYMBOL_FONT_SIZE_RATIOS[name] : undefined
  const usesDefaultBorrowDot = !options.has('fontSizeRatio') && (isMiddleTopDot || (name === 'MT' && text === '·'))
  const fontSizeRatio = options.has('fontSizeRatio')
    ? getPositiveNumber(options.get('fontSizeRatio'), `${name} 的 fontSizeRatio`, 1)
    : (fixedSymbolFontSizeRatio ??
      (dot || name === 'MM' || fixedSymbolText !== undefined || usesDefaultBorrowDot
        ? undefined
        : ANNOTATION_FONT_SIZE_RATIO))
  if (name === 'RBL') {
    const position: GridPosition = {
      kind: 'edgeMidpoint',
      column: cell.column,
      row,
      columnSpan: cell.columnSpan,
      edge: 'right',
    }
    return {
      id: `macro-text-${id}`,
      position,
      content: { kind: 'text', text, styleToken, fontSizeRatio, horizontalAlign: 'center', verticalAlign: 'center' },
    }
  }
  return {
    id: `macro-text-${id}`,
    position: { kind: 'cell', column: cell.column, row, columnSpan: cell.columnSpan },
    content: {
      kind: 'text',
      text,
      styleToken,
      fontSizeRatio,
      ...getTextAlignment(name ?? ''),
    },
  }
}
