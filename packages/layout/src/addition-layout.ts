/** Addition layout engine: maps column sums and carries to the generic GridScene. */
import type { GridElement, GridScene, GridTextContent, GridTrack } from '@vertical-arithmetic/grid'
import type { AdditionComputation } from '@vertical-arithmetic/calculators'
import type { AdditionRenderSettings } from './types'

const OPERATOR_TRACK_SIZE = 0.72
const STAGE_PADDING = 20
const CARRY_FONT_SIZE_RATIO = 0.42

const createTextElement = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridElement => ({ id, position: { kind: 'cell', column, row }, content: { kind: 'text', text, styleToken, ...textOptions } })

/** 将两个或多个加数右对齐；进位与横线使用既有边界，不额外制造轨道。 */
export const createAdditionGridScene = (computation: AdditionComputation, settings: AdditionRenderSettings): GridScene => {
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? computation.steps.length, 0), computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleStepCount)
  const numberColumnCount = Math.max(computation.sumDigits.length, ...computation.addendDigits.map(({ length }) => length))
  const numberColumnIndex = (numberIndex: number): number => 1 + numberIndex
  const operatorColumn = 0
  const rightmostNumberIndex = numberColumnCount - 1
  const columns: GridTrack[] = [{ id: 'addition-operator', size: OPERATOR_TRACK_SIZE }]
  for (let index = 0; index < numberColumnCount; index += 1) {
    columns.push({ id: `number-${index}`, size: 1 })
  }
  const rows: GridTrack[] = []
  const elements: GridElement[] = []
  const appendRow = (id: string, size = 1): number => {
    rows.push({ id, size })
    return rows.length - 1
  }
  const placeNumber = (idPrefix: string, value: string, row: number, styleToken: string): void => {
    ;[...value].forEach((digit, index) => elements.push(createTextElement(
      `${idPrefix}-${index}`, digit, numberColumnIndex(rightmostNumberIndex - value.length + index + 1), row, styleToken,
    )))
  }

  computation.addendDigits.forEach((addend, index) => {
    const row = appendRow(`addend-row-${index}`)
    placeNumber(`addend-${index}`, addend, row, 'addition.addend')
    if (index === computation.addendDigits.length - 1) {
      elements.push(createTextElement('addition-operator', '+', operatorColumn, row, 'addition.operator'))
    }
  })
  // 进位锚定在最后一个加数行的下边界，并向上延伸，不占用虚拟行高。
  if (settings.showCarrySteps) {
    visibleSteps.forEach((step) => {
      // 最左端新产生的进位已成为和的最高位，不再重复绘制为提示。
      if (step.carryOut === 0 || step.columnFromRight + 1 >= numberColumnCount) return
      const targetNumberIndex = rightmostNumberIndex - step.columnFromRight - 1
      elements.push({
        id: `carry-${step.columnFromRight}`,
        position: { kind: 'intersection', columnLine: targetNumberIndex + 2, rowLine: computation.addendDigits.length },
        content: {
          kind: 'text', text: String(step.carryOut), styleToken: 'addition.carry',
          fontSizeRatio: CARRY_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'bottom',
        },
      })
    })
  }
  const sumRow = appendRow('sum-row')
  elements.push({
    id: 'addition-sum-bar',
    position: { kind: 'edge', column: operatorColumn, row: sumRow, columnSpan: columns.length, edge: 'top' },
    content: { kind: 'line' },
    styleToken: 'addition.sum-bar',
  })
  const visibleSum = visibleSteps.map(({ resultDigit }) => resultDigit).reverse().join('')
  const sumToDisplay = settings.visibleStepCount === undefined || visibleStepCount >= computation.steps.length ? computation.sumDigits : visibleSum
  placeNumber('sum', sumToDisplay, sumRow, 'addition.sum')

  return {
    columns, rows,
    padding: { top: 12, right: STAGE_PADDING, bottom: 12, left: STAGE_PADDING },
    unitWidth: settings.cellWidth, unitHeight: settings.rowHeight, fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text', textHorizontalAlign: settings.textHorizontalAlign ?? 'center', textVerticalAlign: settings.textVerticalAlign ?? 'center',
    elements, showGuideGrid: settings.showGuideGrid, ariaLabel: `${computation.addendDigits.join(' 加 ')} 的竖式`,
  }
}
