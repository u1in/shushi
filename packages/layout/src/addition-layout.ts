/** Addition layout engine: maps column sums and carries to the generic GridScene. */
import type { GridCell, GridScene, GridTextContent, GridTrack } from '@vertical-arithmetic/grid'
import type { AdditionComputation } from '@vertical-arithmetic/calculators'
import type { AdditionRenderSettings } from './types'

const OPERATOR_TRACK_SIZE = 0.72
const STAGE_PADDING = 20
const CARRY_FONT_SIZE_RATIO = 0.42

const createTextCell = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridCell => ({ id, position: { column, row }, content: { kind: 'text', text, styleToken, ...textOptions } })

/** 将两个或多个加数右对齐；进位使用零宽列和零高行，不改变竖式高度。 */
export const createAdditionGridScene = (computation: AdditionComputation, settings: AdditionRenderSettings): GridScene => {
  const numberColumnCount = Math.max(computation.sumDigits.length, ...computation.addendDigits.map(({ length }) => length))
  const numberColumnIndex = (numberIndex: number): number => 1 + numberIndex * 2
  const operatorColumn = 0
  const rightmostNumberIndex = numberColumnCount - 1
  const columns: GridTrack[] = [{ id: 'addition-operator', size: OPERATOR_TRACK_SIZE }]
  for (let index = 0; index < numberColumnCount; index += 1) {
    columns.push({ id: `number-${index}`, size: 1 })
    if (index < numberColumnCount - 1) columns.push({ id: `carry-boundary-${index}`, size: 0 })
  }
  const rows: GridTrack[] = []
  const cells: GridCell[] = []
  const appendRow = (id: string, size = 1): number => {
    rows.push({ id, size })
    return rows.length - 1
  }
  const placeNumber = (idPrefix: string, value: string, row: number, styleToken: string): void => {
    ;[...value].forEach((digit, index) => cells.push(createTextCell(
      `${idPrefix}-${index}`, digit, numberColumnIndex(rightmostNumberIndex - value.length + index + 1), row, styleToken,
    )))
  }

  computation.addendDigits.forEach((addend, index) => {
    const row = appendRow(`addend-row-${index}`)
    placeNumber(`addend-${index}`, addend, row, 'addition.addend')
    if (index === computation.addendDigits.length - 1) {
      cells.push(createTextCell('addition-operator', '+', operatorColumn, row, 'addition.operator'))
    }
  })
  // 进位行贴在加数区和横线的共同边界上，与乘法的进位标记一样向上延伸，
  // 因此它解释的是最后一行加数的本位计算，而不会漂到竖式顶端。
  const carryRow = appendRow('carry-row', 0)
  if (settings.showCarrySteps) {
    computation.steps.forEach((step) => {
      // 最左端新产生的进位已成为和的最高位，不再重复绘制为提示。
      if (step.carryOut === 0 || step.columnFromRight + 1 >= numberColumnCount) return
      const targetNumberIndex = rightmostNumberIndex - step.columnFromRight - 1
      cells.push(createTextCell(
        `carry-${step.columnFromRight}`,
        String(step.carryOut),
        2 + targetNumberIndex * 2,
        carryRow,
        'addition.carry',
        { fontSizeRatio: CARRY_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'bottom' },
      ))
    })
  }
  const barRow = appendRow('sum-bar-row', 0)
  cells.push({
    id: 'addition-sum-bar',
    position: { column: operatorColumn, row: barRow, columnSpan: columns.length },
    edges: { bottom: true },
    styleToken: 'addition.sum-bar',
  })
  const sumRow = appendRow('sum-row')
  placeNumber('sum', computation.sumDigits, sumRow, 'addition.sum')

  return {
    columns, rows,
    padding: { top: 12, right: STAGE_PADDING, bottom: 12, left: STAGE_PADDING },
    unitWidth: settings.cellWidth, unitHeight: settings.rowHeight, fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text', textHorizontalAlign: settings.textHorizontalAlign ?? 'center', textVerticalAlign: settings.textVerticalAlign ?? 'center',
    cells, showGuideGrid: settings.showGuideGrid, ariaLabel: `${computation.addendDigits.join(' 加 ')} 的竖式`,
  }
}
