/** Addition macro layout: serializes the process into human-editable macro source. */
import type { GridScene } from '@u1in/shushi-grid'
import type { AdditionComputation } from '@u1in/shushi-calculators'
import type { AdditionRenderSettings } from './types'
import { appendDecimalZeros, createDecimalPaddingEvents, getVisibleDecimalPaddingCounts } from './decimal-padding'
import {
  compileCalculatorMacro,
  macroAnnotationCell,
  macroEmptyCell,
  macroGrid,
  macroLine,
  macroLiteral,
  macroOption,
  macroRightBottom,
  macroRow,
  macroTextCell,
  shouldStrikeMinimalDecimalResult,
} from './macro-source'

/** 小数点附着在整数个位右侧，不额外占用数字列，便于所有加数按点对齐。 */
const decimalCell = (
  digit: string,
  styleToken: string,
  hasDecimalPoint: boolean,
  annotations: string[] = [],
): string =>
  hasDecimalPoint
    ? `CELL(MM(${macroLiteral(digit)}, ${macroOption('style', styleToken)}), DOT, ${macroOption(
        'style',
        'addition.decimal-separator',
      )}${annotations.length ? `, ${annotations.join(', ')}` : ''})`
    : macroTextCell(digit, styleToken, annotations)

const placeNumber = (
  cells: string[],
  value: string,
  styleToken: string,
  firstColumn: number,
  annotationsByDigitIndex: Map<number, string[]> = new Map(),
): void => {
  const digits = value.replace('.', '')
  const decimalDigitIndex = value.includes('.') ? value.indexOf('.') - 1 : -1
  ;[...digits].forEach((digit, index) => {
    cells[firstColumn + index] = decimalCell(
      digit,
      styleToken,
      index === decimalDigitIndex,
      annotationsByDigitIndex.get(index) ?? [],
    )
  })
}

/** 入门 API 采用与宏编译器一致的默认格子，并默认展示教学进位。 */
const DEFAULT_ADDITION_SETTINGS: AdditionRenderSettings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showCarrySteps: true,
  useMinimalDecimalResult: false,
}

/** 小数先逐格补零对齐；随后计算，最后再单独标注结果小数点。 */
export const getAdditionStepCount = (computation: AdditionComputation): number =>
  createDecimalPaddingEvents(computation.addendDecimalPlaces, computation.decimalPlaces).length +
  computation.steps.length +
  (computation.decimalPlaces > 0 ? 1 : 0)

/**
 * 将加法过程翻译为人工也能直接编辑的宏源码。
 * 进位采用既有 RB 宏，故自动结果不会保留人工不可复刻的交点图元。
 */
export const createAdditionMacroSource = (
  computation: AdditionComputation,
  settings: Partial<AdditionRenderSettings> = {},
): string => {
  const resolvedSettings: AdditionRenderSettings = { ...DEFAULT_ADDITION_SETTINGS, ...settings }
  const paddingEvents = createDecimalPaddingEvents(computation.addendDecimalPlaces, computation.decimalPlaces)
  const totalStepCount = getAdditionStepCount(computation)
  const visibleStepCount = Math.min(Math.max(resolvedSettings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visiblePaddingCounts = getVisibleDecimalPaddingCounts(
    computation.addendTexts.length,
    paddingEvents,
    visibleStepCount,
  )
  const visibleCalculationStepCount = Math.min(
    Math.max(0, visibleStepCount - paddingEvents.length),
    computation.steps.length,
  )
  const visibleSteps = computation.steps.slice(0, visibleCalculationStepCount)
  const displayedAddends = computation.addendTexts.map((addend, index) =>
    appendDecimalZeros(addend, visiblePaddingCounts[index]),
  )
  const isComplete = resolvedSettings.visibleStepCount === undefined || visibleStepCount >= totalStepCount
  const visibleSum = visibleSteps
    .map(({ resultDigit }) => resultDigit)
    .reverse()
    .join('')
  // 当前帧只拥有已写出的结果位；完成帧才拥有完整和。
  const sumToDisplay = isComplete ? computation.sumText : visibleSum
  const numberColumnCount = Math.max(
    sumToDisplay.replace('.', '').length,
    ...displayedAddends.map((addend) => addend.replace('.', '').length),
  )
  const columns = numberColumnCount + 1
  const children: string[] = []

  displayedAddends.forEach((displayedAddend, addendIndex) => {
    const cells = Array.from({ length: columns }, macroEmptyCell)
    const digitCount = displayedAddend.replace('.', '').length
    // 补零尚未完成时按当前已显示数位右对齐，不能预先占用最终小数位的位置。
    const firstColumn = columns - digitCount
    const annotationsByDigitIndex = new Map<number, string[]>()
    if (addendIndex === computation.addendDigits.length - 1) {
      cells[0] = macroTextCell('+', 'addition.operator')
      if (resolvedSettings.showCarrySteps) {
        visibleSteps.forEach((step) => {
          const targetColumn = numberColumnCount - step.columnFromRight - 1
          if (step.carryOut === 0 || targetColumn <= 0) return
          const annotation = macroRightBottom(String(step.carryOut), 'addition.carry')
          const digitIndex = targetColumn - firstColumn
          if (digitIndex < 0 || digitIndex >= digitCount) {
            cells[targetColumn] = macroAnnotationCell(annotation)
            return
          }
          annotationsByDigitIndex.set(digitIndex, [annotation])
        })
      }
    }
    placeNumber(cells, displayedAddend, 'addition.addend', firstColumn, annotationsByDigitIndex)
    children.push(macroRow(cells))
  })

  children.push(macroLine('addition.sum-bar', 'adjacent'))
  const resultCells = Array.from({ length: columns }, macroEmptyCell)
  // 所有补零和逐列计算完成后先显示去点结果，下一步才补上最终和的小数点。
  const resultAnnotations = shouldStrikeMinimalDecimalResult(
    computation.sumText,
    computation.decimalPlaces,
    resolvedSettings.useMinimalDecimalResult,
    isComplete,
  )
    ? new Map([[sumToDisplay.replace('.', '').length - 1, ['STRIKE']]])
    : new Map<number, string[]>()
  placeNumber(
    resultCells,
    sumToDisplay,
    'addition.sum',
    columns - sumToDisplay.replace('.', '').length,
    resultAnnotations,
  )
  children.push(macroRow(resultCells))

  return macroGrid(columns, resolvedSettings, `${computation.addendTexts.join(' 加 ')} 的竖式`, children)
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createAdditionGridScene = (
  computation: AdditionComputation,
  settings: Partial<AdditionRenderSettings> = {},
): GridScene => compileCalculatorMacro(createAdditionMacroSource(computation, settings))
