/** Multiplication layout adapter: converts a multiplication process into a general BoardScene. */
import type {
  BoardCell,
  BoardScene,
  BoardTextContent,
  MultiplicationAdditionStep,
  MultiplicationComputation,
  MultiplicationPartialProduct,
  MultiplicationRenderSettings,
} from '../scene/types'

const OPERATOR_TRACK_SIZE = 0.72
const STAGE_HORIZONTAL_PADDING = 20
const STAGE_VERTICAL_PADDING = 12
/** Compact track above a partial product for carry annotations. */
const CARRY_ROW_SIZE = 0.36
const CARRY_FONT_SIZE_RATIO = 0.42

const createTextCell = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<BoardTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): BoardCell => ({
  id,
  position: { column, row },
  content: { kind: 'text', text, styleToken, ...textOptions },
})

const hasCarry = ({ digitSteps }: MultiplicationPartialProduct): boolean => (
  digitSteps.some(({ carryOut }) => carryOut > 0)
)

/**
 * Maps multiplication process data into a right-aligned vertical board. The
 * calculator's shifts and carries are interpreted here; the renderers receive
 * only tracks, text cells, and horizontal edges.
 */
export const createMultiplicationBoardScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): BoardScene => {
  const partialWidth = Math.max(...computation.partialProducts.map(({ value, shift }) => value.length + shift))
  const numberColumnCount = Math.max(
    computation.multiplicandDigits.length,
    computation.multiplierDigits.length,
    computation.productDigits.length,
    partialWidth,
  )
  const operatorColumn = 0
  const numberStartColumn = 1
  const rightmostNumberColumn = numberStartColumn + numberColumnCount - 1
  const isMultiDigitMultiplier = computation.multiplierDigits.length > 1
  const rows = [{ id: 'multiplicand-row', size: 1 }, { id: 'multiplier-row', size: 1 }]
  const cells: BoardCell[] = []
  let nextRow = 2

  const placeNumber = (
    idPrefix: string,
    value: string,
    rightColumn: number,
    row: number,
    styleToken: string,
  ): void => {
    ;[...value].forEach((digit, index) => {
      cells.push(createTextCell(
        `${idPrefix}-${index}`,
        digit,
        rightColumn - value.length + 1 + index,
        row,
        styleToken,
      ))
    })
  }

  const appendRow = (id: string, size = 1): number => {
    const row = rows.length
    rows.push({ id, size })
    return row
  }

  placeNumber('multiplicand', computation.multiplicandDigits, rightmostNumberColumn, 0, 'multiplication.multiplicand')
  placeNumber('multiplier', computation.multiplierDigits, rightmostNumberColumn, 1, 'multiplication.multiplier')
  cells.push(createTextCell('multiplication-operator', '×', operatorColumn, 1, 'multiplication.operator'))
  let inputBarRow = 1

  const placeCarries = (partialProduct: MultiplicationPartialProduct, row: number): void => {
    partialProduct.digitSteps.forEach(({ carryOut, multiplicandDigitIndex }) => {
      if (carryOut === 0) return
      const targetColumnFromRight = computation.multiplicandDigits.length - multiplicandDigitIndex
      const column = rightmostNumberColumn - partialProduct.shift - targetColumnFromRight
      cells.push(createTextCell(
        `carry-${partialProduct.multiplierDigitIndex}-${multiplicandDigitIndex}`,
        String(carryOut),
        column,
        row,
        'multiplication.carry',
        { fontSizeRatio: CARRY_FONT_SIZE_RATIO, verticalAlign: 'bottom' },
      ))
    })
  }

  /** Places carries produced while adding the shifted partial products. */
  const placeAdditionCarries = (row: number): void => {
    computation.additionSteps.forEach((step: MultiplicationAdditionStep) => {
      if (step.carryOut === 0) return
      const targetColumnFromRight = step.columnFromRight + 1
      const column = rightmostNumberColumn - targetColumnFromRight
      cells.push(createTextCell(
        `addition-carry-${step.columnFromRight}`,
        String(step.carryOut),
        column,
        row,
        'multiplication.addition-carry',
        { fontSizeRatio: CARRY_FONT_SIZE_RATIO, verticalAlign: 'bottom' },
      ))
    })
  }

  computation.partialProducts.forEach((partialProduct, index) => {
    if (settings.showCarrySteps && hasCarry(partialProduct)) {
      const carryRow = appendRow(`carry-row-${index}`, CARRY_ROW_SIZE)
      placeCarries(partialProduct, carryRow)
      if (index === 0) inputBarRow = carryRow
      nextRow = carryRow + 1
    }
    const partialRow = appendRow(`partial-product-row-${index}`)
    placeNumber(
      `partial-product-${index}`,
      partialProduct.value,
      rightmostNumberColumn - partialProduct.shift,
      partialRow,
      isMultiDigitMultiplier ? 'multiplication.partial-product' : 'multiplication.product',
    )
    nextRow = partialRow + 1
  })

  cells.push({
    id: 'multiplication-input-bar',
    position: { column: operatorColumn, row: inputBarRow, columnSpan: numberColumnCount + 1 },
    edges: { bottom: true },
    styleToken: 'multiplication.input-bar',
  })

  if (isMultiDigitMultiplier) {
    let sumBarRow = nextRow - 1
    if (settings.showCarrySteps && computation.additionSteps.some(({ carryOut }) => carryOut > 0)) {
      sumBarRow = appendRow('addition-carry-row', CARRY_ROW_SIZE)
      placeAdditionCarries(sumBarRow)
    }
    cells.push({
      id: 'multiplication-sum-bar',
      position: {
        column: settings.uniformMultiplicationBars ? operatorColumn : numberStartColumn,
        row: sumBarRow,
        columnSpan: settings.uniformMultiplicationBars ? numberColumnCount + 1 : numberColumnCount,
      },
      edges: { bottom: true },
      styleToken: 'multiplication.sum-bar',
    })
    const productRow = appendRow('product-row')
    placeNumber('product', computation.productDigits, rightmostNumberColumn, productRow, 'multiplication.product')
  }

  return {
    columns: [
      { id: 'multiplication-operator', size: OPERATOR_TRACK_SIZE },
      ...Array.from({ length: numberColumnCount }, (_, index) => ({ id: `number-${index}`, size: 1 })),
    ],
    rows,
    padding: { top: STAGE_VERTICAL_PADDING, right: STAGE_HORIZONTAL_PADDING, bottom: STAGE_VERTICAL_PADDING, left: STAGE_HORIZONTAL_PADDING },
    unitWidth: settings.cellWidth,
    unitHeight: settings.rowHeight,
    fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'board.default-text',
    textHorizontalAlign: settings.textHorizontalAlign ?? 'center',
    textVerticalAlign: settings.textVerticalAlign ?? 'center',
    cells,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的竖式`,
  }
}
