/** Multiplication layout engine: turns a multiplication process into a general GridScene. */
import type {
  GridElement,
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

const createTextElement = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken: string,
  textOptions: Pick<GridTextContent, 'fontSizeRatio' | 'horizontalAlign' | 'verticalAlign'> = {},
): GridElement => ({
  id,
  position: { kind: 'cell', column, row },
  content: { kind: 'text', text, styleToken, ...textOptions },
})

/**
 * Maps multiplication process data into a right-aligned vertical grid. The
 * calculator's shifts and carries are interpreted here; the renderers receive
 * only tracks, elements, and explicit cell boundaries.
 *
 * Carries use intersections on pre-existing row and column boundaries. This
 * keeps the mathematical grid fully visible and lets `showCarrySteps` control
 * only elements, never hidden layout tracks.
 */
export const createMultiplicationGridScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): GridScene => {
  // 一次逐位相乘才是教学播放中的一个步骤；部分积仅是这些步骤完成后的行结果。
  const multiplicationStepCount = computation.partialProducts.reduce(
    (count, partialProduct) => count + partialProduct.digitSteps.length,
    0,
  )
  const totalStepCount = multiplicationStepCount + (computation.multiplierDigits.length > 1 ? computation.additionSteps.length : 0)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visibleMultiplicationStepCount = Math.min(visibleStepCount, multiplicationStepCount)
  const visibleAdditionStepCount = Math.max(0, visibleStepCount - multiplicationStepCount)
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
  const numberColumnIndex = (numberIndex: number): number => 1 + numberIndex
  const carryColumnLine = (targetNumberIndex: number): number => {
    if (targetNumberIndex < 0 || targetNumberIndex >= numberColumnCount - 1) {
      throw new Error(`乘法进位目标列 ${targetNumberIndex} 没有对应的列边界。`)
    }
    return 2 + targetNumberIndex
  }
  const columns: GridTrack[] = [{ id: 'multiplication-operator', size: OPERATOR_TRACK_SIZE }]
  for (let index = 0; index < numberColumnCount; index += 1) {
    columns.push({ id: `number-${index}`, size: 1 })
  }

  const rows: GridTrack[] = []
  const elements: GridElement[] = []
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
      elements.push(createTextElement(
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

  placeNumber('multiplicand', computation.multiplicandDigits, rightmostNumberIndex, multiplicandRow, 'multiplication.multiplicand')
  placeNumber('multiplier', computation.multiplierDigits, rightmostNumberIndex, multiplierRow, 'multiplication.multiplier')
  elements.push(createTextElement('multiplication-operator', '×', operatorColumn, multiplierRow, 'multiplication.operator'))
  elements.push({
    id: 'multiplication-input-bar',
    position: { kind: 'edge', column: operatorColumn, row: multiplierRow, columnSpan: columns.length, edge: 'bottom' },
    content: { kind: 'line' },
    styleToken: 'multiplication.input-bar',
  })

  const placeCarries = (partialProduct: MultiplicationPartialProduct, row: number): void => {
    partialProduct.digitSteps.forEach(({ carryOut, multiplicandDigitIndex }) => {
      // The leftmost multiplication is final: its carry becomes the partial
      // product's leading digit and is not shown as a separate carry mark.
      if (carryOut === 0 || multiplicandDigitIndex === 0) return
      const targetColumnFromRight = computation.multiplicandDigits.length - multiplicandDigitIndex
      const targetNumberIndex = rightmostNumberIndex - partialProduct.shift - targetColumnFromRight
      elements.push({
        id: `carry-${partialProduct.multiplierDigitIndex}-${multiplicandDigitIndex}`,
        position: { kind: 'intersection', columnLine: carryColumnLine(targetNumberIndex), rowLine: row },
        content: {
          kind: 'text', text: String(carryOut), styleToken: 'multiplication.carry',
          fontSizeRatio: CARRY_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'bottom',
        },
      })
    })
  }

  /** Places carries produced while adding the shifted partial products. */
  const placeAdditionCarries = (row: number, count: number): void => {
    computation.additionSteps.slice(0, count).forEach((step: MultiplicationAdditionStep) => {
      const targetColumnFromRight = step.columnFromRight + 1
      // A carry into the product's highest digit is still shown on the sum
      // line: it explains how that leading digit was formed.
      if (step.carryOut === 0 || targetColumnFromRight >= computation.productDigits.length) return
      const targetNumberIndex = rightmostNumberIndex - targetColumnFromRight
      elements.push({
        id: `addition-carry-${step.columnFromRight}`,
        position: { kind: 'intersection', columnLine: carryColumnLine(targetNumberIndex), rowLine: row },
        content: {
          kind: 'text', text: String(step.carryOut), styleToken: 'multiplication.addition-carry',
          fontSizeRatio: CARRY_FONT_SIZE_RATIO, horizontalAlign: 'center', verticalAlign: 'bottom',
        },
      })
    })
  }

  /** 逐位写入已完成的结果数字，避免提前显示整行部分积。 */
  const placePartialProductDigits = (
    partialProduct: MultiplicationPartialProduct,
    visibleDigitStepCount: number,
    row: number,
  ): void => {
    const styleToken = isMultiDigitMultiplier ? 'multiplication.partial-product' : 'multiplication.product'
    const completedDigitSteps = partialProduct.digitSteps.slice(-visibleDigitStepCount)
    // 与计算层的 `value` 一致：尚未确定为有效位的左侧零不单独写出，
    // 但至少保留个位零，避免把零部分积渲染为空行。
    const firstNonZeroIndex = completedDigitSteps.findIndex(({ resultDigit }) => resultDigit !== '0')
    const displayedDigitSteps = firstNonZeroIndex === -1
      ? completedDigitSteps.slice(-1)
      : completedDigitSteps.slice(firstNonZeroIndex)

    displayedDigitSteps.forEach(({ multiplicandDigitIndex, resultDigit }) => {
      const columnFromRight = computation.multiplicandDigits.length - 1 - multiplicandDigitIndex
      elements.push(createTextElement(
        `partial-product-${partialProduct.multiplierDigitIndex}-${multiplicandDigitIndex}`,
        resultDigit,
        numberColumnIndex(rightmostNumberIndex - partialProduct.shift - columnFromRight),
        row,
        styleToken,
      ))
    })

    // 最左位完成后，剩余进位成为该部分积的新增最高位；在此之前不能提前出现。
    const leadingStep = partialProduct.digitSteps[0]
    if (visibleDigitStepCount === partialProduct.digitSteps.length && leadingStep.carryOut > 0) {
      elements.push(createTextElement(
        `partial-product-leading-carry-${partialProduct.multiplierDigitIndex}`,
        String(leadingStep.carryOut),
        numberColumnIndex(rightmostNumberIndex - partialProduct.shift - computation.multiplicandDigits.length),
        row,
        styleToken,
      ))
    }
  }

  let remainingVisibleMultiplicationSteps = visibleMultiplicationStepCount
  computation.partialProducts.forEach((partialProduct, index) => {
    const visibleDigitStepCount = Math.min(remainingVisibleMultiplicationSteps, partialProduct.digitSteps.length)
    remainingVisibleMultiplicationSteps -= visibleDigitStepCount
    const partialRow = appendRow(`partial-product-row-${index}`)
    if (settings.showCarrySteps && visibleDigitStepCount > 0) {
      // 只有已经完成的位乘法可以产生并展示进位标记。
      const completedDigitSteps = partialProduct.digitSteps.slice(-visibleDigitStepCount)
      const visiblePartialProduct = { ...partialProduct, digitSteps: completedDigitSteps }
      placeCarries(visiblePartialProduct, partialRow)
    }
    if (visibleDigitStepCount > 0) {
      placePartialProductDigits(partialProduct, visibleDigitStepCount, partialRow)
    }
  })

  if (isMultiDigitMultiplier) {
    const productRow = appendRow('product-row')
    if (settings.showCarrySteps && visibleAdditionStepCount > 0) {
      placeAdditionCarries(productRow, visibleAdditionStepCount)
    }
    // 部分积尚未开始按列相加时，不预先显示求和横线。
    if (visibleAdditionStepCount > 0) {
      elements.push({
        id: 'multiplication-sum-bar',
        position: {
          kind: 'edge',
          column: settings.uniformMultiplicationBars ? operatorColumn : numberColumnIndex(0),
          row: productRow,
          columnSpan: settings.uniformMultiplicationBars ? columns.length : columns.length - 1,
          edge: 'top',
        },
        content: { kind: 'line' },
        styleToken: 'multiplication.sum-bar',
      })
    }
    const visibleProduct = computation.additionSteps.slice(0, visibleAdditionStepCount).map(({ resultDigit }) => resultDigit).reverse().join('')
    const productToDisplay = settings.visibleStepCount === undefined || visibleStepCount >= totalStepCount ? computation.productDigits : visibleProduct
    placeNumber('product', productToDisplay, rightmostNumberIndex, productRow, 'multiplication.product')
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
    elements,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的竖式`,
  }
}
