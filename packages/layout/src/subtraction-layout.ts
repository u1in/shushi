/** Subtraction layout engine: turns borrowing records into a renderer-neutral grid. */
import type { GridElement, GridScene, GridTextContent, GridTrack } from '@vertical-arithmetic/grid'
import type { SubtractionComputation } from '@vertical-arithmetic/calculators'
import type { SubtractionRenderSettings } from './types'

const OPERATOR_TRACK_SIZE = 0.72
const STAGE_PADDING = 20
const BORROW_FONT_SIZE_RATIO = 0.84

const createTextElement = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridElement => ({
  id, position: { kind: 'cell', column, row }, content: { kind: 'text', text, styleToken, ...textOptions },
})

/** 主行保留工作被减数原值；借位后的中间值只保留在计算步骤中，布局层只渲染借位提示。 */
export const createSubtractionGridScene = (computation: SubtractionComputation, settings: SubtractionRenderSettings): GridScene => {
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? computation.steps.length, 0), computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleStepCount)
  const numberColumnCount = Math.max(computation.workingMinuendDigits.length, computation.workingSubtrahendDigits.length, computation.differenceDigits.length)
  const operatorColumn = 0
  const numberColumnIndex = (numberIndex: number): number => 1 + numberIndex
  const rightmostNumberIndex = numberColumnCount - 1
  const columns: GridTrack[] = [
    { id: 'subtraction-operator', size: OPERATOR_TRACK_SIZE },
    ...Array.from({ length: numberColumnCount }, (_, index) => ({ id: `number-${index}`, size: 1 })),
  ]
  const rows: GridTrack[] = []
  const elements: GridElement[] = []
  const appendRow = (id: string, size = 1): number => { rows.push({ id, size }); return rows.length - 1 }
  const minuendRow = appendRow('minuend-row')
  const subtrahendRow = appendRow('subtrahend-row')
  const placeWorkingDigits = (): void => {
    const stepByColumn = new Map(computation.steps.map((step) => [step.columnFromRight, step]))
    const visibleStepColumns = new Set(visibleSteps.map(({ columnFromRight }) => columnFromRight))
    for (let columnFromRight = 0; columnFromRight < computation.workingMinuendDigits.length; columnFromRight += 1) {
      const step = stepByColumn.get(columnFromRight)
      if (!step) continue
      const column = numberColumnIndex(rightmostNumberIndex - columnFromRight)
      elements.push(createTextElement(`minuend-${columnFromRight}`, step.minuendDigit, column, minuendRow, 'subtraction.minuend'))
      if (settings.showBorrowSteps && visibleStepColumns.has(columnFromRight) && step.borrowOut > 0 && columnFromRight + 1 < numberColumnCount) {
        elements.push({
          id: `borrow-${columnFromRight}`,
          position: {
            kind: 'edgeMidpoint',
            column: numberColumnIndex(rightmostNumberIndex - columnFromRight - 1),
            row: minuendRow,
            edge: 'top',
          },
          content: {
            kind: 'text', text: '·', styleToken: 'subtraction.borrow',
            fontSizeRatio: BORROW_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'center',
          },
        })
      }
    }
  }
  const placeNumber = (idPrefix: string, value: string, row: number, styleToken: string): void => {
    ;[...value].forEach((digit, index) => elements.push(createTextElement(
      `${idPrefix}-${index}`, digit, numberColumnIndex(rightmostNumberIndex - value.length + index + 1), row, styleToken,
    )))
  }

  placeWorkingDigits()
  placeNumber('subtrahend', computation.workingSubtrahendDigits, subtrahendRow, 'subtraction.subtrahend')
  elements.push(createTextElement('subtraction-operator', '−', operatorColumn, subtrahendRow, 'subtraction.operator'))
  const differenceRow = appendRow('difference-row')
  elements.push({
    id: 'subtraction-difference-bar',
    position: { kind: 'edge', column: operatorColumn, row: differenceRow, columnSpan: columns.length, edge: 'top' },
    content: { kind: 'line' }, styleToken: 'subtraction.difference-bar',
  })
  const isComplete = settings.visibleStepCount === undefined || visibleStepCount >= computation.steps.length
  if (computation.isNegative && isComplete) elements.push(createTextElement('negative-sign', '−', operatorColumn, differenceRow, 'subtraction.negative-sign'))
  const visibleDifference = visibleSteps.map(({ resultDigit }) => resultDigit).reverse().join('')
  placeNumber('difference', isComplete ? computation.differenceDigits : visibleDifference, differenceRow, 'subtraction.difference')

  return {
    columns, rows,
    padding: { top: 12, right: STAGE_PADDING, bottom: 12, left: STAGE_PADDING },
    unitWidth: settings.cellWidth, unitHeight: settings.rowHeight, fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text', textHorizontalAlign: settings.textHorizontalAlign ?? 'center', textVerticalAlign: settings.textVerticalAlign ?? 'center',
    elements, showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.minuendDigits} 减 ${computation.subtrahendDigits} 的竖式`,
  }
}
