import type { GridElement, GridPosition, GridTextContent } from '@vertical-arithmetic/grid'
import type { MacroCall, MacroNode } from './types'
import { getMacroCall, getMacroValue, getPositiveNumber, splitMacroOptions } from './macro-ast'
import { resolveLineStyle } from './basic-macros'

/**
 * 语法糖宏是对基础 CELL 图元的便捷表达：定位文字、点、边框与厂字弯。
 * 它们不会引入新的 GridScene 契约，编译后全部还原为已有的通用位置与图元。
 */
export const SUGAR_MACRO_NAMES = [
  'LT', 'MT', 'RT', 'ML', 'MM', 'MR', 'LB', 'MB', 'RB', 'RBL',
  'MTD', 'DOT', 'BRACKET', 'TBD', 'RBD', 'BBD', 'LBD',
] as const

export const SUGAR_ZERO_ARGUMENT_MACROS = new Set(['TBD', 'RBD', 'BBD', 'LBD', 'BRACKET', 'MTD'])

const POSITION_MACRO_NAMES = new Set(['LT', 'MT', 'RT', 'ML', 'MM', 'MR', 'LB', 'MB', 'RB', 'RBL', 'MTD'])
const BORDER_MACRO_NAMES = new Set(['TBD', 'RBD', 'BBD', 'LBD'])
const ANNOTATION_FONT_SIZE_RATIO = 0.42
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
  return call && BORDER_MACRO_NAMES.has(call.name) ? call as MacroCall & { name: BorderMacroName } : undefined
}

export const isBorderMacro = (node: MacroNode): boolean => getBorderMacro(node) !== undefined

export const getBracketMacro = (node: MacroNode): MacroCall | undefined => (
  getMacroCall(node, 'BRACKET', SUGAR_ZERO_ARGUMENT_MACROS)
)

export const isDotMacro = (node: MacroNode): boolean => node.kind === 'symbol' && node.name === 'DOT'

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
): GridElement => {
  const dot = isDotMacro(node)
  const call = dot ? undefined : getMacroCall(node, undefined, SUGAR_ZERO_ARGUMENT_MACROS)
  if (!dot && !call) throw new Error('单元格包含无法编译的内容。')
  const bracketCall = dot ? undefined : getBracketMacro(node)
  if (bracketCall) {
    if (bracketCall.arguments.length > 0) throw new Error('BRACKET 是零参数宏；请在 CELL 上设置样式配置。')
    return {
      id: `macro-bracket-${id}`,
      position: { kind: 'cell', column: cell.column, row, columnSpan: cell.columnSpan },
      content: { kind: 'corner', corner: 'bottomRight', radiusRatio: BRACKET_RADIUS_RATIO, thickness: BRACKET_STROKE_THICKNESS },
      styleToken: cell.styleToken,
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
      position: { kind: 'edge', column: cell.column, row, columnSpan: cell.columnSpan, edge: edgeByName[borderCall.name] },
      content: { kind: 'line', ...style },
      styleToken,
    }
  }
  const name = dot ? 'RBL' : call?.name
  const isMiddleTopDot = name === 'MTD'
  const { content, options } = call ? splitMacroOptions(call.arguments, SUGAR_ZERO_ARGUMENT_MACROS) : { content: [], options: new Map<string, string>() }
  if (isMiddleTopDot && content.length > 0) throw new Error('MTD 是 MT(·) 的零参数简写，不接受文字参数。')
  const text = dot ? '.' : isMiddleTopDot ? '·' : getMacroValue(content[0] ?? { kind: 'literal', value: '' }, `${name} 的文本`)
  if (!dot && !isMiddleTopDot && content.length !== 1) throw new Error(`${name} 必须包含一个文本参数。`)
  // DOT 的默认颜色由 GRID(autoColor) 统一注入；关闭时不保留旧的蓝色 token，回退为黑色。
  const styleToken = options.get('style') ?? cell.styleToken
  const fontSizeRatio = options.has('fontSizeRatio')
    ? getPositiveNumber(options.get('fontSizeRatio'), `${name} 的 fontSizeRatio`, 1)
    : dot || name === 'MM' ? undefined : ANNOTATION_FONT_SIZE_RATIO
  if (name === 'RBL') {
    const position: GridPosition = { kind: 'edgeMidpoint', column: cell.column, row, columnSpan: cell.columnSpan, edge: 'right' }
    return {
      id: `macro-text-${id}`,
      position,
      content: { kind: 'text', text, styleToken, fontSizeRatio, horizontalAlign: 'center', verticalAlign: 'center' },
    }
  }
  return {
    id: `macro-text-${id}`,
    position: { kind: 'cell', column: cell.column, row, columnSpan: cell.columnSpan },
    content: { kind: 'text', text, styleToken, fontSizeRatio, ...getTextAlignment(name ?? '') },
  }
}
