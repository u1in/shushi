/** Multiplication macro layout: produces the same source language that users edit. */
import type { GridScene } from '@u1in/shushi-grid'
import type { MultiplicationComputation } from '@u1in/shushi-calculators'
import type { MultiplicationRenderSettings } from './types'
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

interface NumberRowContent {
  digits: Map<number, string>
  annotations: Map<number, { text: string, token: string }[]>
}

const createNumberRow = (): NumberRowContent => ({ digits: new Map(), annotations: new Map() })

const putNumber = (row: NumberRowContent, value: string, rightIndex: number): void => {
  ;[...value].forEach((digit, index) => row.digits.set(rightIndex - value.length + index + 1, digit))
}

const putAnnotation = (row: NumberRowContent, index: number, text: string, token: string): void => {
  const annotations = row.annotations.get(index) ?? []
  annotations.push({ text, token })
  row.annotations.set(index, annotations)
}

const renderNumberCells = (row: NumberRowContent, count: number, token: string): string[] => (
  Array.from({ length: count }, (_, index) => {
    const annotations = (row.annotations.get(index) ?? []).map(({ text, token: annotationToken }) => macroRightBottom(text, annotationToken))
    const digit = row.digits.get(index)
    return digit === undefined
      ? annotations.length ? macroAnnotationCell(annotations.join(', ')) : macroEmptyCell()
      : macroTextCell(digit, token, annotations)
  })
)

/** 逐位乘法与列加法总步数；播放控制和宏快照共用该定义。 */
export const getMultiplicationStepCount = (computation: MultiplicationComputation): number => {
  const multiplicationStepCount = computation.partialProducts.reduce((count, item) => count + item.digitSteps.length, 0)
  const significantMultiplierDigits = computation.trailingZeroShortcut?.significantMultiplierDigits ?? computation.multiplierDigits
  return multiplicationStepCount + (significantMultiplierDigits.length > 1 ? computation.additionSteps.length : 0)
}

/**
 * 将计算过程写为完整的宏源码。进位使用 RB，而非布局器专用的交点坐标，
 * 因而每一帧都可直接复制到宏编辑器复刻。
 */
export const createMultiplicationMacroSource = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): string => {
  const isTrailingZeroShortcut = computation.trailingZeroShortcut !== null
  const significantMultiplierDigits = computation.trailingZeroShortcut?.significantMultiplierDigits ?? computation.multiplierDigits
  const multiplicationStepCount = computation.partialProducts.reduce((count, item) => count + item.digitSteps.length, 0)
  const totalStepCount = getMultiplicationStepCount(computation)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visibleMultiplicationStepCount = Math.min(visibleStepCount, multiplicationStepCount)
  const visibleAdditionStepCount = Math.max(0, visibleStepCount - multiplicationStepCount)
  const partialWidth = Math.max(...computation.partialProducts.map(({ value, shift }) => value.length + shift))
  const trailingZeroCount = computation.trailingZeroShortcut?.trailingZeroCount ?? 0
  const baseProductDigits = isTrailingZeroShortcut && computation.productDigits !== '0'
    ? computation.productDigits.slice(0, -trailingZeroCount)
    : computation.productDigits
  const baseNumberColumnCount = Math.max(
    computation.multiplicandDigits.length,
    significantMultiplierDigits.length,
    baseProductDigits.length,
    partialWidth,
  )
  const numberColumnCount = baseNumberColumnCount + trailingZeroCount
  const rightmostNumberIndex = numberColumnCount - 1
  const baseRightmostNumberIndex = baseNumberColumnCount - 1
  const arithmeticRightmostNumberIndex = isTrailingZeroShortcut ? baseRightmostNumberIndex : rightmostNumberIndex
  const isMultiDigitMultiplier = significantMultiplierDigits.length > 1
  const isComplete = settings.visibleStepCount === undefined || visibleStepCount >= totalStepCount
  const children: string[] = []

  const multiplicand = createNumberRow()
  putNumber(multiplicand, computation.multiplicandDigits, isTrailingZeroShortcut ? baseRightmostNumberIndex : rightmostNumberIndex)
  children.push(macroRow([macroEmptyCell(), ...renderNumberCells(multiplicand, numberColumnCount, 'multiplication.multiplicand')]))

  const multiplier = createNumberRow()
  const multiplierToDisplay = isTrailingZeroShortcut && !isComplete
    ? computation.trailingZeroShortcut!.significantMultiplierDigits
    : computation.multiplierDigits
  putNumber(multiplier, multiplierToDisplay, isTrailingZeroShortcut && !isComplete ? baseRightmostNumberIndex : rightmostNumberIndex)
  children.push(macroRow([macroTextCell('×', 'multiplication.operator'), ...renderNumberCells(multiplier, numberColumnCount, 'multiplication.multiplier')]))
  children.push(macroLine('multiplication.input-bar', 'full'))

  if (isTrailingZeroShortcut && !isMultiDigitMultiplier) {
    const product = createNumberRow()
    if (isComplete) putNumber(product, computation.productDigits, computation.productDigits === '0' ? baseRightmostNumberIndex : rightmostNumberIndex)
    children.push(macroRow(renderNumberCells(product, numberColumnCount, 'multiplication.product')))
    return macroGrid(numberColumnCount + 1, settings, `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的十倍数快捷竖式`, children)
  }

  let remainingVisibleSteps = visibleMultiplicationStepCount
  computation.partialProducts.forEach((partialProduct) => {
    const visibleDigitStepCount = Math.min(remainingVisibleSteps, partialProduct.digitSteps.length)
    remainingVisibleSteps -= visibleDigitStepCount
    const row = createNumberRow()
    const completedDigitSteps = partialProduct.digitSteps.slice(-visibleDigitStepCount)
    const firstNonZeroIndex = completedDigitSteps.findIndex(({ resultDigit }) => resultDigit !== '0')
    const displayedSteps = firstNonZeroIndex === -1 ? completedDigitSteps.slice(-1) : completedDigitSteps.slice(firstNonZeroIndex)
    displayedSteps.forEach(({ multiplicandDigitIndex, resultDigit }) => {
      const columnFromRight = computation.multiplicandDigits.length - 1 - multiplicandDigitIndex
      row.digits.set(arithmeticRightmostNumberIndex - partialProduct.shift - columnFromRight, resultDigit)
    })
    const leadingStep = partialProduct.digitSteps[0]
    if (visibleDigitStepCount === partialProduct.digitSteps.length && leadingStep.carryOut > 0) {
      row.digits.set(arithmeticRightmostNumberIndex - partialProduct.shift - computation.multiplicandDigits.length, String(leadingStep.carryOut))
    }
    if (settings.showCarrySteps && visibleDigitStepCount > 0) {
      completedDigitSteps.forEach(({ carryOut, multiplicandDigitIndex }) => {
        if (carryOut === 0 || multiplicandDigitIndex === 0) return
        const targetColumnFromRight = computation.multiplicandDigits.length - multiplicandDigitIndex
        putAnnotation(row, arithmeticRightmostNumberIndex - partialProduct.shift - targetColumnFromRight, String(carryOut), 'multiplication.carry')
      })
    }
    children.push(macroRow(renderNumberCells(row, numberColumnCount, isMultiDigitMultiplier ? 'multiplication.partial-product' : 'multiplication.product')))
  })

  if (isMultiDigitMultiplier) {
    if (visibleAdditionStepCount > 0) children.push(macroLine('multiplication.sum-bar', settings.uniformMultiplicationBars ? 'full' : 'previous'))
    const product = createNumberRow()
    if (settings.showCarrySteps && visibleAdditionStepCount > 0) {
      computation.additionSteps.slice(0, visibleAdditionStepCount).forEach((step) => {
        const targetColumnFromRight = step.columnFromRight + 1
        if (step.carryOut === 0 || targetColumnFromRight >= baseProductDigits.length) return
        putAnnotation(product, arithmeticRightmostNumberIndex - targetColumnFromRight, String(step.carryOut), 'multiplication.addition-carry')
      })
    }
    const visibleProduct = computation.additionSteps.slice(0, visibleAdditionStepCount).map(({ resultDigit }) => resultDigit).reverse().join('')
    const productToDisplay = isComplete ? computation.productDigits : visibleProduct
    putNumber(product, productToDisplay, isComplete && computation.productDigits !== '0' ? rightmostNumberIndex : arithmeticRightmostNumberIndex)
    children.push(macroRow(renderNumberCells(product, numberColumnCount, 'multiplication.product')))
  }

  return macroGrid(numberColumnCount + 1, settings, `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的竖式`, children)
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createMultiplicationGridScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): GridScene => compileCalculatorMacro(createMultiplicationMacroSource(computation, settings))
