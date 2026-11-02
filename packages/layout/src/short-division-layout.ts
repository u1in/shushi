/** Short-division layout engine: converts all three short-division processes to GridScene. */
import type { GridElement, GridScene, GridTextContent, GridTrack } from '@vertical-arithmetic/grid'
import type { ShortDivisionComputation } from '@vertical-arithmetic/calculators'
import type { ShortDivisionRenderSettings } from './types'

const STAGE_PADDING = 20
const HALF_TRACK_SIZE = 0.5
const FULL_CELL_TRACK_SPAN = 2
const REMAINDER_LABEL_FONT_SIZE_RATIO = 0.72

const createTextElement = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridElement => ({
  id,
  // 短除法的每个数字格由两个半格轨道合并，文字仍保持完整的 1u 宽度。
  position: { kind: 'cell', column, row, columnSpan: FULL_CELL_TRACK_SPAN },
  content: { kind: 'text', text, styleToken, ...textOptions },
})

/** 统计每组需要的最大位宽；数字的真实左边界就是短除竖线的锚点。 */
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
 * 计算每轮短除竖线相对首个数值组的列偏移。
 *
 * 数值始终按右边界对齐；当相邻轮次的起点重合时，上方轮次在数字左侧
 * 预留空格。自底向上收紧后，每条竖线都严格位于下一条的左侧，连续多行
 * 同宽时便自然形成 2、1、0 个半格的阶梯，而不会再次与更下方的竖线重合。
 */
const getSeparatorOffsets = (computation: ShortDivisionComputation, firstGroupWidth: number): number[] => {
  const offsets = Array<number>(computation.steps.length)
  for (let stepIndex = computation.steps.length - 1; stepIndex >= 0; stepIndex -= 1) {
    const naturalOffset = FULL_CELL_TRACK_SPAN * (firstGroupWidth - computation.steps[stepIndex].dividends[0].length)
    offsets[stepIndex] = stepIndex === computation.steps.length - 1
      ? naturalOffset
      : Math.min(naturalOffset, offsets[stepIndex + 1] - 1)
  }
  return offsets
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
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? computation.steps.length, 0), computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleStepCount)
  const separatorOffsets = getSeparatorOffsets(computation, widths[0])
  // 最靠左的竖线左侧始终保留两个半格，合并后正好容纳一个完整除数单元格。
  const leftHalfTrackCount = Math.max(FULL_CELL_TRACK_SPAN, FULL_CELL_TRACK_SPAN - Math.min(...separatorOffsets, 0))
  const columns: GridTrack[] = Array.from({ length: leftHalfTrackCount }, (_, index) => ({
    id: `short-division-stagger-${index}`,
    size: HALF_TRACK_SIZE,
  }))
  const groupDigitColumns: number[][] = []
  widths.forEach((width, groupIndex) => {
    const digitColumns: number[] = []
    for (let digitIndex = 0; digitIndex < width; digitIndex += 1) {
      digitColumns.push(columns.length)
      columns.push(
        { id: `value-${groupIndex}-${digitIndex}-half-0`, size: HALF_TRACK_SIZE },
        { id: `value-${groupIndex}-${digitIndex}-half-1`, size: HALF_TRACK_SIZE },
      )
    }
    groupDigitColumns.push(digitColumns)
    // 多输入数之间也只使用一个半格，使短除法列网格保持统一粒度。
    if (groupIndex < widths.length - 1) columns.push({ id: `value-gap-${groupIndex}`, size: HALF_TRACK_SIZE })
  })
  const valueAreaEndColumn = columns.length
  const showRemainders = computation.mode === 'baseConversion' && settings.showRemainders
  const remainderLabelColumn = columns.length
  if (showRemainders) {
    columns.push(
      { id: 'remainder-label-half-0', size: HALF_TRACK_SIZE },
      { id: 'remainder-label-half-1', size: HALF_TRACK_SIZE },
      { id: 'remainder-value-half-0', size: HALF_TRACK_SIZE },
      { id: 'remainder-value-half-1', size: HALF_TRACK_SIZE },
    )
  }

  const rows: GridTrack[] = []
  const elements: GridElement[] = []
  const appendRow = (id: string, size = 1): number => {
    rows.push({ id, size })
    return rows.length - 1
  }
  const placeValue = (idPrefix: string, value: string, groupIndex: number, row: number, styleToken: string): void => {
    // 数字保持原有右对齐：2｜12 的下一行 2｜6 中，6 位于 2 的正下方。
    const startIndex = widths[groupIndex] - value.length
    ;[...value].forEach((digit, digitIndex) => elements.push(createTextElement(
      `${idPrefix}-${groupIndex}-${digitIndex}`, digit, groupDigitColumns[groupIndex][startIndex + digitIndex], row, styleToken,
    )))
  }

  visibleSteps.forEach((step, stepIndex) => {
    const row = appendRow(`short-division-step-${stepIndex}`)
    const separatorColumn = leftHalfTrackCount + separatorOffsets[stepIndex]
    // 除数必须贴在本轮竖线左侧，并继承场景默认的单元格对齐方式。
    const divisorColumn = separatorColumn - FULL_CELL_TRACK_SPAN
    elements.push(createTextElement(`short-division-divisor-${stepIndex}`, step.divisor, divisorColumn, row, 'short-division.divisor'))
    step.dividends.forEach((value, index) => placeValue(`short-division-dividend-${stepIndex}`, value, index, row, 'short-division.dividend'))
    if (showRemainders) {
      // “余”是辅助标签，字号略小于余数数字，避免抢占主要计算过程的视觉层级。
      elements.push(createTextElement(
        `short-division-remainder-label-${stepIndex}`,
        '余',
        remainderLabelColumn,
        row,
        'short-division.remainder-label',
        { fontSizeRatio: REMAINDER_LABEL_FONT_SIZE_RATIO },
      ))
      elements.push(createTextElement(
        `short-division-remainder-${stepIndex}`,
        step.remainders[0],
        remainderLabelColumn + FULL_CELL_TRACK_SPAN,
        row,
        'short-division.remainder',
      ))
    }
    // 竖线贴住本轮数值区；若为避免重合预留了空格，则贴住该空格的左边界。
    elements.push({
      id: `short-division-separator-${stepIndex}`,
      position: { kind: 'edge', column: separatorColumn, row, edge: 'left' },
      content: { kind: 'line' },
      styleToken: 'short-division.separator',
    })
    elements.push({
      id: `short-division-bar-${stepIndex}`,
      position: { kind: 'edge', column: separatorColumn, row, columnSpan: valueAreaEndColumn - separatorColumn, edge: 'bottom' },
      content: { kind: 'line' },
      styleToken: 'short-division.bar',
    })
  })
  const finalRow = appendRow('short-division-final')
  const resultValues = settings.visibleStepCount === undefined || visibleStepCount >= computation.steps.length
    ? computation.finalValues
    : (visibleSteps.at(-1)?.quotients ?? [])
  resultValues.forEach((value, index) => placeValue('short-division-final', value, index, finalRow, 'short-division.final'))

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
    elements,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `短除法：${computation.inputValues.join('、')}`,
  }
}
