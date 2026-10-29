/** Subtraction layout engine: turns borrowing records into a renderer-neutral grid. */
import type { GridCell, GridScene, GridTextContent, GridTrack } from '@vertical-arithmetic/grid'
import type { SubtractionComputation } from '@vertical-arithmetic/calculators'
import type { SubtractionRenderSettings } from './types'

const OPERATOR_TRACK_SIZE = 0.72
const STAGE_PADDING = 20
const BORROW_FONT_SIZE_RATIO = 0.84

const createTextCell = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridCell => ({
  id, position: { column, row }, content: { kind: 'text', text, styleToken, ...textOptions },
})

/** 主行保留工作被减数原值；借位后的中间值只保留在计算步骤中，布局层只渲染借位提示。 */
export const createSubtractionGridScene = (computation: SubtractionComputation, settings: SubtractionRenderSettings): GridScene => {
  const numberColumnCount = Math.max(computation.workingMinuendDigits.length, computation.workingSubtrahendDigits.length, computation.differenceDigits.length)
  const operatorColumn = 0
  const numberColumnIndex = (numberIndex: number): number => 1 + numberIndex
  const rightmostNumberIndex = numberColumnCount - 1
  const columns: GridTrack[] = [
    { id: 'subtraction-operator', size: OPERATOR_TRACK_SIZE },
    ...Array.from({ length: numberColumnCount }, (_, index) => ({ id: `number-${index}`, size: 1 })),
  ]
  const rows: GridTrack[] = []
  const cells: GridCell[] = []
  const appendRow = (id: string, size = 1): number => { rows.push({ id, size }); return rows.length - 1 }
  const borrowRow = appendRow('borrow-row', 0)
  const minuendRow = appendRow('minuend-row')
  const subtrahendRow = appendRow('subtrahend-row')
  const placeWorkingDigits = (): void => {
    const stepByColumn = new Map(computation.steps.map((step) => [step.columnFromRight, step]))
    for (let columnFromRight = 0; columnFromRight < computation.workingMinuendDigits.length; columnFromRight += 1) {
      const step = stepByColumn.get(columnFromRight)
      if (!step) continue
      const column = numberColumnIndex(rightmostNumberIndex - columnFromRight)
      cells.push(createTextCell(`minuend-${columnFromRight}`, step.minuendDigit, column, minuendRow, 'subtraction.minuend'))
      if (settings.showBorrowSteps && step.borrowOut > 0 && columnFromRight + 1 < numberColumnCount) {
        cells.push(createTextCell(
          `borrow-${columnFromRight}`,
          '·',
          numberColumnIndex(rightmostNumberIndex - columnFromRight - 1),
          borrowRow,
          'subtraction.borrow',
          { fontSizeRatio: BORROW_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'center' },
        ))
      }
    }
  }
  const placeNumber = (idPrefix: string, value: string, row: number, styleToken: string): void => {
    ;[...value].forEach((digit, index) => cells.push(createTextCell(
      `${idPrefix}-${index}`, digit, numberColumnIndex(rightmostNumberIndex - value.length + index + 1), row, styleToken,
    )))
  }

  placeWorkingDigits()
  placeNumber('subtrahend', computation.workingSubtrahendDigits, subtrahendRow, 'subtraction.subtrahend')
  cells.push(createTextCell('subtraction-operator', '−', operatorColumn, subtrahendRow, 'subtraction.operator'))
  const barRow = appendRow('difference-bar-row', 0)
  cells.push({
    id: 'subtraction-difference-bar',
    position: { column: operatorColumn, row: barRow, columnSpan: columns.length },
    edges: { bottom: true }, styleToken: 'subtraction.difference-bar',
  })
  const differenceRow = appendRow('difference-row')
  if (computation.isNegative) cells.push(createTextCell('negative-sign', '−', operatorColumn, differenceRow, 'subtraction.negative-sign'))
  placeNumber('difference', computation.differenceDigits, differenceRow, 'subtraction.difference')

  return {
    columns, rows,
    padding: { top: 12, right: STAGE_PADDING, bottom: 12, left: STAGE_PADDING },
    unitWidth: settings.cellWidth, unitHeight: settings.rowHeight, fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text', textHorizontalAlign: settings.textHorizontalAlign ?? 'center', textVerticalAlign: settings.textVerticalAlign ?? 'center',
    cells, showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.minuendDigits} 减 ${computation.subtrahendDigits} 的竖式`,
  }
}
