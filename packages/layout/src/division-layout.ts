/** Division layout engine: turns DivisionComputation into a general GridScene. */
import type {
  GridElement,
  GridScene,
  GridTextContent,
  GridTrack,
} from '@vertical-arithmetic/grid'
import type { DivisionComputation, LongDivisionStep } from '@vertical-arithmetic/calculators'
import type { RenderSettings } from './types'

const DIVISOR_LEFT_PADDING = 20
const STAGE_RIGHT_PADDING = 26
const STAGE_BOTTOM_PADDING = 12
const MINIMUM_ROW_COUNT = 4
const BRACKET_TRACK_SIZE = 0.5

/** 除法播放把数学运算与“商补零/小数点”教学动作分开，避免提前改动下方竖式。 */
type DivisionPlaybackEvent =
  | { kind: 'calculation', step: LongDivisionStep }
  | { kind: 'decimal-separator' }
  | { kind: 'zero-quotient', step: LongDivisionStep }

const createDivisionPlaybackEvents = (
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): DivisionPlaybackEvent[] => {
  const shouldShowCalculation = ({ quotientDigit }: LongDivisionStep): boolean => (
    showZeroQuotientSteps || quotientDigit !== '0'
  )
  const integerSteps = computation.steps.filter(({ dividendColumn }) => dividendColumn < computation.dividendDigits.length)
  const fractionalSteps = computation.steps.filter(({ dividendColumn }) => dividendColumn >= computation.dividendDigits.length)
  const createStepEvents = (step: LongDivisionStep): DivisionPlaybackEvent[] => (
    shouldShowCalculation(step)
      ? [{ kind: 'calculation', step }]
      // 隐藏零商试除时，商位本身仍需单独出现，但不影响下方已有的减法过程。
      : [{ kind: 'zero-quotient', step }]
  )
  const events: DivisionPlaybackEvent[] = integerSteps.flatMap(createStepEvents)

  if (!computation.hasFraction) return events

  // 小数点先进入商；随后每一位小数的试商和减法仍由独立计算事件处理。
  events.push({ kind: 'decimal-separator' })
  events.push(...fractionalSteps.flatMap(createStepEvents))

  return events
}

/** 供页面播放控件使用，确保游标步数与版式中的教学事件完全一致。 */
export const getDivisionPlaybackStepCount = (
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): number => createDivisionPlaybackEvents(computation, showZeroQuotientSteps).length

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
 * Converts long-division data to a general variable-track grid. The division
 * rules remain here; renderers only receive elements, tracks, and semantic tokens.
 * Lines and decimal separators use explicit grid boundaries, never hidden
 * zero-size tracks.
 */
export const createDivisionGridScene = (
  computation: DivisionComputation,
  settings: RenderSettings,
): GridScene => {
  const playbackEvents = createDivisionPlaybackEvents(computation, settings.showZeroQuotientSteps)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? playbackEvents.length, 0), playbackEvents.length)
  const visibleEvents = playbackEvents.slice(0, visibleStepCount)
  const visibleSteps = visibleEvents.flatMap((event) => event.kind === 'calculation' ? [event.step] : [])
  const latestVisibleQuotientStep = visibleEvents
    .filter((event): event is Extract<DivisionPlaybackEvent, { kind: 'calculation' | 'zero-quotient' }> => (
      event.kind === 'calculation' || event.kind === 'zero-quotient'
    ))
    .at(-1)?.step
  // 小数补零是对应试商的输入；零商的独立提示步骤不改动被除数行。
  const visibleAppendedZeroColumns = new Set(
    visibleSteps
      .filter(({ dividendColumn }) => dividendColumn >= computation.dividendDigits.length)
      .map(({ dividendColumn }) => dividendColumn),
  )
  const divisorColumnCount = computation.divisorDigits.length
  const bracketColumn = divisorColumnCount
  const dividendStartColumn = bracketColumn + 1
  const sourceColumnToGridColumn = (sourceColumn: number): number => dividendStartColumn + sourceColumn
  /** quotientTokens 为小数点保留逻辑列；网格把点放在边上，不额外消耗一列。 */
  const quotientTokenToGridColumn = (tokenColumn: number): number => (
    dividendStartColumn + tokenColumn - (computation.hasFraction && tokenColumn > computation.dividendDigits.length ? 1 : 0)
  )
  const finalNumberColumn = sourceColumnToGridColumn(computation.digitColumnCount - 1)
  const numberAreaEndColumn = finalNumberColumn + 1
  const columns = [
    ...Array.from({ length: divisorColumnCount }, (_, index) => ({ id: `divisor-${index}`, size: 1 })),
    { id: 'division-bracket', size: BRACKET_TRACK_SIZE },
    ...Array.from({ length: computation.dividendDigits.length }, (_, index) => ({ id: `dividend-${index}`, size: 1 })),
    ...Array.from({ length: computation.fractionalDigitCount }, (_, index) => ({ id: `appended-zero-${index}`, size: 1 })),
  ]
  const rows: GridTrack[] = []
  const elements: GridElement[] = []
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
      elements.push(createTextElement(
        `${idPrefix}-${index}`,
        digit,
        sourceColumnToGridColumn(sourceFirstColumn + index),
        row,
        styleToken,
      ))
    })
  }

  const quotientRow = appendRow('quotient-row')
  const dividendRow = appendRow('dividend-row')

  ;[...computation.divisorDigits].forEach((digit, index) => {
    elements.push(createTextElement(`divisor-${index}`, digit, index, dividendRow, 'division.divisor'))
  })
  ;[...computation.dividendDigits].forEach((digit, index) => {
    elements.push(createTextElement(`dividend-${index}`, digit, sourceColumnToGridColumn(index), dividendRow, 'division.dividend'))
  })
  // 小数点既是商的读法，也是被除数“补 0”前的边界；两个位置必须在同一教学事件出现。
  const hasVisibleDecimalSeparator = visibleEvents.some(({ kind }) => kind === 'decimal-separator')
  if (computation.hasFraction && hasVisibleDecimalSeparator) {
    elements.push({
      id: 'dividend-decimal-separator',
      position: {
        kind: 'edgeMidpoint',
        column: dividendStartColumn + computation.dividendDigits.length - 1,
        row: dividendRow,
        edge: 'right',
      },
      content: {
        kind: 'text', text: '.', styleToken: 'division.dividend-decimal-separator', horizontalAlign: 'center',
      },
    })
  }
  for (let index = 0; index < computation.fractionalDigitCount; index += 1) {
    const sourceColumn = computation.dividendDigits.length + index
    if (!visibleAppendedZeroColumns.has(sourceColumn)) continue
    elements.push(createTextElement(
      `appended-zero-${index}`,
      '0',
      sourceColumnToGridColumn(sourceColumn),
      dividendRow,
      'division.appended-zero',
    ))
  }

  const latestVisibleStep = visibleSteps.at(-1)
  // 零商过程行可以隐藏，但它仍是正式商的一位；当后续步骤完成时，商必须连续显示。
  const latestVisibleTokenColumn = latestVisibleQuotientStep
    ? latestVisibleQuotientStep.dividendColumn + (
      computation.hasFraction && latestVisibleQuotientStep.dividendColumn >= computation.dividendDigits.length ? 1 : 0
    )
    : -1
  computation.quotientTokens.forEach((token, index) => {
    if (token.kind === 'digit') {
      if (settings.visibleStepCount !== undefined && token.column > latestVisibleTokenColumn) return
      elements.push(createTextElement(
        `quotient-${index}`,
        token.digit,
        quotientTokenToGridColumn(token.column),
        quotientRow,
        'division.quotient',
      ))
      return
    }

    if (!computation.hasFraction) {
      throw new Error('小数分隔符只能出现在有限小数的网格中。')
    }
    if (settings.visibleStepCount !== undefined && !hasVisibleDecimalSeparator) return
    elements.push({
      id: `decimal-separator-${index}`,
      position: { kind: 'edgeMidpoint', column: dividendStartColumn + computation.dividendDigits.length - 1, row: quotientRow, edge: 'right' },
      content: { kind: 'text', text: token.digit, styleToken: 'division.decimal-separator', horizontalAlign: 'center' },
    })
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
    const subtractionStartColumn = sourceColumnToGridColumn(sourceStartColumn)
    elements.push({
      id: `subtraction-bar-${stepIndex}`,
      position: {
        kind: 'edge',
        column: subtractionStartColumn,
        row: productRow,
        columnSpan: numberAreaEndColumn - subtractionStartColumn,
        edge: 'bottom',
      },
      content: { kind: 'line' },
      styleToken: 'division.subtraction-bar',
    })
  })

  const remainderRow = appendRow('remainder-row')
  const visibleRemainder = settings.visibleStepCount === undefined ? computation.remainder : visibleSteps.at(-1)?.remainder ?? ''
  // 与普通减法的差一样，过程余数右对齐到本轮部分被除数的末位，而非整题最右列。
  const remainderEndColumn = settings.visibleStepCount === undefined
    ? computation.digitColumnCount - 1
    : latestVisibleStep?.dividendColumn
  if (remainderEndColumn !== undefined) {
    placeNumber('remainder', visibleRemainder, remainderEndColumn, remainderRow, 'division.remainder')
  }

  elements.push({
    id: 'division-bracket',
    position: { kind: 'cell', column: bracketColumn, row: dividendRow },
    content: {
      kind: 'corner',
      corner: 'bottomRight',
      radiusRatio: Math.min(Math.max(settings.bracketBend, 0.35), 1),
    },
    styleToken: 'division.bracket',
  })
  elements.push({
    id: 'division-bracket-top-line',
    position: {
      kind: 'edge',
      column: dividendStartColumn,
      row: dividendRow,
      columnSpan: numberAreaEndColumn - dividendStartColumn,
      edge: 'top',
    },
    content: { kind: 'line' },
    styleToken: 'division.bracket-top-line',
  })

  while (rows.length < MINIMUM_ROW_COUNT) {
    appendRow(`spacer-row-${rows.length}`)
  }

  return {
    columns,
    rows,
    padding: { top: 0, right: STAGE_RIGHT_PADDING, bottom: STAGE_BOTTOM_PADDING, left: DIVISOR_LEFT_PADDING },
    unitWidth: settings.cellWidth,
    unitHeight: settings.rowHeight,
    fontSize: settings.cellWidth * settings.fontSizeRatio,
    defaultTextStyleToken: 'grid.default-text',
    textHorizontalAlign: settings.textHorizontalAlign ?? 'center',
    textVerticalAlign: settings.textVerticalAlign ?? 'center',
    elements,
    showGuideGrid: settings.showGuideGrid,
    ariaLabel: `${computation.dividendDigits} 除以 ${computation.divisorDigits} 的竖式`,
  }
}
