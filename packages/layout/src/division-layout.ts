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
    ({ dividendColumn }) => dividendColumn < computation.dividendDigits.length,
  )
  const fractionalSteps = computation.steps.filter(
    ({ dividendColumn }) => dividendColumn >= computation.dividendDigits.length,
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

const putNumber = (cells: string[], value: string, endColumn: number, token: string): void => {
  ;[...value].forEach((digit, index) => {
    cells[endColumn - value.length + index + 1] = macroTextCell(digit, token)
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
  const divisorColumnCount = computation.divisorDigits.length
  const bracketColumn = divisorColumnCount
  const dividendStart = bracketColumn + 1
  const totalColumns = dividendStart + computation.digitColumnCount
  const hasVisibleDecimalSeparator = visibleEvents.some(({ kind }) => kind === 'decimal-separator')
  const children: string[] = []

  const quotientCells = Array.from({ length: totalColumns }, macroEmptyCell)
  const latestTokenColumn = latestVisibleQuotientStep
    ? latestVisibleQuotientStep.dividendColumn +
      (computation.hasFraction && latestVisibleQuotientStep.dividendColumn >= computation.dividendDigits.length ? 1 : 0)
    : -1
  computation.quotientTokens.forEach((token) => {
    if (token.kind === 'digit') {
      if (settings.visibleStepCount !== undefined && token.column > latestTokenColumn) return
      const column =
        dividendStart +
        token.column -
        (computation.hasFraction && token.column > computation.dividendDigits.length ? 1 : 0)
      quotientCells[column] = macroTextCell(token.digit, 'division.quotient')
      return
    }
    if (hasVisibleDecimalSeparator) {
      const column = dividendStart + computation.dividendDigits.length - 1
      const digitBeforeSeparator = computation.quotientTokens.find(
        (item) => item.kind === 'digit' && item.column === computation.dividendDigits.length - 1,
      )
      quotientCells[column] =
        digitBeforeSeparator === undefined
          ? `CELL(DOT, ${macroOption('style', 'division.decimal-separator')})`
          : createDotCell(digitBeforeSeparator.digit, 'division.quotient', 'division.decimal-separator')
    }
  })
  children.push(macroRow(quotientCells))

  const dividendCells = Array.from({ length: totalColumns }, macroEmptyCell)
  ;[...computation.divisorDigits].forEach((digit, index) => {
    dividendCells[index] = macroTextCell(digit, 'division.divisor')
  })
  dividendCells[bracketColumn] = `CELL(BRACKET, ${macroOption('style', 'division.bracket')})`
  ;[...computation.dividendDigits].forEach((digit, index) => {
    dividendCells[dividendStart + index] = macroTextCell(digit, 'division.dividend')
  })
  if (computation.hasFraction && hasVisibleDecimalSeparator) {
    const lastDividendColumn = dividendStart + computation.dividendDigits.length - 1
    dividendCells[lastDividendColumn] = createDotCell(
      computation.dividendDigits.at(-1)!,
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
    `${computation.dividendDigits} 除以 ${computation.divisorDigits} 的竖式`,
    children,
  )
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createDivisionGridScene = (computation: DivisionComputation, settings: RenderSettings): GridScene =>
  compileCalculatorMacro(createDivisionMacroSource(computation, settings))
