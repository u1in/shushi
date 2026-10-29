/** Short-division layout engine: converts all three short-division processes to GridScene. */
import type { GridCell, GridScene, GridTextContent, GridTrack } from '@vertical-arithmetic/grid'
import type { ShortDivisionComputation } from '@vertical-arithmetic/calculators'
import type { ShortDivisionRenderSettings } from './types'

const STAGE_PADDING = 20
const DIVISOR_TRACK_SIZE = 1.1
const OPERAND_GAP_TRACK_SIZE = 0.34

const createTextCell = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridCell => ({ id, position: { column, row }, content: { kind: 'text', text, styleToken, ...textOptions } })

/** 统计每组需要的最大位宽；每个潜在数字左边界都预建一个零宽竖线锚点。 */
const getValueGroups = (computation: ShortDivisionComputation): { widths: number[], values: string[][] } => {
  const values = [
    computation.inputValues,
    ...computation.steps.flatMap((step) => [step.dividends, step.quotients]),
    computation.finalValues,
  ]
  const valueCount = Math.max(...values.map(({ length }) => length), 1)
  const widths = Array.from({ length: valueCount }, (_, index) => Math.max(
    1,
    ...values.map((row) => row[index]?.length ?? 0),
  ))
  return { widths, values }
}

/**
 * 把“左除数、右原数/商、横线、底行”排成短除法；算法模式不会泄漏到渲染器。
 * 进制转换的余数在行右侧单独记录，读取方向由计算器结果决定。
 */
export const createShortDivisionGridScene = (
  computation: ShortDivisionComputation,
  settings: ShortDivisionRenderSettings,
): GridScene => {
  const { widths } = getValueGroups(computation)
  const columns: GridTrack[] = [{ id: 'short-division-divisor', size: DIVISOR_TRACK_SIZE }]
  const groupDigitColumns: number[][] = []
  widths.forEach((width, groupIndex) => {
    const digitColumns: number[] = []
    for (let digitIndex = 0; digitIndex < width; digitIndex += 1) {
      // 每个数字格前有一个 0u 轨道，短除竖线可随本行数字的起点移动而不改变宽度。
      columns.push({ id: `value-anchor-${groupIndex}-${digitIndex}`, size: 0 })
      digitColumns.push(columns.length)
      columns.push({ id: `value-${groupIndex}-${digitIndex}`, size: 1 })
    }
    groupDigitColumns.push(digitColumns)
    if (groupIndex < widths.length - 1) columns.push({ id: `value-gap-${groupIndex}`, size: OPERAND_GAP_TRACK_SIZE })
  })
  const valueAreaEndColumn = columns.length
  const showRemainders = computation.mode === 'baseConversion' && settings.showRemainders
  const remainderLabelColumn = columns.length
  if (showRemainders) {
    columns.push({ id: 'remainder-label', size: 1.15 }, { id: 'remainder-value', size: 1 })
  }

  const rows: GridTrack[] = []
  const cells: GridCell[] = []
  const appendRow = (id: string, size = 1): number => {
    rows.push({ id, size })
    return rows.length - 1
  }
  const placeValue = (idPrefix: string, value: string, groupIndex: number, row: number, styleToken: string): void => {
    // 数字保持原有右对齐：2｜12 的下一行 2｜6 中，6 位于 2 的正下方。
    const startIndex = widths[groupIndex] - value.length
    ;[...value].forEach((digit, digitIndex) => cells.push(createTextCell(
      `${idPrefix}-${groupIndex}-${digitIndex}`, digit, groupDigitColumns[groupIndex][startIndex + digitIndex], row, styleToken,
    )))
  }

  computation.steps.forEach((step, stepIndex) => {
    const row = appendRow(`short-division-step-${stepIndex}`)
    const firstValueStartIndex = widths[0] - step.dividends[0].length
    const separatorColumn = groupDigitColumns[0][firstValueStartIndex] - 1
    // 除数必须贴在本轮竖线左侧：首位时使用专属左列，其余情况复用本行空出的数字格。
    const divisorColumn = separatorColumn === 1 ? 0 : separatorColumn - 1
    cells.push(createTextCell(`short-division-divisor-${stepIndex}`, step.divisor, divisorColumn, row, 'short-division.divisor'))
    step.dividends.forEach((value, index) => placeValue(`short-division-dividend-${stepIndex}`, value, index, row, 'short-division.dividend'))
    if (showRemainders) {
      cells.push(createTextCell(`short-division-remainder-label-${stepIndex}`, '余', remainderLabelColumn, row, 'short-division.remainder-label'))
      cells.push(createTextCell(`short-division-remainder-${stepIndex}`, step.remainders[0], remainderLabelColumn + 1, row, 'short-division.remainder'))
    }
    // 每一轮数字起点不同，竖线要贴在本轮第一个数字左边界，而非固定在首列。
    cells.push({
      id: `short-division-separator-${stepIndex}`,
      position: { column: separatorColumn, row },
      edges: { left: true },
      styleToken: 'short-division.separator',
    })
    const barRow = appendRow(`short-division-bar-${stepIndex}`, 0)
    cells.push({
      id: `short-division-bar-${stepIndex}`,
      position: { column: separatorColumn, row: barRow, columnSpan: valueAreaEndColumn - separatorColumn },
      edges: { bottom: true },
      styleToken: 'short-division.bar',
    })
  })
  const finalRow = appendRow('short-division-final')
  computation.finalValues.forEach((value, index) => placeValue('short-division-final', value, index, finalRow, 'short-division.final'))

  return {
    columns,
    rows,
    padding: { top: 12, right: STAGE_PADDING, bottom: 12, left: STAGE_PADDING },
    unitWidth: settings.cellWidth,
    unitHeight: settings.rowHeight,
    fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text',
    textHorizontalAlign: settings.textHorizontalAlign ?? 'center',
    textVerticalAlign: settings.textVerticalAlign ?? 'center',
    cells,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `短除法：${computation.inputValues.join('、')}`,
  }
}
