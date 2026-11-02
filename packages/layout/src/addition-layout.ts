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
  macroRightBottom,
  macroRow,
  macroTextCell,
} from './macro-source'

const placeNumber = (
  cells: string[],
  value: string,
  styleToken: string,
  firstColumn: number,
): void => {
  ;[...value].forEach((digit, index) => {
    cells[firstColumn + index] = macroTextCell(digit, styleToken)
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

/**
 * 将加法过程翻译为人工也能直接编辑的宏源码。
 * 进位采用既有 RB 宏，故自动结果不会保留人工不可复刻的交点图元。
 */
export const createAdditionMacroSource = (
  computation: AdditionComputation,
  settings: Partial<AdditionRenderSettings> = {},
): string => {
  const resolvedSettings: AdditionRenderSettings = { ...DEFAULT_ADDITION_SETTINGS, ...settings }
  const visibleStepCount = Math.min(Math.max(resolvedSettings.visibleStepCount ?? computation.steps.length, 0), computation.steps.length)
  const visibleSteps = computation.steps.slice(0, visibleStepCount)
  const numberColumnCount = Math.max(computation.sumDigits.length, ...computation.addendDigits.map(({ length }) => length))
  const columns = numberColumnCount + 1
  const children: string[] = []

  computation.addendDigits.forEach((addend, addendIndex) => {
    const cells = Array.from({ length: columns }, macroEmptyCell)
    placeNumber(cells, addend, 'addition.addend', columns - addend.length)
    if (addendIndex === computation.addendDigits.length - 1) {
      cells[0] = macroTextCell('+', 'addition.operator')
      if (resolvedSettings.showCarrySteps) {
        visibleSteps.forEach((step) => {
          const targetColumn = numberColumnCount - step.columnFromRight - 1
          if (step.carryOut === 0 || targetColumn <= 0) return
          const cellIndex = targetColumn
          const annotation = macroRightBottom(String(step.carryOut), 'addition.carry')
          const digitIndex = cellIndex - (columns - addend.length)
          cells[cellIndex] = digitIndex < 0 || digitIndex >= addend.length
            ? macroAnnotationCell(annotation)
            : macroTextCell(addend[digitIndex], 'addition.addend', [annotation])
        })
      }
    }
    children.push(macroRow(cells))
  })

  children.push(macroLine('addition.sum-bar', 'full'))
  const resultCells = Array.from({ length: columns }, macroEmptyCell)
  const isComplete = resolvedSettings.visibleStepCount === undefined || visibleStepCount >= computation.steps.length
  const visibleSum = visibleSteps.map(({ resultDigit }) => resultDigit).reverse().join('')
  const sumToDisplay = isComplete ? computation.sumDigits : visibleSum
  placeNumber(resultCells, sumToDisplay, 'addition.sum', columns - sumToDisplay.length)
  children.push(macroRow(resultCells))

  return macroGrid(columns, resolvedSettings, `${computation.addendDigits.join(' 加 ')} 的竖式`, children)
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createAdditionGridScene = (
  computation: AdditionComputation,
  settings: Partial<AdditionRenderSettings> = {},
): GridScene => compileCalculatorMacro(createAdditionMacroSource(computation, settings))
