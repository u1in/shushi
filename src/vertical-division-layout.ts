import type {
  DecimalPoint,
  DigitRole,
  DivisionComputation,
  PlacedDigit,
  RenderSettings,
  StraightLine,
  VerticalDivisionRenderModel,
} from './types'

const DIVISOR_LEFT_PADDING = 20
const STAGE_RIGHT_PADDING = 26
const STAGE_BOTTOM_PADDING = 12
const MINIMUM_ROW_COUNT = 4

/** Places every character of a numeric string so its final digit reaches column. */
const placeNumber = (
  digits: PlacedDigit[],
  role: DigitRole,
  text: string,
  column: number,
  row: number,
): void => {
  const firstColumn = column - text.length + 1

  ;[...text].forEach((digit, index) => {
    digits.push({ role, digit, column: firstColumn + index, row })
  })
}

/**
 * Converts calculation-layer data into named, positioned diagram parts.
 * Renderers receive this model rather than knowing how a quotient or a partial
 * dividend was calculated.
 */
export const createVerticalDivisionRenderModel = (
  computation: DivisionComputation,
  settings: RenderSettings,
): VerticalDivisionRenderModel => {
  const {
    cellWidth,
    rowHeight,
    fontSizeRatio,
    bracketBend,
    showGuideGrid,
    uniformSubtractionBars,
    showZeroQuotientSteps,
  } = settings
  const visibleSteps = showZeroQuotientSteps
    ? computation.steps
    : computation.steps.filter(({ quotientDigit }) => quotientDigit !== '0')
  const divisorWidth = computation.divisorDigits.length * cellWidth
  const bracketArcWidth = cellWidth / 2
  const divisorLeft = DIVISOR_LEFT_PADDING
  const bracketArcLeft = divisorLeft + divisorWidth
  const dividendLeft = bracketArcLeft + bracketArcWidth
  const digitColumnCount = Math.max(computation.digitColumnCount, computation.dividendDigits.length)
  const digitAreaRight = dividendLeft + digitColumnCount * cellWidth
  const dividendRow = 1
  const quotientRow = 0
  const finalRemainderRow = visibleSteps.length > 0 ? 1 + visibleSteps.length * 2 : 2
  const rowCount = Math.max(finalRemainderRow + 1, MINIMUM_ROW_COUNT)
  const width = digitAreaRight + STAGE_RIGHT_PADDING
  const height = rowCount * rowHeight + STAGE_BOTTOM_PADDING
  const digits: PlacedDigit[] = []
  const lines: StraightLine[] = []
  const subtractionStartColumns = visibleSteps.map((step) => (
    step.dividendColumn - step.partialDividend.length + 1
  ))
  const uniformSubtractionStartColumn = subtractionStartColumns.length > 0
    ? Math.min(...subtractionStartColumns)
    : 0

  placeNumber(
    digits,
    'divisor',
    computation.divisorDigits,
    computation.divisorDigits.length - 1,
    dividendRow,
  )
  ;[...computation.dividendDigits].forEach((digit, column) => {
    digits.push({ role: 'dividend', digit, column, row: dividendRow })
  })
  for (let index = 0; index < computation.fractionalDigitCount; index += 1) {
    digits.push({
      role: 'appendedZero',
      digit: '0',
      column: computation.dividendDigits.length + index,
      row: dividendRow,
    })
  }
  computation.quotientDigits.forEach(({ digit, column }) => {
    digits.push({ role: 'quotient', digit, column, row: quotientRow })
  })

  visibleSteps.forEach((step, stepIndex) => {
    const isFirstSubtraction = stepIndex === 0
    const partialDividendRow = isFirstSubtraction ? dividendRow : 1 + stepIndex * 2
    const productRow = isFirstSubtraction ? 2 : partialDividendRow + 1
    const subtractionStartColumn = uniformSubtractionBars
      ? uniformSubtractionStartColumn
      : step.dividendColumn - step.partialDividend.length + 1

    if (!isFirstSubtraction) {
      placeNumber(digits, 'partialDividend', step.partialDividend, step.dividendColumn, partialDividendRow)
    }
    placeNumber(digits, 'product', step.product, step.dividendColumn, productRow)
    lines.push({
      kind: 'subtractionBar',
      x1: dividendLeft + subtractionStartColumn * cellWidth,
      y1: (productRow + 1) * rowHeight,
      x2: digitAreaRight,
      y2: (productRow + 1) * rowHeight,
    })
  })

  placeNumber(
    digits,
    'remainder',
    computation.remainder,
    computation.digitColumnCount - 1,
    finalRemainderRow,
  )

  if (showGuideGrid) {
    const guideGridColumns = [
      ...Array.from({ length: computation.divisorDigits.length + 1 }, (_, index) => divisorLeft + index * cellWidth),
      dividendLeft,
      ...Array.from({ length: digitColumnCount }, (_, index) => dividendLeft + (index + 1) * cellWidth),
    ]

    for (let row = 0; row <= rowCount; row += 1) {
      lines.push({
        kind: 'guideGridHorizontal',
        x1: guideGridColumns[0],
        y1: row * rowHeight,
        x2: guideGridColumns[guideGridColumns.length - 1],
        y2: row * rowHeight,
      })
    }
    guideGridColumns.forEach((x) => {
      lines.push({ kind: 'guideGridVertical', x1: x, y1: 0, x2: x, y2: rowCount * rowHeight })
    })
  }

  lines.push({
    kind: 'divisionBracketTopLine',
    x1: dividendLeft,
    y1: dividendRow * rowHeight,
    x2: digitAreaRight,
    y2: dividendRow * rowHeight,
  })

  const decimalPoint: DecimalPoint | undefined = computation.decimalPointColumn !== null
    ? {
      kind: 'decimalPoint',
      boundaryColumn: computation.decimalPointColumn,
      row: quotientRow,
      x: dividendLeft + computation.decimalPointColumn * cellWidth,
    }
    : undefined

  return {
    width,
    height,
    rowCount,
    cellWidth,
    rowHeight,
    digitSize: cellWidth * fontSizeRatio,
    divisorLeft,
    dividendLeft,
    bracketArc: {
      kind: 'divisionBracketArc',
      left: bracketArcLeft,
      top: dividendRow * rowHeight,
      width: bracketArcWidth,
      height: rowHeight,
      cornerRadius: Math.min(bracketArcWidth, rowHeight) * Math.min(Math.max(bracketBend, 0.35), 1),
    },
    lines: [
      ...lines.filter(({ kind }) => kind === 'guideGridHorizontal' || kind === 'guideGridVertical'),
      ...lines.filter(({ kind }) => kind === 'divisionBracketTopLine'),
      ...lines.filter(({ kind }) => kind === 'subtractionBar'),
    ],
    digits,
    decimalPoint,
    ariaLabel: `${computation.dividendDigits} 除以 ${computation.divisorDigits} 的竖式`,
  }
}
