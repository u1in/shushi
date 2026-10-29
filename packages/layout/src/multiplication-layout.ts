/** Multiplication layout engine: turns a multiplication process into a general GridScene. */
import type {
  GridCell,
  GridScene,
  GridTextContent,
  GridTrack,
} from '@vertical-arithmetic/grid'
import type {
  MultiplicationAdditionStep,
  MultiplicationComputation,
  MultiplicationPartialProduct,
} from '@vertical-arithmetic/calculators'
import type { MultiplicationRenderSettings } from './types'

const OPERATOR_TRACK_SIZE = 0.72
const STAGE_HORIZONTAL_PADDING = 20
const STAGE_VERTICAL_PADDING = 12
const CARRY_FONT_SIZE_RATIO = 0.42

const createTextCell = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridCell => ({
  id,
  position: { column, row },
  content: { kind: 'text', text, styleToken, ...textOptions },
})

/**
 * Maps multiplication process data into a right-aligned vertical grid. The
 * calculator's shifts and carries are interpreted here; the renderers receive
 * only tracks, text cells, and horizontal edges.
 *
 * The carry skeleton is pre-built: every pair of adjacent number columns gets a
 * zero-width carry column, and every partial product gets a zero-height carry
 * row. These slots exist even when the current computation has no carry, so
 * the track indices stay stable; `showCarrySteps` only controls whether the
 * carry text cells are written. Carries that do exist straddle the boundary
 * between the column that produced them and the column that consumes them, and
 * grow upward from the zero-height row by using `verticalAlign: "bottom"`.
 */
export const createMultiplicationGridScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): GridScene => {
  const partialWidth = Math.max(...computation.partialProducts.map(({ value, shift }) => value.length + shift))
  const numberColumnCount = Math.max(
    computation.multiplicandDigits.length,
    computation.multiplierDigits.length,
    computation.productDigits.length,
    partialWidth,
  )
  const operatorColumn = 0
  const rightmostNumberIndex = numberColumnCount - 1
  const isMultiDigitMultiplier = computation.multiplierDigits.length > 1
  const numberColumnIndex = (numberIndex: number): number => 1 + 2 * numberIndex
  const carryColumnIndex = (targetNumberIndex: number): number => {
    if (targetNumberIndex < 0 || targetNumberIndex >= numberColumnCount - 1) {
      throw new Error(`乘法进位目标列 ${targetNumberIndex} 没有对应的零宽进位列。`)
    }
    return 2 + 2 * targetNumberIndex
  }
  const columns: GridTrack[] = [{ id: 'multiplication-operator', size: OPERATOR_TRACK_SIZE }]
  for (let index = 0; index < numberColumnCount; index += 1) {
    columns.push({ id: `number-${index}`, size: 1 })
    if (index < numberColumnCount - 1) {
      columns.push({ id: `carry-boundary-${index}`, size: 0 })
    }
  }

  const rows: GridTrack[] = []
  const cells: GridCell[] = []
  const appendRow = (id: string, size = 1): number => {
    rows.push({ id, size })
    return rows.length - 1
  }
  const placeNumber = (
    idPrefix: string,
    value: string,
    rightNumberIndex: number,
    row: number,
    styleToken: string,
  ): void => {
    ;[...value].forEach((digit, index) => {
      cells.push(createTextCell(
        `${idPrefix}-${index}`,
        digit,
        numberColumnIndex(rightNumberIndex - value.length + 1 + index),
        row,
        styleToken,
      ))
    })
  }

  const multiplicandRow = appendRow('multiplicand-row')
  const multiplierRow = appendRow('multiplier-row')
  const inputBarRow = appendRow('input-bar-row', 0)

  placeNumber('multiplicand', computation.multiplicandDigits, rightmostNumberIndex, multiplicandRow, 'multiplication.multiplicand')
  placeNumber('multiplier', computation.multiplierDigits, rightmostNumberIndex, multiplierRow, 'multiplication.multiplier')
  cells.push(createTextCell('multiplication-operator', '×', operatorColumn, multiplierRow, 'multiplication.operator'))
  cells.push({
    id: 'multiplication-input-bar',
    position: { column: operatorColumn, row: inputBarRow, columnSpan: columns.length },
    edges: { bottom: true },
    styleToken: 'multiplication.input-bar',
  })

  const placeCarries = (partialProduct: MultiplicationPartialProduct, row: number): void => {
    partialProduct.digitSteps.forEach(({ carryOut, multiplicandDigitIndex }) => {
      // The leftmost multiplication is final: its carry becomes the partial
      // product's leading digit and is not shown as a separate carry mark.
      if (carryOut === 0 || multiplicandDigitIndex === 0) return
      const targetColumnFromRight = computation.multiplicandDigits.length - multiplicandDigitIndex
      const targetNumberIndex = rightmostNumberIndex - partialProduct.shift - targetColumnFromRight
      cells.push(createTextCell(
        `carry-${partialProduct.multiplierDigitIndex}-${multiplicandDigitIndex}`,
        String(carryOut),
        carryColumnIndex(targetNumberIndex),
        row,
        'multiplication.carry',
        { fontSizeRatio: CARRY_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'bottom' },
      ))
    })
  }

  /** Places carries produced while adding the shifted partial products. */
  const placeAdditionCarries = (row: number): void => {
    computation.additionSteps.forEach((step: MultiplicationAdditionStep) => {
      const targetColumnFromRight = step.columnFromRight + 1
      // A carry into the product's highest digit is still shown on the sum
      // line: it explains how that leading digit was formed.
      if (step.carryOut === 0 || targetColumnFromRight >= computation.productDigits.length) return
      const targetNumberIndex = rightmostNumberIndex - targetColumnFromRight
      cells.push(createTextCell(
        `addition-carry-${step.columnFromRight}`,
        String(step.carryOut),
        carryColumnIndex(targetNumberIndex),
        row,
        'multiplication.addition-carry',
        { fontSizeRatio: CARRY_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'bottom' },
      ))
    })
  }

  computation.partialProducts.forEach((partialProduct, index) => {
    const carryRow = appendRow(`carry-row-${index}`, 0)
    if (settings.showCarrySteps) {
      placeCarries(partialProduct, carryRow)
    }
    const partialRow = appendRow(`partial-product-row-${index}`)
    placeNumber(
      `partial-product-${index}`,
      partialProduct.value,
      rightmostNumberIndex - partialProduct.shift,
      partialRow,
      isMultiDigitMultiplier ? 'multiplication.partial-product' : 'multiplication.product',
    )
  })

  if (isMultiDigitMultiplier) {
    const additionCarryRow = appendRow('addition-carry-row', 0)
    if (settings.showCarrySteps) {
      placeAdditionCarries(additionCarryRow)
    }
    const sumBarRow = appendRow('sum-bar-row', 0)
    cells.push({
      id: 'multiplication-sum-bar',
      position: {
        column: settings.uniformMultiplicationBars ? operatorColumn : numberColumnIndex(0),
        row: sumBarRow,
        columnSpan: settings.uniformMultiplicationBars ? columns.length : columns.length - 1,
      },
      edges: { bottom: true },
      styleToken: 'multiplication.sum-bar',
    })
    const productRow = appendRow('product-row')
    placeNumber('product', computation.productDigits, rightmostNumberIndex, productRow, 'multiplication.product')
  }

  return {
    columns,
    rows,
    padding: { top: STAGE_VERTICAL_PADDING, right: STAGE_HORIZONTAL_PADDING, bottom: STAGE_VERTICAL_PADDING, left: STAGE_HORIZONTAL_PADDING },
    unitWidth: settings.cellWidth,
    unitHeight: settings.rowHeight,
    fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text',
    textHorizontalAlign: settings.textHorizontalAlign ?? 'center',
    textVerticalAlign: settings.textVerticalAlign ?? 'center',
    cells,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的竖式`,
  }
}
