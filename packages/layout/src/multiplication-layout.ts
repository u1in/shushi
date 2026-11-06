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
  macroRightTop,
  macroRow,
  macroTextCell,
} from './macro-source'

interface NumberRowContent {
  digits: Map<number, string>
  annotations: Map<number, { text: string; token: string; position: 'rightTop' | 'rightBottom' }[]>
}

const createNumberRow = (): NumberRowContent => ({ digits: new Map(), annotations: new Map() })

const putNumber = (row: NumberRowContent, value: string, rightIndex: number): void => {
  ;[...value].forEach((digit, index) => row.digits.set(rightIndex - value.length + index + 1, digit))
}

/** 快捷计算中，保留原数的末尾零在有效数字个位的右侧，而不是移到最终积右边界。 */
const putShortcutOperand = (
  row: NumberRowContent,
  significantDigits: string,
  trailingZeroCount: number,
  baseRightmostNumberIndex: number,
): void => {
  putNumber(row, significantDigits, baseRightmostNumberIndex)
  for (let index = 1; index <= trailingZeroCount; index += 1) {
    row.digits.set(baseRightmostNumberIndex + index, '0')
  }
}

/**
 * 乘法进位默认附着在左侧目标数字的右上角；跨过横线时改附着到上行数字右下角。
 * 两种情况都复用既有 RB / RT 宏，保证自动生成源码可以直接在宏编辑器中复刻。
 */
const putAnnotation = (
  row: NumberRowContent,
  index: number,
  text: string,
  token: string,
  position: 'rightTop' | 'rightBottom',
): void => {
  const annotations = row.annotations.get(index) ?? []
  annotations.push({ text, token, position })
  row.annotations.set(index, annotations)
}

const renderNumberCells = (row: NumberRowContent, count: number, token: string): string[] =>
  Array.from({ length: count }, (_, index) => {
    const annotations = (row.annotations.get(index) ?? []).map(({ text, token: annotationToken, position }) =>
      position === 'rightTop' ? macroRightTop(text, annotationToken) : macroRightBottom(text, annotationToken),
    )
    const digit = row.digits.get(index)
    return digit === undefined
      ? annotations.length
        ? macroAnnotationCell(annotations.join(', '))
        : macroEmptyCell()
      : macroTextCell(digit, token, annotations)
  })

/** 逐位乘法与列加法总步数；播放控制和宏快照共用该定义。 */
export const getMultiplicationStepCount = (computation: MultiplicationComputation): number => {
  const multiplicationStepCount = computation.partialProducts.reduce((count, item) => count + item.digitSteps.length, 0)
  const significantMultiplierDigits =
    computation.trailingZeroShortcut?.significantMultiplierDigits ?? computation.multiplierDigits
  return multiplicationStepCount + (significantMultiplierDigits.length > 1 ? computation.additionSteps.length : 0)
}

/**
 * 将计算过程写为完整的宏源码。进位按横线相邻关系使用既有 RT / RB，
 * 因而每一帧都可直接复制到宏编辑器复刻。
 */
export const createMultiplicationMacroSource = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): string => {
  const isTrailingZeroShortcut = computation.trailingZeroShortcut !== null
  const significantMultiplicandDigits =
    computation.trailingZeroShortcut?.significantMultiplicandDigits ?? computation.multiplicandDigits
  const significantMultiplierDigits =
    computation.trailingZeroShortcut?.significantMultiplierDigits ?? computation.multiplierDigits
  const multiplicationStepCount = computation.partialProducts.reduce((count, item) => count + item.digitSteps.length, 0)
  const totalStepCount = getMultiplicationStepCount(computation)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visibleMultiplicationStepCount = Math.min(visibleStepCount, multiplicationStepCount)
  const visibleAdditionStepCount = Math.max(0, visibleStepCount - multiplicationStepCount)
  const partialWidth = Math.max(...computation.partialProducts.map(({ value, shift }) => value.length + shift))
  const trailingZeroCount = computation.trailingZeroShortcut?.trailingZeroCount ?? 0
  const baseProductDigits =
    isTrailingZeroShortcut && computation.productDigits !== '0'
      ? computation.productDigits.slice(0, -trailingZeroCount)
      : computation.productDigits
  const baseNumberColumnCount = Math.max(
    significantMultiplicandDigits.length,
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
  if (isTrailingZeroShortcut) {
    putShortcutOperand(
      multiplicand,
      significantMultiplicandDigits,
      computation.trailingZeroShortcut!.multiplicandTrailingZeroCount,
      baseRightmostNumberIndex,
    )
  } else {
    putNumber(multiplicand, computation.multiplicandDigits, rightmostNumberIndex)
  }

  const multiplier = createNumberRow()
  if (isTrailingZeroShortcut) {
    putShortcutOperand(
      multiplier,
      significantMultiplierDigits,
      computation.trailingZeroShortcut!.multiplierTrailingZeroCount,
      baseRightmostNumberIndex,
    )
  } else {
    putNumber(multiplier, computation.multiplierDigits, rightmostNumberIndex)
  }

  if (isTrailingZeroShortcut && !isMultiDigitMultiplier) {
    const product = createNumberRow()
    if (isComplete)
      putNumber(
        product,
        computation.productDigits,
        computation.productDigits === '0' ? baseRightmostNumberIndex : rightmostNumberIndex,
      )
    children.push(
      macroRow([
        macroEmptyCell(),
        ...renderNumberCells(multiplicand, numberColumnCount, 'multiplication.multiplicand'),
      ]),
    )
    children.push(
      macroRow([
        macroTextCell('×', 'multiplication.operator'),
        ...renderNumberCells(multiplier, numberColumnCount, 'multiplication.multiplier'),
      ]),
    )
    children.push(macroLine('multiplication.input-bar'))
    children.push(macroRow(renderNumberCells(product, numberColumnCount, 'multiplication.product')))
    return macroGrid(
      numberColumnCount + 1,
      settings,
      `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的十倍数快捷竖式`,
      children,
    )
  }

  let remainingVisibleSteps = visibleMultiplicationStepCount
  const partialRows: NumberRowContent[] = []
  computation.partialProducts.forEach((partialProduct, partialProductIndex) => {
    const visibleDigitStepCount = Math.min(remainingVisibleSteps, partialProduct.digitSteps.length)
    remainingVisibleSteps -= visibleDigitStepCount
    const row = createNumberRow()
    // slice(-0) 会被 JavaScript 解释为 slice(0)，必须显式保留空步骤。
    const completedDigitSteps =
      visibleDigitStepCount === 0 ? [] : partialProduct.digitSteps.slice(-visibleDigitStepCount)
    const firstNonZeroIndex = completedDigitSteps.findIndex(({ resultDigit }) => resultDigit !== '0')
    const displayedSteps =
      firstNonZeroIndex === -1 ? completedDigitSteps.slice(-1) : completedDigitSteps.slice(firstNonZeroIndex)
    displayedSteps.forEach(({ multiplicandDigitIndex, resultDigit }) => {
      const columnFromRight = significantMultiplicandDigits.length - 1 - multiplicandDigitIndex
      row.digits.set(arithmeticRightmostNumberIndex - partialProduct.shift - columnFromRight, resultDigit)
    })
    const leadingStep = partialProduct.digitSteps[0]
    if (visibleDigitStepCount === partialProduct.digitSteps.length && leadingStep.carryOut > 0) {
      row.digits.set(
        arithmeticRightmostNumberIndex - partialProduct.shift - significantMultiplicandDigits.length,
        String(leadingStep.carryOut),
      )
    }
    if (settings.showCarrySteps && visibleDigitStepCount > 0) {
      completedDigitSteps.forEach(({ carryOut, multiplicandDigitIndex }) => {
        if (carryOut === 0 || multiplicandDigitIndex === 0) return
        const targetColumnFromRight = significantMultiplicandDigits.length - multiplicandDigitIndex
        const targetIndex = arithmeticRightmostNumberIndex - partialProduct.shift - targetColumnFromRight
        // 第一条部分积紧跟乘法横线；进位改放在横线上方的乘数数字右下角。
        const anchorRow = partialProductIndex === 0 ? multiplier : row
        putAnnotation(
          anchorRow,
          targetIndex,
          String(carryOut),
          'multiplication.carry',
          partialProductIndex === 0 ? 'rightBottom' : 'rightTop',
        )
      })
    }
    partialRows.push(row)
  })

  children.push(
    macroRow([macroEmptyCell(), ...renderNumberCells(multiplicand, numberColumnCount, 'multiplication.multiplicand')]),
  )
  children.push(
    macroRow([
      macroTextCell('×', 'multiplication.operator'),
      ...renderNumberCells(multiplier, numberColumnCount, 'multiplication.multiplier'),
    ]),
  )
  children.push(macroLine('multiplication.input-bar'))

  if (isMultiDigitMultiplier) {
    const product = createNumberRow()
    if (settings.showCarrySteps && visibleAdditionStepCount > 0) {
      computation.additionSteps.slice(0, visibleAdditionStepCount).forEach((step) => {
        const targetColumnFromRight = step.columnFromRight + 1
        if (step.carryOut === 0 || targetColumnFromRight >= baseProductDigits.length) return
        // 最终积也紧跟求和横线，进位固定写在最后一条部分积的相应数字右下角。
        putAnnotation(
          partialRows.at(-1)!,
          arithmeticRightmostNumberIndex - targetColumnFromRight,
          String(step.carryOut),
          'multiplication.addition-carry',
          'rightBottom',
        )
      })
    }
    const visibleProduct = computation.additionSteps
      .slice(0, visibleAdditionStepCount)
      .map(({ resultDigit }) => resultDigit)
      .reverse()
      .join('')
    const productToDisplay = isComplete ? computation.productDigits : visibleProduct
    putNumber(
      product,
      productToDisplay,
      isComplete && computation.productDigits !== '0' ? rightmostNumberIndex : arithmeticRightmostNumberIndex,
    )
    // 求和进位已写入最后部分积后，才序列化该行，避免宏源码遗漏最新标记。
    partialRows.forEach((row) => {
      children.push(macroRow(renderNumberCells(row, numberColumnCount, 'multiplication.partial-product')))
    })
    if (visibleAdditionStepCount > 0)
      children.push(macroLine('multiplication.sum-bar', settings.uniformMultiplicationBars ? 'full' : 'previous'))
    children.push(macroRow(renderNumberCells(product, numberColumnCount, 'multiplication.product')))
  } else {
    children.push(macroRow(renderNumberCells(partialRows[0], numberColumnCount, 'multiplication.product')))
  }

  return macroGrid(
    numberColumnCount + 1,
    settings,
    `${computation.multiplicandDigits} 乘以 ${computation.multiplierDigits} 的竖式`,
    children,
  )
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createMultiplicationGridScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): GridScene => compileCalculatorMacro(createMultiplicationMacroSource(computation, settings))
