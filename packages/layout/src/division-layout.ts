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
  | { kind: 'normalization'; shift: number }
  | { kind: 'calculation'; step: LongDivisionStep }
  | { kind: 'decimal-separator' }
  | { kind: 'zero-quotient'; step: LongDivisionStep }

const createDivisionPlaybackEvents = (
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): DivisionPlaybackEvent[] =>
  computation.calculationSteps.flatMap<DivisionPlaybackEvent>((snapshot) => {
    if (snapshot.action === 'shift-decimal' && typeof snapshot.shift === 'number')
      return [{ kind: 'normalization', shift: snapshot.shift }]
    if (snapshot.action === 'place-decimal') return [{ kind: 'decimal-separator' }]
    if (
      snapshot.action !== 'divide-column' ||
      snapshot.column === undefined ||
      !snapshot.inputs?.[0] ||
      !snapshot.inputs[1] ||
      !snapshot.result ||
      !snapshot.product ||
      snapshot.remainder === undefined
    )
      return []
    const divisionStep: LongDivisionStep = {
      dividendColumn: snapshot.column,
      divisor: snapshot.inputs[1],
      quotientDigit: snapshot.result.at(-1) ?? '0',
      partialDividend: snapshot.inputs[0],
      product: snapshot.product,
      remainder: snapshot.remainder,
    }
    return showZeroQuotientSteps || divisionStep.quotientDigit !== '0'
      ? [{ kind: 'calculation', step: divisionStep }]
      : [{ kind: 'zero-quotient', step: divisionStep }]
  })

/** 供播放控件读取；与宏快照生成使用同一事件序列。 */
export const getDivisionPlaybackStepCount = (
  computation: DivisionComputation,
  _showZeroQuotientSteps: boolean,
): number => computation.calculationSteps.length

const createDotCell = (digit: string, digitToken: string, dotToken: string): string =>
  `CELL(MM(${macroLiteral(digit)}, ${macroOption('style', digitToken)}), DOT, ${macroOption('style', dotToken)})`

/** 等值变换中被移过的数字与小数点保留在原单元格，以删除线说明它们不再属于当前数值。 */
const createShiftedDisplayCell = (
  digit: string,
  digitToken: string,
  dotToken: string,
  strikeDigit: boolean,
  strikeSourceDot: boolean,
  showCurrentDot: boolean,
): string =>
  `CELL(${[
    `MM(${macroLiteral(digit)}, ${macroOption('style', digitToken)})`,
    ...(strikeDigit ? [`STRIKE(${macroOption('style', 'division.normalization-strike')})`] : []),
    ...(strikeSourceDot ? ['STRIKEDOT'] : []),
    ...(showCurrentDot ? ['DOT'] : []),
    macroOption('style', dotToken),
  ].join(', ')})`

const putNumber = (cells: string[], value: string, endColumn: number, token: string): void => {
  ;[...value].forEach((digit, index) => {
    cells[endColumn - value.length + index + 1] = macroTextCell(digit, token)
  })
}

/** 取得当前等值变换帧的原始数字列；右移越过末位时才追加教学补零。 */
const getShiftedInputDigits = (sourceValue: string, shift: number): string => {
  const sourceDigits = sourceValue.replace('.', '')
  const sourceDecimalIndex = sourceValue.includes('.') ? sourceValue.indexOf('.') : sourceValue.length
  const currentDecimalIndex = sourceDecimalIndex + shift
  return `${sourceDigits}${'0'.repeat(Math.max(currentDecimalIndex - sourceDigits.length, 0))}`
}

/**
 * 每个播放帧都独立决定输入组和网格的右边界，绝不读取最终商位或未来补零。
 * 输入组从当前除数开始连续排到当前被除数；已显示的计算列才允许把该帧向右扩展。
 */
const getDivisionFrameColumns = (
  sourceDivisor: string,
  sourceDividend: string,
  normalizationShift: number,
  latestVisibleLogicalColumn: number,
): {
  divisorStart: number
  bracketColumn: number
  dividendStart: number
  totalColumns: number
} => {
  const divisorDigitCount = getShiftedInputDigits(sourceDivisor, normalizationShift).length
  const dividendDigitCount = getShiftedInputDigits(sourceDividend, normalizationShift).length
  const divisorStart = 0
  const bracketColumn = divisorStart + divisorDigitCount
  const dividendStart = bracketColumn + 1
  const inputRightEdge = dividendStart + dividendDigitCount
  const calculationRightEdge = latestVisibleLogicalColumn < 0 ? 0 : dividendStart + latestVisibleLogicalColumn + 1

  return {
    divisorStart,
    bracketColumn,
    dividendStart,
    totalColumns: Math.max(inputRightEdge, calculationRightEdge),
  }
}

/** 每帧在原数字列上移动小数点，并划掉不再属于当前整数部分的前导零。 */
const putShiftedInput = (
  cells: string[],
  sourceValue: string,
  shift: number,
  startColumn: number,
  digitToken: string,
  dotToken: string,
): void => {
  const sourceDecimalIndex = sourceValue.includes('.') ? sourceValue.indexOf('.') : sourceValue.length
  const currentDecimalIndex = sourceDecimalIndex + shift
  const displayDigits = getShiftedInputDigits(sourceValue, shift)
  const currentIntegerDigits = displayDigits.slice(0, currentDecimalIndex)
  const normalizedInteger = currentIntegerDigits.replace(/^0+(?=\d)/, '') || '0'
  const struckLeadingZeroCount = currentIntegerDigits.length - normalizedInteger.length
  const sourceDecimalDigitIndex = sourceDecimalIndex - 1
  const currentDecimalDigitIndex = currentDecimalIndex < displayDigits.length ? currentDecimalIndex - 1 : -1

  ;[...displayDigits].forEach((digit, index) => {
    cells[startColumn + index] = createShiftedDisplayCell(
      digit,
      digitToken,
      dotToken,
      index < struckLeadingZeroCount,
      shift > 0 && index === sourceDecimalDigitIndex,
      index === currentDecimalDigitIndex,
    )
  })
}

/**
 * 将除法过程转为人类可复制的宏字符串。横线利用 LINE(adjacent) 的公开对齐规则，
 * 不再直接写 GridElement 边界坐标。
 */
export const createDivisionMacroSource = (computation: DivisionComputation, settings: RenderSettings): string => {
  const events = createDivisionPlaybackEvents(computation, settings.showZeroQuotientSteps)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? events.length, 0), events.length)
  const visibleEvents = events.slice(0, visibleStepCount)
  const visibleSteps = visibleEvents.flatMap((event) => (event.kind === 'calculation' ? [event.step] : []))
  const visibleNormalizationShift =
    visibleEvents
      .filter(
        (event): event is Extract<DivisionPlaybackEvent, { kind: 'normalization' }> => event.kind === 'normalization',
      )
      .at(-1)?.shift ?? 0
  const latestVisibleQuotientStep = visibleEvents
    .filter(
      (event): event is Extract<DivisionPlaybackEvent, { kind: 'calculation' | 'zero-quotient' }> =>
        event.kind === 'calculation' || event.kind === 'zero-quotient',
    )
    .at(-1)?.step
  const latestVisibleLogicalColumn = latestVisibleQuotientStep?.dividendColumn ?? -1
  const { divisorStart, bracketColumn, dividendStart, totalColumns } = getDivisionFrameColumns(
    computation.sourceDivisorText,
    computation.sourceDividendText,
    visibleNormalizationShift,
    latestVisibleLogicalColumn,
  )
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
  putShiftedInput(
    dividendCells,
    computation.sourceDivisorText,
    visibleNormalizationShift,
    divisorStart,
    'division.divisor',
    'division.divisor-decimal-separator',
  )
  dividendCells[bracketColumn] = `CELL(BRACKET, ${macroOption('style', 'division.bracket')})`
  putShiftedInput(
    dividendCells,
    computation.sourceDividendText,
    visibleNormalizationShift,
    // 被除数直接紧贴厂字弯；当前帧只按自己可见的数位生成列。
    dividendStart,
    'division.dividend',
    'division.dividend-decimal-separator',
  )
  if (computation.hasFraction && hasVisibleDecimalSeparator && !computation.dividendText.includes('.')) {
    const lastDividendColumn = dividendStart + computation.integerDividendDigitCount - 1
    dividendCells[lastDividendColumn] = createDotCell(
      computation.dividendDigits[computation.integerDividendDigitCount - 1],
      'division.dividend',
      'division.dividend-decimal-separator',
    )
  }
  // 只从已经发生的试商步骤取得补零列，不遍历未来小数位。
  visibleSteps
    .filter(({ dividendColumn }) => dividendColumn >= computation.dividendDigits.length)
    .forEach(({ dividendColumn }) => {
      dividendCells[dividendStart + dividendColumn] = macroTextCell('0', 'division.appended-zero')
    })
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
    // 只写横线起点右侧的宏单元格，LINE(adjacent) 会结合上下相邻行确定共同跨度。
    const productCells = Array.from({ length: totalColumns - dividendStart - sourceStart }, macroEmptyCell)
    putNumber(productCells, step.product, step.dividendColumn - sourceStart, 'division.partial-subtrahend')
    children.push(macroRow(productCells))
    children.push(macroLine('division.subtraction-bar', 'adjacent'))
  })

  const remainderCells = Array.from({ length: totalColumns }, macroEmptyCell)
  const visibleRemainder =
    settings.visibleStepCount === undefined ? computation.remainder : (visibleSteps.at(-1)?.remainder ?? '')
  const remainderEnd =
    settings.visibleStepCount === undefined ? computation.digitColumnCount - 1 : visibleSteps.at(-1)?.dividendColumn
  if (remainderEnd !== undefined)
    putNumber(remainderCells, visibleRemainder, dividendStart + remainderEnd, 'division.remainder')
  children.push(macroRow(remainderCells))

  return macroGrid(totalColumns, settings, children)
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createDivisionGridScene = (computation: DivisionComputation, settings: RenderSettings): GridScene =>
  compileCalculatorMacro(createDivisionMacroSource(computation, settings))
