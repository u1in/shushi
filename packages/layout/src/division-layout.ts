/** Long-division macro layout: serializes every visible teaching snapshot as macro source. */
import type { GridScene } from '@u1in/shushi-grid'
import type { DivisionComputation, LongDivisionStep } from '@u1in/shushi-calculators'
import type { RenderSettings } from './types'
import {
  compileCalculatorMacro,
  macroEmptyCell,
  macroGrid,
  macroLine,
  macroLiteral,
  macroOption,
  macroRow,
  macroTextCell,
} from './macro-source'

type DivisionPlaybackEvent =
  | { kind: 'calculation'; step: LongDivisionStep }
  | { kind: 'decimal-separator' }
  | { kind: 'zero-quotient'; step: LongDivisionStep }

const createDivisionPlaybackEvents = (
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): DivisionPlaybackEvent[] => {
  const integerSteps = computation.steps.filter(
    ({ dividendColumn }) => dividendColumn < computation.integerDividendDigitCount,
  )
  const fractionalSteps = computation.steps.filter(
    ({ dividendColumn }) => dividendColumn >= computation.integerDividendDigitCount,
  )
  const eventForStep = (step: LongDivisionStep): DivisionPlaybackEvent[] =>
    showZeroQuotientSteps || step.quotientDigit !== '0'
      ? [{ kind: 'calculation', step }]
      : [{ kind: 'zero-quotient', step }]
  const events = integerSteps.flatMap(eventForStep)
  if (computation.hasFraction) events.push({ kind: 'decimal-separator' }, ...fractionalSteps.flatMap(eventForStep))
  return events
}

/** 供播放控件读取；与宏快照生成使用同一事件序列。 */
export const getDivisionPlaybackStepCount = (
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): number => createDivisionPlaybackEvents(computation, showZeroQuotientSteps).length

const createDotCell = (digit: string, digitToken: string, dotToken: string): string =>
  `CELL(MM(${macroLiteral(digit)}, ${macroOption('style', digitToken)}), DOT, ${macroOption('style', dotToken)})`

/** 只组合删除线宏；STRIKE 划当前数字，STRIKEDOT 同时输出小数点与短删除线。 */
const createStrike = (): string => `STRIKE(${macroOption('style', 'division.normalization-strike')})`

const createDisplayCell = (
  digit: string,
  digitToken: string,
  dotToken: string,
  hasDot: boolean,
  strikeDigit: boolean,
  strikeDot: boolean,
): string =>
  `CELL(${[
    `MM(${macroLiteral(digit)}, ${macroOption('style', digitToken)})`,
    ...(strikeDigit ? [createStrike()] : []),
    ...(hasDot ? [strikeDot ? 'STRIKEDOT' : 'DOT', macroOption('style', dotToken)] : []),
  ].join(', ')})`

const putNumber = (cells: string[], value: string, endColumn: number, token: string): void => {
  ;[...value].forEach((digit, index) => {
    cells[endColumn - value.length + index + 1] = macroTextCell(digit, token)
  })
}

/**
 * 小数除法仍按等值整数过程计算，但输入行保留原始写法。
 * 被右移的小数点和除数中被消去的前导零以独立 STRIKE 图元标出，
 * 所以渲染器不需要知道任何除法规则。
 */
const putNormalizedInput = (
  cells: string[],
  sourceValue: string,
  normalizedValue: string,
  startColumn: number,
  digitToken: string,
  dotToken: string,
  normalizationShift: number,
  strikeLeadingZeroCount = 0,
): void => {
  const sourceDigits = sourceValue.replace('.', '')
  const normalizedDigits = normalizedValue.replace('.', '')
  const displayDigits = `${sourceDigits}${normalizedDigits.slice(sourceDigits.length)}`
  const sourceDotIndex = sourceValue.includes('.') ? sourceValue.indexOf('.') - 1 : -1
  const normalizedDotIndex = normalizedValue.includes('.') ? normalizedValue.indexOf('.') - 1 : -1

  ;[...displayDigits].forEach((digit, index) => {
    const hasSourceDot = index === sourceDotIndex
    const hasNormalizedDot = index === normalizedDotIndex
    cells[startColumn + index] = createDisplayCell(
      digit,
      digitToken,
      dotToken,
      hasSourceDot || hasNormalizedDot,
      index < strikeLeadingZeroCount,
      normalizationShift > 0 && hasSourceDot,
    )
  })
}

/**
 * 将除法过程转为人类可复制的宏字符串。横线利用 LINE(previous) 的公开对齐规则，
 * 不再直接写 GridElement 边界坐标。
 */
export const createDivisionMacroSource = (computation: DivisionComputation, settings: RenderSettings): string => {
  const events = createDivisionPlaybackEvents(computation, settings.showZeroQuotientSteps)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? events.length, 0), events.length)
  const visibleEvents = events.slice(0, visibleStepCount)
  const visibleSteps = visibleEvents.flatMap((event) => (event.kind === 'calculation' ? [event.step] : []))
  const latestVisibleQuotientStep = visibleEvents
    .filter(
      (event): event is Extract<DivisionPlaybackEvent, { kind: 'calculation' | 'zero-quotient' }> =>
        event.kind !== 'decimal-separator',
    )
    .at(-1)?.step
  const sourceDivisorDigitCount = computation.sourceDivisorText.replace('.', '').length
  const sourceDividendDigitCount = computation.sourceDividendText.replace('.', '').length
  const transformedDividendDigitCount = computation.dividendText.replace('.', '').length
  const divisorColumnCount = Math.max(computation.divisorDigits.length, sourceDivisorDigitCount)
  const bracketColumn = divisorColumnCount
  const dividendStart = bracketColumn + 1
  const totalColumns =
    dividendStart + Math.max(computation.digitColumnCount, sourceDividendDigitCount, transformedDividendDigitCount)
  const hasVisibleDecimalSeparator = visibleEvents.some(({ kind }) => kind === 'decimal-separator')
  const children: string[] = []

  const quotientCells = Array.from({ length: totalColumns }, macroEmptyCell)
  const latestTokenColumn = latestVisibleQuotientStep ? latestVisibleQuotientStep.dividendColumn : -1
  computation.quotientTokens.forEach((token) => {
    if (token.kind === 'digit') {
      if (settings.visibleStepCount !== undefined && token.column > latestTokenColumn) return
      const column = dividendStart + token.column
      quotientCells[column] = macroTextCell(token.digit, 'division.quotient')
      return
    }
    if (hasVisibleDecimalSeparator) {
      const column = dividendStart + computation.integerDividendDigitCount - 1
      const digitBeforeSeparator = computation.quotientTokens.find(
        (item) => item.kind === 'digit' && item.column === computation.integerDividendDigitCount - 1,
      )
      quotientCells[column] =
        digitBeforeSeparator === undefined
          ? `CELL(DOT, ${macroOption('style', 'division.decimal-separator')})`
          : createDotCell(digitBeforeSeparator.digit, 'division.quotient', 'division.decimal-separator')
    }
  })
  children.push(macroRow(quotientCells))

  const dividendCells = Array.from({ length: totalColumns }, macroEmptyCell)
  const divisorLeadingZeroCount = Math.max(sourceDivisorDigitCount - computation.divisorDigits.length, 0)
  putNormalizedInput(
    dividendCells,
    computation.sourceDivisorText,
    computation.divisorText,
    divisorColumnCount - sourceDivisorDigitCount,
    'division.divisor',
    'division.divisor-decimal-separator',
    computation.normalizationShift,
    divisorLeadingZeroCount,
  )
  dividendCells[bracketColumn] = `CELL(BRACKET, ${macroOption('style', 'division.bracket')})`
  putNormalizedInput(
    dividendCells,
    computation.sourceDividendText,
    computation.dividendText,
    dividendStart,
    'division.dividend',
    'division.dividend-decimal-separator',
    computation.normalizationShift,
  )
  if (computation.hasFraction && hasVisibleDecimalSeparator && !computation.dividendText.includes('.')) {
    const lastDividendColumn = dividendStart + computation.integerDividendDigitCount - 1
    dividendCells[lastDividendColumn] = createDotCell(
      computation.dividendDigits[computation.integerDividendDigitCount - 1],
      'division.dividend',
      'division.dividend-decimal-separator',
    )
  }
  const appendedZeroColumns = new Set(
    visibleSteps
      .filter(({ dividendColumn }) => dividendColumn >= computation.dividendDigits.length)
      .map(({ dividendColumn }) => dividendColumn),
  )
  for (let index = 0; index < computation.fractionalDigitCount; index += 1) {
    const sourceColumn = computation.dividendDigits.length + index
    if (appendedZeroColumns.has(sourceColumn))
      dividendCells[dividendStart + sourceColumn] = macroTextCell('0', 'division.appended-zero')
  }
  children.push(macroRow(dividendCells))

  visibleSteps.forEach((step, stepIndex) => {
    const sourceStart = settings.uniformSubtractionBars
      ? Math.min(
          ...visibleSteps.map(({ dividendColumn, partialDividend }) => dividendColumn - partialDividend.length + 1),
        )
      : step.dividendColumn - step.partialDividend.length + 1
    if (stepIndex > 0) {
      const partialCells = Array.from({ length: totalColumns }, macroEmptyCell)
      putNumber(partialCells, step.partialDividend, dividendStart + step.dividendColumn, 'division.partial-minuend')
      children.push(macroRow(partialCells))
    }
    // 只写横线起点右侧的宏单元格，LINE(previous) 便得到同一公开跨度。
    const productCells = Array.from({ length: totalColumns - dividendStart - sourceStart }, macroEmptyCell)
    putNumber(productCells, step.product, step.dividendColumn - sourceStart, 'division.partial-subtrahend')
    children.push(macroRow(productCells))
    children.push(macroLine('division.subtraction-bar', 'previous'))
  })

  const remainderCells = Array.from({ length: totalColumns }, macroEmptyCell)
  const visibleRemainder =
    settings.visibleStepCount === undefined ? computation.remainder : (visibleSteps.at(-1)?.remainder ?? '')
  const remainderEnd =
    settings.visibleStepCount === undefined ? computation.digitColumnCount - 1 : visibleSteps.at(-1)?.dividendColumn
  if (remainderEnd !== undefined)
    putNumber(remainderCells, visibleRemainder, dividendStart + remainderEnd, 'division.remainder')
  children.push(macroRow(remainderCells))

  return macroGrid(
    totalColumns,
    settings,
    `${computation.dividendText} 除以 ${computation.divisorText} 的竖式`,
    children,
  )
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createDivisionGridScene = (computation: DivisionComputation, settings: RenderSettings): GridScene =>
  compileCalculatorMacro(createDivisionMacroSource(computation, settings))
