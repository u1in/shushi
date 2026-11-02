import type { GridElement, GridLineContent, GridScene } from '@vertical-arithmetic/grid'
import type { MacroCall, MacroNode, MacroStyle } from './types'
import {
  AUTO_COLOR_MAX_ROWS,
  AUTO_COLOR_THEME,
  getAutoBorrowColor,
  getAutoCarryColor,
  getAutoOperatorColor,
  getAutoRowTextColor,
} from './auto-color-theme'
import { BASIC_ZERO_ARGUMENT_MACROS, resolveLineStyle } from './basic-macros'
import { getBoolean, getMacroCall, getMacroValue, getPositiveInteger, getPositiveNumber, splitMacroOptions } from './macro-ast'
import {
  BRACKET_STROKE_THICKNESS,
  BRACKET_TRACK_SIZE,
  compileSugarCellElement,
  getBracketMacro,
  isBorderMacro,
  isDotMacro,
  isPositionMacro,
  SUGAR_ZERO_ARGUMENT_MACROS,
} from './sugar-macros'

interface MacroCompileDefaults {
  unitWidth: number
  unitHeight: number
  fontSizeRatio: number
  horizontalPadding: number
  verticalPadding: number
  showGuideGrid: boolean
}

interface NormalizedCell {
  elements: MacroNode[]
  columnSpan: number
  styleToken?: string
  /** 厂字弯所在轨道可缩窄，但仍然是一个真实可见列。 */
  trackSize?: number
}

interface NormalizedRow {
  cells: NormalizedCell[]
  align: 'left' | 'right'
}

interface NormalizedLine {
  afterRow: number
  span: 'previous' | 'longest' | 'full'
  style: MacroStyle
  styleToken?: string
}

interface PositionedCell extends NormalizedCell {
  column: number
}

/** DIV 行在编译时才展开为半格轨道、竖线和本行横线。 */
interface NormalizedShortDivisionRow {
  divisor?: NormalizedCell
  valueGroups: NormalizedCell[][]
}

const DEFAULTS: MacroCompileDefaults = {
  // 与首页四则运算器一致：30px 数字格、46px 行高、1.00 字号比例及 20×12px 留白。
  unitWidth: 30,
  unitHeight: 46,
  fontSizeRatio: 1,
  horizontalPadding: 20,
  verticalPadding: 12,
  showGuideGrid: false,
}

/** 汇总两层允许省略括号的宏，保证嵌套解析的规则一致。 */
const ZERO_ARGUMENT_MACROS = new Set([...BASIC_ZERO_ARGUMENT_MACROS, ...SUGAR_ZERO_ARGUMENT_MACROS])

const getCall = (node: MacroNode, name?: string): MacroCall | undefined => (
  getMacroCall(node, name, ZERO_ARGUMENT_MACROS)
)

const splitOptions = (nodes: MacroNode[]): { content: MacroNode[], options: Map<string, string> } => (
  splitMacroOptions(nodes, ZERO_ARGUMENT_MACROS)
)

const readCell = (node: MacroNode, defaultColumnSpan = 1): NormalizedCell => {
  const cellCall = getCall(node, 'CELL')
  const emptyCall = getCall(node, 'EMPTY')
  const valueNodes = cellCall?.arguments ?? emptyCall?.arguments
  if (!valueNodes) {
    if (getBracketMacro(node)) return { elements: [node], columnSpan: 1, trackSize: BRACKET_TRACK_SIZE }
    if (isPositionMacro(node) || isDotMacro(node)) {
      return { elements: [node], columnSpan: defaultColumnSpan }
    }
    throw new Error('ROW 只能包含 CELL、EMPTY、定位宏或 DOT。')
  }
  const { content, options } = splitOptions(valueNodes)
  const columnSpan = getPositiveInteger(options.get('columnSpan'), 'CELL 的 columnSpan', defaultColumnSpan)
  const styleToken = options.get('style')
  if (emptyCall && content.length > 0) throw new Error('EMPTY 只能包含配置，不能包含单元格图元。')
  const bracketCount = content.filter((child) => getBracketMacro(child)).length
  if (bracketCount > 0 && (bracketCount !== 1 || content.length !== 1 || columnSpan !== 1)) {
    throw new Error('BRACKET 必须独占一个 columnSpan 为 1 的 CELL。')
  }
  content.forEach((child) => {
    if (!isPositionMacro(child) && !isBorderMacro(child) && !getBracketMacro(child) && !isDotMacro(child)) {
      throw new Error('CELL 内只能包含定位宏、边框宏、BRACKET、DOT 或 KV 配置。')
    }
  })
  return { elements: content, columnSpan, styleToken, trackSize: bracketCount > 0 ? BRACKET_TRACK_SIZE : undefined }
}

const readRow = (node: MacroCall, defaultColumnSpan = 1): NormalizedRow => {
  const { content, options } = splitOptions(node.arguments)
  const align = options.get('align') ?? 'right'
  if (align !== 'left' && align !== 'right') throw new Error('ROW 的 align 只能是 left 或 right。')
  if (content.length === 0) throw new Error('ROW 至少需要一个单元格。')
  return { cells: content.map((child) => readCell(child, defaultColumnSpan)), align }
}

/** VALUE 只表达一个右侧数值组；逐位展开使编译器能计算各组的共同右边界。 */
const readValueGroup = (node: MacroNode): NormalizedCell[] => {
  const valueCall = getCall(node, 'VALUE')
  if (!valueCall) throw new Error('短除法 DIV 右侧和底行只能包含 VALUE(...)。')
  const { content, options } = splitOptions(valueCall.arguments)
  if (options.size > 0 || content.length !== 1) throw new Error('VALUE 必须且只能包含一个数值文本，不能设置 KV。')
  const value = getMacroValue(content[0], 'VALUE 的数值')
  const digits = [...value]
  if (digits.length === 0) throw new Error('VALUE 不能为空。')
  return digits.map((digit) => readCell({ kind: 'call', name: 'MM', arguments: [{ kind: 'literal', value: digit }] }, 2))
}

/**
 * DIV 是 ROW 的结构分界，不占用自身轨道：左侧是一个除数单元格，右侧是一个或多个 VALUE 数值组。
 * 无 DIV 的 ROW 仅用于最终商 / 底行，仍使用相同数值组以便与过程行对齐。
 */
const readShortDivisionRow = (node: MacroCall): NormalizedShortDivisionRow => {
  const { content, options } = splitOptions(node.arguments)
  if (options.size > 0) throw new Error('包含 DIV 的短除法 ROW 不支持 KV 配置。')
  const dividerIndices = content.flatMap((child, index) => getCall(child, 'DIV') ? [index] : [])
  if (dividerIndices.length > 1) throw new Error('短除法 ROW 最多只能包含一个 DIV。')
  if (dividerIndices.length === 0) {
    if (content.length === 0) throw new Error('短除法底行至少需要一个 VALUE。')
    return { valueGroups: content.map(readValueGroup) }
  }
  const dividerIndex = dividerIndices[0]
  const left = content.slice(0, dividerIndex)
  const right = content.slice(dividerIndex + 1)
  const dividerCall = getCall(content[dividerIndex], 'DIV')
  if (dividerCall?.arguments.length !== 0) throw new Error('DIV 是零参数宏。')
  if (left.length !== 1) throw new Error('短除法 DIV 左侧必须恰有一个除数单元格。')
  if (right.length === 0) throw new Error('短除法 DIV 右侧至少需要一个 VALUE。')
  return { divisor: readCell(left[0], 2), valueGroups: right.map(readValueGroup) }
}

const readLine = (node: MacroCall, afterRow: number): NormalizedLine => {
  const { content, options } = splitOptions(node.arguments)
  const styleNode = content.at(0)
  if (content.length > 1) throw new Error('LINE 最多接受一个 STYLE 参数，其余请用 KV 配置。')
  const span = options.get('span') ?? 'previous'
  if (span !== 'previous' && span !== 'longest' && span !== 'full') {
    throw new Error('LINE 的 span 只能是 previous、longest 或 full。')
  }
  const styleToken = options.get('style')
  const style = resolveLineStyle(styleNode, styleToken)
  return { afterRow, span, style, styleToken }
}

const getLineRange = (
  span: NormalizedLine['span'],
  row: PositionedCell[],
  allRows: PositionedCell[][],
  columns: number,
): { start: number, end: number } => {
  if (span === 'full') return { start: 0, end: columns }
  const rows = span === 'previous' ? [row] : allRows
  const nonEmptyCells = rows.flat()
  if (nonEmptyCells.length === 0) throw new Error('LINE 找不到可确定跨度的数字行。')
  return {
    start: Math.min(...nonEmptyCells.map(({ column }) => column)),
    end: Math.max(...nonEmptyCells.map(({ column, columnSpan }) => column + columnSpan)),
  }
}

/**
 * 自动配色在宏层完成：渲染器只接收通用的 renderer-neutral 色值。
 * MT 约定为借位提示、RB 约定为进位提示；运算符和 DOT 的独占色优先级最高。
 */
const applyAutoColor = (element: GridElement, node: MacroNode, row: number): GridElement => {
  const macroName = getCall(node)?.name
  if (element.content.kind === 'line') {
    const lineTheme = macroName === 'BRACKET' ? AUTO_COLOR_THEME.bracketRule : AUTO_COLOR_THEME.rule
    return { ...element, content: { ...element.content, ...lineTheme } }
  }
  if (element.content.kind === 'corner') {
    return { ...element, content: { ...element.content, ...AUTO_COLOR_THEME.bracketRule } }
  }

  const operatorColor = getAutoOperatorColor(element.content.text)
  const color = isDotMacro(node)
    ? AUTO_COLOR_THEME.decimal
    : operatorColor
      ?? (macroName === 'RB' ? getAutoCarryColor(row) : macroName === 'MT' ? getAutoBorrowColor(row) : getAutoRowTextColor(row))
  return { ...element, content: { ...element.content, color } }
}

/** BRACKET 的右上角自动延伸至当前网格右边界，形成完整厂字横。 */
const compileBracketHead = (cell: PositionedCell, row: number, columns: number, id: number): GridElement | undefined => {
  const startColumn = cell.column + cell.columnSpan
  const columnSpan = columns - startColumn
  if (columnSpan <= 0) return undefined
  return {
    id: `macro-bracket-head-${id}`,
    position: { kind: 'edge', column: startColumn, row, columnSpan, edge: 'top' },
    content: { kind: 'line', thickness: BRACKET_STROKE_THICKNESS },
    styleToken: cell.styleToken,
  }
}

/** 把一个已定位单元格的所有语法糖图元输出为通用元素，并维持全局稳定的 id 顺序。 */
const compileCellElements = (
  elements: GridElement[],
  cell: PositionedCell,
  row: number,
  autoColor: boolean,
  nextId: { value: number },
  columns?: number,
): void => {
  cell.elements.forEach((node) => {
    const element = compileSugarCellElement(node, cell, row, nextId.value)
    elements.push(autoColor ? applyAutoColor(element, node, row) : element)
    nextId.value += 1
    if (columns !== undefined && getBracketMacro(node)) {
      const bracketHead = compileBracketHead(cell, row, columns, nextId.value)
      if (bracketHead) {
        elements.push(autoColor ? applyAutoColor(bracketHead, node, row) : bracketHead)
        nextId.value += 1
      }
    }
  })
}

/** DIV 行使用与短除法布局器一致的“同宽行逐层左移半格”规则。 */
const getDividerOffsets = (rows: NormalizedShortDivisionRow[], firstGroupWidth: number): number[] => {
  const processRows = rows.filter(({ divisor }) => divisor !== undefined)
  const offsets = Array<number>(processRows.length)
  for (let index = processRows.length - 1; index >= 0; index -= 1) {
    const naturalOffset = 2 * (firstGroupWidth - processRows[index].valueGroups[0].length)
    offsets[index] = index === processRows.length - 1 ? naturalOffset : Math.min(naturalOffset, offsets[index + 1] - 1)
  }
  return offsets
}

/** 将带 DIV / VALUE 的半格源码单独编译，避免把短除法位置规则泄漏进通用渲染器。 */
const compileShortDivisionMacro = (
  rows: MacroCall[],
  options: Map<string, string>,
  autoColor: boolean,
): GridScene => {
  const normalizedRows = rows.map(readShortDivisionRow)
  const processRows = normalizedRows.filter(({ divisor }) => divisor !== undefined)
  if (processRows.length === 0) throw new Error('含 VALUE 的半格网格至少需要一行 DIV 过程。')
  if (normalizedRows.some(({ divisor }, index) => divisor === undefined && index !== normalizedRows.length - 1)) {
    throw new Error('短除法不含 DIV 的底行只能位于最后一行。')
  }
  if (normalizedRows.at(-1)?.divisor !== undefined) throw new Error('短除法最后一行必须是不含 DIV 的 VALUE 底行。')
  const valueGroupCount = normalizedRows[0].valueGroups.length
  if (normalizedRows.some(({ valueGroups }) => valueGroups.length !== valueGroupCount)) {
    throw new Error('短除法每行 VALUE 数值组数量必须一致。')
  }
  const groupWidths = Array.from({ length: valueGroupCount }, (_, groupIndex) => Math.max(
    ...normalizedRows.map(({ valueGroups }) => valueGroups[groupIndex].length),
  ))
  const dividerOffsets = getDividerOffsets(normalizedRows, groupWidths[0])
  const leftHalfTrackCount = Math.max(2, 2 - Math.min(...dividerOffsets, 0))
  const columns = Array.from({ length: leftHalfTrackCount }, (_, index) => ({ id: `macro-div-stagger-${index}`, size: 0.5 }))
  const groupColumns: number[][] = []
  groupWidths.forEach((width, groupIndex) => {
    const digitColumns: number[] = []
    for (let digitIndex = 0; digitIndex < width; digitIndex += 1) {
      digitColumns.push(columns.length)
      columns.push(
        { id: `macro-div-value-${groupIndex}-${digitIndex}-half-0`, size: 0.5 },
        { id: `macro-div-value-${groupIndex}-${digitIndex}-half-1`, size: 0.5 },
      )
    }
    groupColumns.push(digitColumns)
    if (groupIndex < groupWidths.length - 1) columns.push({ id: `macro-div-gap-${groupIndex}`, size: 0.5 })
  })
  const valueAreaEnd = columns.length
  const elements: GridElement[] = []
  const nextId = { value: 0 }
  let processIndex = 0
  normalizedRows.forEach((row, rowIndex) => {
    if (row.divisor) {
      const separatorColumn = leftHalfTrackCount + dividerOffsets[processIndex]
      compileCellElements(elements, { ...row.divisor, column: separatorColumn - 2 }, rowIndex, autoColor, nextId)
      const dividerNode: MacroNode = { kind: 'symbol', name: 'DIV' }
      const separator: GridElement = {
        id: `macro-div-separator-${processIndex}`,
        position: { kind: 'edge', column: separatorColumn, row: rowIndex, edge: 'left' },
        content: { kind: 'line' },
      }
      const bar: GridElement = {
        id: `macro-div-bar-${processIndex}`,
        position: { kind: 'edge', column: separatorColumn, row: rowIndex, columnSpan: valueAreaEnd - separatorColumn, edge: 'bottom' },
        content: { kind: 'line' },
      }
      elements.push(autoColor ? applyAutoColor(separator, dividerNode, rowIndex) : separator)
      elements.push(autoColor ? applyAutoColor(bar, dividerNode, rowIndex) : bar)
      processIndex += 1
    }
    row.valueGroups.forEach((group, groupIndex) => {
      const startIndex = groupWidths[groupIndex] - group.length
      group.forEach((cell, digitIndex) => {
        compileCellElements(elements, { ...cell, column: groupColumns[groupIndex][startIndex + digitIndex] }, rowIndex, autoColor, nextId)
      })
    })
  })
  const unitWidth = getPositiveNumber(options.get('unitWidth'), 'GRID 的 unitWidth', DEFAULTS.unitWidth)
  const uniformPadding = options.get('padding')
  return {
    columns,
    rows: normalizedRows.map((_, index) => ({ id: `macro-div-row-${index}`, size: 1 })),
    padding: {
      top: getPositiveNumber(uniformPadding ?? options.get('paddingY'), 'GRID 的 padding / paddingY', DEFAULTS.verticalPadding),
      right: getPositiveNumber(uniformPadding ?? options.get('paddingX'), 'GRID 的 padding / paddingX', DEFAULTS.horizontalPadding),
      bottom: getPositiveNumber(uniformPadding ?? options.get('paddingY'), 'GRID 的 padding / paddingY', DEFAULTS.verticalPadding),
      left: getPositiveNumber(uniformPadding ?? options.get('paddingX'), 'GRID 的 padding / paddingX', DEFAULTS.horizontalPadding),
    },
    unitWidth,
    unitHeight: getPositiveNumber(options.get('unitHeight'), 'GRID 的 unitHeight', DEFAULTS.unitHeight),
    fontSize: getPositiveNumber(options.get('fontSize'), 'GRID 的 fontSize', unitWidth * getPositiveNumber(options.get('fontSizeRatio'), 'GRID 的 fontSizeRatio', DEFAULTS.fontSizeRatio)),
    defaultTextStyleToken: options.get('style'),
    textHorizontalAlign: 'center',
    textVerticalAlign: 'center',
    elements,
    showGuideGrid: getBoolean(options.get('showGrid') ?? options.get('showGuideGrid'), 'GRID 的 showGrid', DEFAULTS.showGuideGrid),
    ariaLabel: options.get('ariaLabel') ?? '短除法宏公式预览',
  }
}

/**
 * 将已解析宏降级为 renderer-neutral GridScene。
 * 该层只处理行列、对齐、横线和样式，不理解任何具体四则运算。
 */
export const compileMacroAst = (root: MacroCall): GridScene => {
  if (root.name !== 'GRID') throw new Error('根节点必须是 GRID(...)。')
  const { content, options } = splitOptions(root.arguments)
  const autoColor = getBoolean(options.get('autoColor'), 'GRID 的 autoColor', true)
  const trackUnit = options.get('trackUnit') ?? 'full'
  if (trackUnit !== 'full' && trackUnit !== 'half') throw new Error('GRID 的 trackUnit 只能是 full 或 half。')
  const rowCalls = content.map((node) => getCall(node, 'ROW')).filter((node): node is MacroCall => node !== undefined)
  const hasDivider = content.some((node) => getCall(node, 'ROW')?.arguments.some((child) => getCall(child, 'DIV')))
  if (hasDivider) {
    // DIV 自动提升为半格短除法模式：无需 KV(trackUnit, half)，显式 full 也不会降回整格。
    if (!content.every((node) => getCall(node, 'ROW') || getCall(node, 'KV'))) {
      throw new Error('包含 DIV 的 GRID 只能包含 ROW 与 KV。')
    }
    return compileShortDivisionMacro(rowCalls, options, autoColor)
  }
  const rows: NormalizedRow[] = []
  const lines: NormalizedLine[] = []
  content.forEach((node) => {
    const call = getCall(node)
    if (!call) throw new Error('GRID 只能包含 ROW、LINE 或 KV 配置。')
    if (call.name === 'ROW') {
      rows.push(readRow(call, trackUnit === 'half' ? 2 : 1))
      return
    }
    if (call.name === 'LINE') {
      if (rows.length === 0) throw new Error('LINE 前必须先有一个 ROW。')
      lines.push(readLine(call, rows.length - 1))
      return
    }
    throw new Error(`GRID 不支持子节点 ${call.name}。`)
  })
  if (rows.length === 0) throw new Error('GRID 至少需要一个 ROW。')
  if (autoColor && rows.length > AUTO_COLOR_MAX_ROWS) {
    throw new Error(`GRID 的 autoColor 最多支持 ${AUTO_COLOR_MAX_ROWS} 行。`)
  }

  const inferredColumns = Math.max(...rows.map(({ cells }) => cells.reduce((sum, cell) => sum + cell.columnSpan, 0)))
  const columns = getPositiveInteger(options.get('columns'), 'GRID 的 columns', inferredColumns)
  if (columns < inferredColumns) throw new Error(`GRID 的 columns=${columns} 小于最长 ROW 所需的 ${inferredColumns} 列。`)
  const positionedRows = rows.map(({ cells, align }) => {
    const rowWidth = cells.reduce((sum, cell) => sum + cell.columnSpan, 0)
    let nextColumn = align === 'right' ? columns - rowWidth : 0
    return cells.map((cell): PositionedCell => {
      const positioned = { ...cell, column: nextColumn }
      nextColumn += cell.columnSpan
      return positioned
    })
  })
  // 先按逻辑列对齐，再把厂字弯对应的真实轨道缩窄；不会改变其他单元格的列索引。
  const columnSizes: number[] = Array.from({ length: columns }, () => trackUnit === 'half' ? 0.5 : 1)
  positionedRows.forEach((cells) => cells.forEach(({ column, trackSize }) => {
    if (trackSize !== undefined) columnSizes[column] = trackSize
  }))
  const elements: GridElement[] = []
  const nextId = { value: 0 }
  positionedRows.forEach((cells, row) => cells.forEach((cell) => compileCellElements(elements, cell, row, autoColor, nextId, columns)))
  lines.forEach((line, index) => {
    const range = getLineRange(line.span, positionedRows[line.afterRow], positionedRows, columns)
    const contentValue: GridLineContent = { kind: 'line', ...line.style }
    const element: GridElement = {
      id: `macro-line-${index}`,
      position: { kind: 'edge', column: range.start, row: line.afterRow, columnSpan: range.end - range.start, edge: 'bottom' },
      content: contentValue,
      styleToken: line.styleToken,
    }
    elements.push(autoColor ? applyAutoColor(element, { kind: 'symbol', name: 'LINE' }, line.afterRow) : element)
  })
  const unitWidth = getPositiveNumber(options.get('unitWidth'), 'GRID 的 unitWidth', DEFAULTS.unitWidth)
  const uniformPadding = options.get('padding')
  const horizontalPadding = getPositiveNumber(
    uniformPadding ?? options.get('paddingX'),
    'GRID 的 padding / paddingX',
    DEFAULTS.horizontalPadding,
  )
  const verticalPadding = getPositiveNumber(
    uniformPadding ?? options.get('paddingY'),
    'GRID 的 padding / paddingY',
    DEFAULTS.verticalPadding,
  )
  return {
    columns: Array.from({ length: columns }, (_, index) => ({ id: `macro-column-${index}`, size: columnSizes[index] })),
    rows: Array.from({ length: rows.length }, (_, index) => ({ id: `macro-row-${index}`, size: 1 })),
    padding: { top: verticalPadding, right: horizontalPadding, bottom: verticalPadding, left: horizontalPadding },
    unitWidth,
    unitHeight: getPositiveNumber(options.get('unitHeight'), 'GRID 的 unitHeight', DEFAULTS.unitHeight),
    // fontSize 作为旧的绝对值覆盖保留；未设置时与首页一样由格宽 × 字号比例得出。
    fontSize: getPositiveNumber(
      options.get('fontSize'),
      'GRID 的 fontSize',
      unitWidth * getPositiveNumber(options.get('fontSizeRatio'), 'GRID 的 fontSizeRatio', DEFAULTS.fontSizeRatio),
    ),
    defaultTextStyleToken: options.get('style'),
    textHorizontalAlign: 'center',
    textVerticalAlign: 'center',
    elements,
    showGuideGrid: getBoolean(
      options.get('showGrid') ?? options.get('showGuideGrid'),
      'GRID 的 showGrid',
      DEFAULTS.showGuideGrid,
    ),
    ariaLabel: options.get('ariaLabel') ?? '宏公式预览',
  }
}
