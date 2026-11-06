/** Addition macro layout: serializes the process into human-editable macro source. */
import type { GridScene } from '@u1in/shushi-grid'
import type { AdditionComputation } from '@u1in/shushi-calculators'
import type { AdditionRenderSettings } from './types'
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
}

/** 小数点作为结果展示的独立教学事件，输入行的小数点则从首帧保留以说明位值。 */
export const getAdditionStepCount = (computation: AdditionComputation): number =>
  computation.steps.length + (computation.decimalPlaces > 0 ? 1 : 0)

/**
 * 将加法过程翻译为人工也能直接编辑的宏源码。
 * 进位采用既有 RB 宏，故自动结果不会保留人工不可复刻的交点图元。
 */
export const createAdditionMacroSource = (
  computation: AdditionComputation,
  settings: Partial<AdditionRenderSettings> = {},
): string => {
  const resolvedSettings: AdditionRenderSettings = { ...DEFAULT_ADDITION_SETTINGS, ...settings }
  const totalStepCount = getAdditionStepCount(computation)
  const visibleStepCount = Math.min(Math.max(resolvedSettings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visibleCalculationStepCount = Math.min(visibleStepCount, computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleCalculationStepCount)
  const numberColumnCount = Math.max(
    computation.sumDigits.length,
    ...computation.addendDigits.map(({ length }) => length),
  )
  const columns = numberColumnCount + 1
  const children: string[] = []

  computation.addendTexts.forEach((addend, addendIndex) => {
    const cells = Array.from({ length: columns }, macroEmptyCell)
    const digitCount = computation.addendDigits[addendIndex].length
    const annotationsByDigitIndex = new Map<number, string[]>()
    if (addendIndex === computation.addendDigits.length - 1) {
      cells[0] = macroTextCell('+', 'addition.operator')
      if (resolvedSettings.showCarrySteps) {
        visibleSteps.forEach((step) => {
          const targetColumn = numberColumnCount - step.columnFromRight - 1
          if (step.carryOut === 0 || targetColumn <= 0) return
          const annotation = macroRightBottom(String(step.carryOut), 'addition.carry')
          const digitIndex = targetColumn - (columns - digitCount)
          if (digitIndex < 0 || digitIndex >= digitCount) {
            cells[targetColumn] = macroAnnotationCell(annotation)
            return
          }
          annotationsByDigitIndex.set(digitIndex, [annotation])
        })
      }
    }
    placeNumber(cells, addend, 'addition.addend', columns - digitCount, annotationsByDigitIndex)
    children.push(macroRow(cells))
  })

  children.push(macroLine('addition.sum-bar', 'full'))
  const resultCells = Array.from({ length: columns }, macroEmptyCell)
  const isComplete = resolvedSettings.visibleStepCount === undefined || visibleStepCount >= totalStepCount
  const visibleSum = visibleSteps
    .map(({ resultDigit }) => resultDigit)
    .reverse()
    .join('')
  // 所有逐列计算结束后先显示去点结果，下一步才补上最终和的小数点。
  const sumToDisplay = isComplete ? computation.sumText : visibleSum
  placeNumber(resultCells, sumToDisplay, 'addition.sum', columns - sumToDisplay.replace('.', '').length)
  children.push(macroRow(resultCells))

  return macroGrid(columns, resolvedSettings, `${computation.addendTexts.join(' 加 ')} 的竖式`, children)
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createAdditionGridScene = (
  computation: AdditionComputation,
  settings: Partial<AdditionRenderSettings> = {},
): GridScene => compileCalculatorMacro(createAdditionMacroSource(computation, settings))
