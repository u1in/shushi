/** Division layout adapter: converts DivisionComputation into a general BoardScene. */
import type {
  BoardCell,
  BoardScene,
  BoardTextContent,
  BoardTrack,
  DivisionComputation,
  RenderSettings,
} from '../scene/types'

const DIVISOR_LEFT_PADDING = 20
const STAGE_RIGHT_PADDING = 26
const STAGE_BOTTOM_PADDING = 12
const MINIMUM_ROW_COUNT = 4
const BRACKET_TRACK_SIZE = 0.5
/** Zero-width anchor column: the decimal point sits exactly on the column boundary. */
const DECIMAL_TRACK_SIZE = 0

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

/**
 * Converts long-division data to a general variable-track board. The division
 * rules remain here; renderers only receive cells, tracks, and semantic tokens.
 * Horizontal rules live on their own zero-height rows, so a rule keeps the same
 * boundary no matter which content row sits above it.
 */
export const createDivisionBoardScene = (
  computation: DivisionComputation,
  settings: RenderSettings,
): BoardScene => {
  const visibleSteps = settings.showZeroQuotientSteps
    ? computation.steps
    : computation.steps.filter(({ quotientDigit }) => quotientDigit !== '0')
  const divisorColumnCount = computation.divisorDigits.length
  const bracketColumn = divisorColumnCount
  const dividendStartColumn = bracketColumn + 1
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
  const rows: BoardTrack[] = []
  const cells: BoardCell[] = []
  const appendRow = (id: string, size = 1): number => {
    rows.push({ id, size })
    return rows.length - 1
  }
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

  const quotientRow = appendRow('quotient-row')
  const bracketTopLineRow = appendRow('bracket-top-line-row', 0)
  const dividendRow = appendRow('dividend-row')

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

    if (!computation.hasFraction) {
      throw new Error('小数分隔符只能出现在有限小数的棋盘中。')
    }
    cells.push(createTextCell(
      `decimal-separator-${index}`,
      token.digit,
      dividendStartColumn + token.column,
      quotientRow,
      'division.decimal-separator',
      { horizontalAlign: 'center' },
    ))
  })

  visibleSteps.forEach((step, stepIndex) => {
    const isFirstSubtraction = stepIndex === 0
    const sourceStartColumn = settings.uniformSubtractionBars
      ? Math.min(...visibleSteps.map(({ dividendColumn, partialDividend }) => dividendColumn - partialDividend.length + 1))
      : step.dividendColumn - step.partialDividend.length + 1

    if (!isFirstSubtraction) {
      const partialDividendRow = appendRow(`partial-minuend-row-${stepIndex}`)
      placeNumber(`partial-minuend-${stepIndex}`, step.partialDividend, step.dividendColumn, partialDividendRow, 'division.partial-minuend')
    }
    const productRow = appendRow(`product-row-${stepIndex}`)
    placeNumber(`partial-subtrahend-${stepIndex}`, step.product, step.dividendColumn, productRow, 'division.partial-subtrahend')
    const subtractionBarRow = appendRow(`subtraction-bar-row-${stepIndex}`, 0)
    const subtractionStartColumn = sourceColumnToBoardColumn(sourceStartColumn)
    cells.push({
      id: `subtraction-bar-${stepIndex}`,
      position: {
        column: subtractionStartColumn,
        row: subtractionBarRow,
        columnSpan: numberAreaEndColumn - subtractionStartColumn,
      },
      edges: { bottom: true },
      styleToken: 'division.subtraction-bar',
    })
  })

  const remainderRow = appendRow('remainder-row')
  placeNumber('remainder', computation.remainder, computation.digitColumnCount - 1, remainderRow, 'division.remainder')

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
    position: {
      column: dividendStartColumn,
      row: bracketTopLineRow,
      columnSpan: numberAreaEndColumn - dividendStartColumn,
    },
    edges: { bottom: true },
    styleToken: 'division.bracket-top-line',
  })

  while (rows.filter(({ size }) => size > 0).length < MINIMUM_ROW_COUNT) {
    appendRow(`spacer-row-${rows.length}`)
  }

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
