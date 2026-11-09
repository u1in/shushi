/** Subtraction macro layout: serializes borrowing records into macro source. */
import type { GridScene } from '@u1in/shushi-grid'
import type { SubtractionComputation } from '@u1in/shushi-calculators'
import type { SubtractionRenderSettings } from './types'
import { appendDecimalZeros, createDecimalPaddingEvents, getVisibleDecimalPaddingCounts } from './decimal-padding'
import {
  compileCalculatorMacro,
  macroAnnotationCell,
  macroBorrowDot,
  macroEmptyCell,
  macroGrid,
  macroLine,
  macroLiteral,
  macroOption,
  macroRow,
  macroTextCell,
  shouldStrikeMinimalDecimalResult,
} from './macro-source'

/** 小数点附着在整数末位；绝对值小于 1 的中间帧则用独立点格呈现 `.51`。 */
const decimalCell = (digit: string, token: string, annotations: string[] = []): string =>
  `CELL(MM(${macroLiteral(digit)}, ${macroOption('style', token)}), DOT, ${macroOption(
    'style',
    'subtraction.decimal-separator',
  )}${annotations.length ? `, ${annotations.join(', ')}` : ''})`

const decimalMarkerCell = (): string => `CELL(DOT, ${macroOption('style', 'subtraction.decimal-separator')})`

const placeNumber = (
  cells: string[],
  value: string,
  token: string,
  decimalPlaces: number,
  showDecimalPoint = true,
  firstColumn?: number,
  annotationsByDigitIndex: Map<number, string[]> = new Map(),
): void => {
  const start = firstColumn ?? cells.length - value.length
  ;[...value].forEach((digit, index) => {
    const isDecimalAnchor = showDecimalPoint && decimalPlaces > 0 && index === value.length - decimalPlaces - 1
    const annotations = annotationsByDigitIndex.get(index) ?? []
    cells[start + index] = isDecimalAnchor
      ? decimalCell(digit, token, annotations)
      : macroTextCell(digit, token, annotations)
  })
}

/** 小数结果在所有数位完成后先单独标点；不足 1 时最后才补齐整数位的 0。 */
const getResultDigitStepCount = (computation: SubtractionComputation): number =>
  computation.decimalPlaces === 0
    ? computation.steps.length
    : Math.max(computation.differenceDigits.length, computation.decimalPlaces)

export const getSubtractionStepCount = (computation: SubtractionComputation): number =>
  createDecimalPaddingEvents(
    computation.isNegative
      ? [computation.subtrahendDecimalPlaces, computation.minuendDecimalPlaces]
      : [computation.minuendDecimalPlaces, computation.subtrahendDecimalPlaces],
    computation.decimalPlaces,
  ).length +
  getResultDigitStepCount(computation) +
  (computation.decimalPlaces > 0 ? 1 : 0) +
  (computation.decimalPlaces > 0 && computation.differenceDigits.length <= computation.decimalPlaces ? 1 : 0)

/** 所有借位提示都降级为人类可输入的 MTD，而不是直接写边中点坐标。 */
export const createSubtractionMacroSource = (
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
): string => {
  const workingOperandDecimalPlaces = computation.isNegative
    ? [computation.subtrahendDecimalPlaces, computation.minuendDecimalPlaces]
    : [computation.minuendDecimalPlaces, computation.subtrahendDecimalPlaces]
  const workingOperandTexts = computation.isNegative
    ? [computation.subtrahendText, computation.minuendText]
    : [computation.minuendText, computation.subtrahendText]
  const paddingEvents = createDecimalPaddingEvents(workingOperandDecimalPlaces, computation.decimalPlaces)
  const totalStepCount = getSubtractionStepCount(computation)
  const resultDigitStepCount = getResultDigitStepCount(computation)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visiblePaddingCounts = getVisibleDecimalPaddingCounts(
    workingOperandTexts.length,
    paddingEvents,
    visibleStepCount,
  )
  const visibleCalculationStepCount = Math.min(
    Math.max(0, visibleStepCount - paddingEvents.length),
    resultDigitStepCount,
  )
  const visibleSteps = computation.steps.slice(0, visibleCalculationStepCount)
  const differenceDigits = computation.resultText.replace(/[-.]/g, '')
  const isComplete = settings.visibleStepCount === undefined || visibleStepCount >= totalStepCount
  const visibleDifference = visibleSteps
    .map(({ resultDigit }) => resultDigit)
    .reverse()
    .join('')
  const displayedDifference = isComplete ? differenceDigits : visibleDifference
  const hasVisibleDecimalPoint =
    computation.decimalPlaces > 0 && visibleStepCount > paddingEvents.length + resultDigitStepCount
  const decimalAnchorIndex = displayedDifference.length - computation.decimalPlaces - 1
  const displayedMinuend = appendDecimalZeros(workingOperandTexts[0], visiblePaddingCounts[0])
  const displayedSubtrahend = appendDecimalZeros(workingOperandTexts[1], visiblePaddingCounts[1])
  // 当前快照只以可见的操作数、结果位和当前已出现的小数点决定列数。
  const numberColumnCount = Math.max(
    displayedMinuend.replace('.', '').length,
    displayedSubtrahend.replace('.', '').length,
    displayedDifference.length + (hasVisibleDecimalPoint && decimalAnchorIndex < 0 ? 1 : 0),
  )
  const columns = numberColumnCount + 1
  const minuendCells = Array.from({ length: columns }, macroEmptyCell)
  const displayedMinuendDigits = displayedMinuend.replace('.', '')
  const displayedMinuendDecimalPlaces = workingOperandDecimalPlaces[0] + visiblePaddingCounts[0]
  // 补零阶段先遵循普通竖式的右对齐；数位实际补齐后才自然落在共同小数位边界。
  const firstNumberColumn = columns - displayedMinuendDigits.length
  placeNumber(
    minuendCells,
    displayedMinuendDigits,
    'subtraction.minuend',
    displayedMinuendDecimalPlaces,
    true,
    firstNumberColumn,
  )

  if (settings.showBorrowSteps) {
    const visibleColumns = new Set(visibleSteps.map(({ columnFromRight }) => columnFromRight))
    computation.steps.forEach((step) => {
      const targetFromRight = step.columnFromRight + 1
      if (!visibleColumns.has(step.columnFromRight) || step.borrowOut === 0 || targetFromRight >= numberColumnCount)
        return
      const target = columns - 1 - targetFromRight
      const digitIndex = target - firstNumberColumn
      const dot = macroBorrowDot('subtraction.borrow')
      minuendCells[target] =
        digitIndex < 0 || digitIndex >= computation.workingMinuendDigits.length
          ? macroAnnotationCell(dot)
          : macroTextCell(computation.workingMinuendDigits[digitIndex], 'subtraction.minuend', [dot])
    })
  }

  const subtrahendCells = Array.from({ length: columns }, macroEmptyCell)
  subtrahendCells[0] = macroTextCell('−', 'subtraction.operator')
  const displayedSubtrahendDigits = displayedSubtrahend.replace('.', '')
  const displayedSubtrahendDecimalPlaces = workingOperandDecimalPlaces[1] + visiblePaddingCounts[1]
  const subtrahendFirstNumberColumn = columns - displayedSubtrahendDigits.length
  placeNumber(
    subtrahendCells,
    displayedSubtrahendDigits,
    'subtraction.subtrahend',
    displayedSubtrahendDecimalPlaces,
    true,
    subtrahendFirstNumberColumn,
  )

  const differenceCells = Array.from({ length: columns }, macroEmptyCell)
  if (computation.isNegative && isComplete) differenceCells[0] = macroTextCell('−', 'subtraction.negative-sign')
  const differenceAnnotations = shouldStrikeMinimalDecimalResult(
    computation.resultText,
    computation.decimalPlaces,
    settings.useMinimalDecimalResult,
    isComplete,
  )
    ? new Map([[displayedDifference.length - 1, ['STRIKE']]])
    : new Map<number, string[]>()
  placeNumber(
    differenceCells,
    displayedDifference,
    'subtraction.difference',
    computation.decimalPlaces,
    hasVisibleDecimalPoint && decimalAnchorIndex >= 0,
    undefined,
    differenceAnnotations,
  )
  // 例如 0.51 的倒数第二帧为 `.51`：点独占预留的整数位，最终帧才写入 0。
  if (hasVisibleDecimalPoint && decimalAnchorIndex < 0) {
    differenceCells[columns - displayedDifference.length - 1] = decimalMarkerCell()
  }

  return macroGrid(columns, settings, `${computation.minuendText} 减 ${computation.subtrahendText} 的竖式`, [
    macroRow(minuendCells),
    macroRow(subtrahendCells),
    macroLine('subtraction.difference-bar', 'adjacent'),
    macroRow(differenceCells),
  ])
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createSubtractionGridScene = (
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
): GridScene => compileCalculatorMacro(createSubtractionMacroSource(computation, settings))
