/** Subtraction macro layout: serializes borrowing records into macro source. */
import type { GridScene } from '@vertical-arithmetic/grid'
import type { SubtractionComputation } from '@vertical-arithmetic/calculators'
import type { SubtractionRenderSettings } from './types'
import {
  compileCalculatorMacro,
  macroAnnotationCell,
  macroBorrowDot,
  macroEmptyCell,
  macroGrid,
  macroLine,
  macroRow,
  macroTextCell,
} from './macro-source'

const placeNumber = (cells: string[], value: string, token: string): void => {
  const start = cells.length - value.length
  ;[...value].forEach((digit, index) => { cells[start + index] = macroTextCell(digit, token) })
}

/** 所有借位提示都降级为人类可输入的 MTD，而不是直接写边中点坐标。 */
export const createSubtractionMacroSource = (
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
): string => {
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? computation.steps.length, 0), computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleStepCount)
  const numberColumnCount = Math.max(
    computation.workingMinuendDigits.length,
    computation.workingSubtrahendDigits.length,
    computation.differenceDigits.length,
  )
  const columns = numberColumnCount + 1
  const minuendCells = Array.from({ length: columns }, macroEmptyCell)
  const firstNumberColumn = columns - computation.workingMinuendDigits.length
  placeNumber(minuendCells, computation.workingMinuendDigits, 'subtraction.minuend')

  if (settings.showBorrowSteps) {
    const visibleColumns = new Set(visibleSteps.map(({ columnFromRight }) => columnFromRight))
    computation.steps.forEach((step) => {
      const targetFromRight = step.columnFromRight + 1
      if (!visibleColumns.has(step.columnFromRight) || step.borrowOut === 0 || targetFromRight >= numberColumnCount) return
      const target = columns - 1 - targetFromRight
      const digitIndex = target - firstNumberColumn
      const dot = macroBorrowDot('subtraction.borrow')
      minuendCells[target] = digitIndex < 0 || digitIndex >= computation.workingMinuendDigits.length
        ? macroAnnotationCell(dot)
        : macroTextCell(computation.workingMinuendDigits[digitIndex], 'subtraction.minuend', [dot])
    })
  }

  const subtrahendCells = Array.from({ length: columns }, macroEmptyCell)
  subtrahendCells[0] = macroTextCell('−', 'subtraction.operator')
  placeNumber(subtrahendCells, computation.workingSubtrahendDigits, 'subtraction.subtrahend')

  const isComplete = settings.visibleStepCount === undefined || visibleStepCount >= computation.steps.length
  const visibleDifference = visibleSteps.map(({ resultDigit }) => resultDigit).reverse().join('')
  const differenceCells = Array.from({ length: columns }, macroEmptyCell)
  if (computation.isNegative && isComplete) differenceCells[0] = macroTextCell('−', 'subtraction.negative-sign')
  placeNumber(differenceCells, isComplete ? computation.differenceDigits : visibleDifference, 'subtraction.difference')

  return macroGrid(columns, settings, `${computation.minuendDigits} 减 ${computation.subtrahendDigits} 的竖式`, [
    macroRow(minuendCells),
    macroRow(subtrahendCells),
    macroLine('subtraction.difference-bar', 'full'),
    macroRow(differenceCells),
  ])
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createSubtractionGridScene = (
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
): GridScene => compileCalculatorMacro(createSubtractionMacroSource(computation, settings))
