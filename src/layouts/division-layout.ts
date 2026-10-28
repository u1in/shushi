/** Division layout adapter: converts DivisionComputation into a general BoardScene. */
import type { BoardCell, BoardScene, DivisionComputation, RenderSettings } from '../scene/types'

const DIVISOR_LEFT_PADDING = 20
const STAGE_RIGHT_PADDING = 26
const STAGE_BOTTOM_PADDING = 12
const MINIMUM_ROW_COUNT = 4
const BRACKET_TRACK_SIZE = 0.5
const DECIMAL_TRACK_SIZE = 0.34

const createTextCell = (
  id: string,
  text: string,
  column: number,
  row: number,
  styleToken?: string,
): BoardCell => ({
  id,
  position: { column, row },
  content: { kind: 'text', text, styleToken },
})

/**
 * Converts long-division data to a general variable-track board. The division
 * rules remain here; renderers only receive cells, tracks, and semantic tokens.
 */
export const createDivisionBoardScene = (
  computation: DivisionComputation,
  settings: RenderSettings,
): BoardScene => {
  const visibleSteps = settings.showZeroQuotientSteps
    ? computation.steps
    : computation.steps.filter(({ quotientDigit }) => quotientDigit !== '0')
  const dividendRow = 1
  const quotientRow = 0
  const finalRemainderRow = visibleSteps.length > 0 ? 1 + visibleSteps.length * 2 : 2
  const rowCount = Math.max(finalRemainderRow + 1, MINIMUM_ROW_COUNT)
  const divisorColumnCount = computation.divisorDigits.length
  const bracketColumn = divisorColumnCount
  const dividendStartColumn = bracketColumn + 1
  const decimalColumn = computation.hasFraction
    ? dividendStartColumn + computation.dividendDigits.length
    : null
  const sourceColumnToBoardColumn = (sourceColumn: number): number => (
    dividendStartColumn + sourceColumn + (
      computation.hasFraction && sourceColumn >= computation.dividendDigits.length ? 1 : 0
    )
  )
  const finalNumberColumn = sourceColumnToBoardColumn(computation.digitColumnCount - 1)
  const numberAreaEndColumn = finalNumberColumn + 1
  const columns = [
    ...Array.from({ length: divisorColumnCount }, (_, index) => ({ id: `divisor-${index}`, size: 1 })),
    { id: 'division-bracket', size: BRACKET_TRACK_SIZE },
    ...Array.from({ length: computation.dividendDigits.length }, (_, index) => ({ id: `dividend-${index}`, size: 1 })),
    ...(computation.hasFraction ? [{ id: 'decimal-separator', size: DECIMAL_TRACK_SIZE }] : []),
    ...Array.from({ length: computation.fractionalDigitCount }, (_, index) => ({ id: `appended-zero-${index}`, size: 1 })),
  ]
  const rows = Array.from({ length: rowCount }, (_, index) => ({ id: `row-${index}`, size: 1 }))
  const cells: BoardCell[] = []
  const placeNumber = (
    idPrefix: string,
    text: string,
    sourceEndColumn: number,
    row: number,
    styleToken: string,
  ): void => {
    const sourceFirstColumn = sourceEndColumn - text.length + 1
    ;[...text].forEach((digit, index) => {
      cells.push(createTextCell(
        `${idPrefix}-${index}`,
        digit,
        sourceColumnToBoardColumn(sourceFirstColumn + index),
        row,
        styleToken,
      ))
    })
  }

  ;[...computation.divisorDigits].forEach((digit, index) => {
    cells.push(createTextCell(`divisor-${index}`, digit, index, dividendRow, 'division.divisor'))
  })
  ;[...computation.dividendDigits].forEach((digit, index) => {
    cells.push(createTextCell(`dividend-${index}`, digit, sourceColumnToBoardColumn(index), dividendRow, 'division.dividend'))
  })
  for (let index = 0; index < computation.fractionalDigitCount; index += 1) {
    const sourceColumn = computation.dividendDigits.length + index
    cells.push(createTextCell(
      `appended-zero-${index}`,
      '0',
      sourceColumnToBoardColumn(sourceColumn),
      dividendRow,
      'division.appended-zero',
    ))
  }

  computation.quotientTokens.forEach((token, index) => {
    if (token.kind === 'digit') {
      cells.push(createTextCell(
        `quotient-${index}`,
        token.digit,
        dividendStartColumn + token.column,
        quotientRow,
        'division.quotient',
      ))
      return
    }

    if (decimalColumn === null) {
      throw new Error('小数分隔符只能出现在有限小数的棋盘中。')
    }
    cells.push(createTextCell(`decimal-separator-${index}`, token.digit, dividendStartColumn + token.column, quotientRow, 'division.decimal-separator'))
  })

  visibleSteps.forEach((step, stepIndex) => {
    const isFirstSubtraction = stepIndex === 0
    const partialDividendRow = isFirstSubtraction ? dividendRow : 1 + stepIndex * 2
    const productRow = isFirstSubtraction ? 2 : partialDividendRow + 1
    const sourceStartColumn = settings.uniformSubtractionBars
      ? Math.min(...visibleSteps.map(({ dividendColumn, partialDividend }) => dividendColumn - partialDividend.length + 1))
      : step.dividendColumn - step.partialDividend.length + 1

    if (!isFirstSubtraction) {
      placeNumber(`partial-minuend-${stepIndex}`, step.partialDividend, step.dividendColumn, partialDividendRow, 'division.partial-minuend')
    }
    placeNumber(`partial-subtrahend-${stepIndex}`, step.product, step.dividendColumn, productRow, 'division.partial-subtrahend')
    const subtractionStartColumn = sourceColumnToBoardColumn(sourceStartColumn)
    cells.push({
      id: `subtraction-bar-${stepIndex}`,
      position: { column: subtractionStartColumn, row: productRow, columnSpan: numberAreaEndColumn - subtractionStartColumn },
      edges: { bottom: true },
      styleToken: 'division.subtraction-bar',
    })
  })

  placeNumber('remainder', computation.remainder, computation.digitColumnCount - 1, finalRemainderRow, 'division.remainder')
  cells.push({
    id: 'division-bracket',
    position: { column: bracketColumn, row: dividendRow },
    content: {
      kind: 'corner',
      corner: 'bottomRight',
      radiusRatio: Math.min(Math.max(settings.bracketBend, 0.35), 1),
    },
    styleToken: 'division.bracket',
  })
  cells.push({
    id: 'division-bracket-top-line',
    position: { column: dividendStartColumn, row: dividendRow, columnSpan: numberAreaEndColumn - dividendStartColumn },
    edges: { top: true },
    styleToken: 'division.bracket-top-line',
  })

  return {
    columns,
    rows,
    padding: { top: 0, right: STAGE_RIGHT_PADDING, bottom: STAGE_BOTTOM_PADDING, left: DIVISOR_LEFT_PADDING },
    unitWidth: settings.cellWidth,
    unitHeight: settings.rowHeight,
    fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'board.default-text',
    textHorizontalAlign: settings.textHorizontalAlign ?? 'center',
    textVerticalAlign: settings.textVerticalAlign ?? 'center',
    cells,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.dividendDigits} 除以 ${computation.divisorDigits} 的竖式`,
  }
}
