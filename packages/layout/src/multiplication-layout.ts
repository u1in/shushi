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
  macroLiteral,
  macroOption,
  macroRightBottom,
  macroRightTop,
  macroRow,
  macroTextCell,
} from './macro-source'

interface NumberRowContent {
  digits: Map<number, string>
  annotations: Map<number, { text: string; token: string; position: 'rightTop' | 'rightBottom' }[]>
  decimalColumns: Set<number>
}

const createNumberRow = (): NumberRowContent => ({
  digits: new Map(),
  annotations: new Map(),
  decimalColumns: new Set(),
})

const putNumber = (row: NumberRowContent, value: string, rightIndex: number): void => {
  const digits = value.replace('.', '')
  const decimalDigitIndex = value.includes('.') ? value.indexOf('.') - 1 : -1
  ;[...digits].forEach((digit, index) => {
    const column = rightIndex - digits.length + index + 1
    row.digits.set(column, digit)
    if (index === decimalDigitIndex) row.decimalColumns.add(column)
  })
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
      : row.decimalColumns.has(index)
        ? `CELL(MM(${macroLiteral(digit)}, ${macroOption('style', token)}), DOT, ${macroOption(
            'style',
            'multiplication.decimal-separator',
          )}${annotations.length ? `, ${annotations.join(', ')}` : ''})`
        : macroTextCell(digit, token, annotations)
  })

/** 逐位乘法与列加法总步数；播放控制和宏快照共用该定义。 */
export const getMultiplicationStepCount = (computation: MultiplicationComputation): number => {
  const multiplicationStepCount = computation.partialProducts.reduce((count, item) => count + item.digitSteps.length, 0)
  const arithmeticStepCount =
    multiplicationStepCount + (computation.partialProducts.length > 1 ? computation.additionSteps.length : 0)
  // 所有数字过程完成后，额外用一帧把最终积的小数点补回。
  return arithmeticStepCount + (computation.decimalPlaces > 0 ? 1 : 0)
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
  const arithmeticStepCount =
    multiplicationStepCount + (computation.partialProducts.length > 1 ? computation.additionSteps.length : 0)
  const totalStepCount = getMultiplicationStepCount(computation)
  const visibleStepCount = Math.min(Math.max(settings.visibleStepCount ?? totalStepCount, 0), totalStepCount)
  const visibleMultiplicationStepCount = Math.min(visibleStepCount, multiplicationStepCount)
  const visibleAdditionStepCount = Math.min(
    Math.max(0, visibleStepCount - multiplicationStepCount),
    arithmeticStepCount - multiplicationStepCount,
  )
  const trailingZeroCount = computation.trailingZeroShortcut?.trailingZeroCount ?? 0
  const hasMultiplePartialProducts = computation.partialProducts.length > 1
  const isComplete = settings.visibleStepCount === undefined || visibleStepCount >= totalStepCount
  const visibleProduct = computation.additionSteps
    .slice(0, visibleAdditionStepCount)
    .map(({ resultDigit }) => resultDigit)
    .reverse()
    .join('')
  const visibleAdditionColumnCount = Math.max(
    visibleProduct.length,
    ...computation.additionSteps
      .slice(0, visibleAdditionStepCount)
      .filter(({ carryOut }) => carryOut > 0)
      .map(({ columnFromRight }) => columnFromRight + 2),
  )
  let remainingStepsForWidth = visibleMultiplicationStepCount
  const visiblePartialColumnCount = computation.partialProducts.reduce((widest, partialProduct) => {
    const visibleDigitStepCount = Math.min(remainingStepsForWidth, partialProduct.digitSteps.length)
    remainingStepsForWidth -= visibleDigitStepCount
    if (visibleDigitStepCount === 0) return widest
    const completedDigitSteps = partialProduct.digitSteps.slice(-visibleDigitStepCount)
    const digitWidth = Math.max(
      ...completedDigitSteps.map(
        ({ multiplicandDigitIndex }) =>
          significantMultiplicandDigits.length - multiplicandDigitIndex + partialProduct.shift,
      ),
    )
    const leadingStep = partialProduct.digitSteps[0]
    const carryWidth =
      visibleDigitStepCount === partialProduct.digitSteps.length && leadingStep.carryOut > 0
        ? significantMultiplicandDigits.length - leadingStep.multiplicandDigitIndex + partialProduct.shift + 1
        : 0
    return Math.max(widest, digitWidth, carryWidth)
  }, 0)
  const operandColumnCount = isTrailingZeroShortcut
    ? Math.max(
        significantMultiplicandDigits.length + computation.trailingZeroShortcut!.multiplicandTrailingZeroCount,
        significantMultiplierDigits.length + computation.trailingZeroShortcut!.multiplierTrailingZeroCount,
      )
    : Math.max(significantMultiplicandDigits.length, significantMultiplierDigits.length)
  // 每一帧只为已出现的部分积或已完成的最终积增加列；循环或后续乘位不能预留空间。
  const numberColumnCount = Math.max(
    operandColumnCount,
    visiblePartialColumnCount,
    isComplete ? computation.productText.replace('.', '').length : visibleAdditionColumnCount,
  )
  const rightmostNumberIndex = numberColumnCount - 1
  const baseRightmostNumberIndex = rightmostNumberIndex - trailingZeroCount
  const arithmeticRightmostNumberIndex = isTrailingZeroShortcut ? baseRightmostNumberIndex : rightmostNumberIndex
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
    putNumber(multiplicand, computation.multiplicandText, rightmostNumberIndex)
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
    putNumber(multiplier, computation.multiplierText, rightmostNumberIndex)
  }

  if (isTrailingZeroShortcut && !hasMultiplePartialProducts) {
    const product = createNumberRow()
    if (isComplete)
      putNumber(
        product,
        computation.productText,
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
    children.push(macroLine('multiplication.input-bar', 'adjacent'))
    if (isComplete) children.push(macroRow(renderNumberCells(product, numberColumnCount, 'multiplication.product')))
    return macroGrid(
      numberColumnCount + 1,
      settings,
      `${computation.multiplicandText} 乘以 ${computation.multiplierText} 的十倍数快捷竖式`,
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
    if (completedDigitSteps.length === 0) return
    // 只有整个部分积均为 0 才压缩为一个 0；例如 352 × 3 的结果 1056 中，
    // 最左侧的 0 仍是有效数位，不能因后续最高位进位而被裁掉。
    const isZeroPartialProduct = completedDigitSteps.every(({ resultDigit }) => resultDigit === '0')
    const displayedSteps = isZeroPartialProduct ? completedDigitSteps.slice(-1) : completedDigitSteps
    displayedSteps.forEach(({ multiplicandDigitIndex, resultDigit }) => {
      const columnFromRight = significantMultiplicandDigits.length - 1 - multiplicandDigitIndex
      row.digits.set(arithmeticRightmostNumberIndex - partialProduct.shift - columnFromRight, resultDigit)
    })
    const leadingStep = partialProduct.digitSteps[0]
    if (visibleDigitStepCount === partialProduct.digitSteps.length && leadingStep.carryOut > 0) {
      row.digits.set(
        arithmeticRightmostNumberIndex -
          partialProduct.shift -
          (significantMultiplicandDigits.length - leadingStep.multiplicandDigitIndex),
        String(leadingStep.carryOut),
      )
    }
    if (settings.showCarrySteps && visibleDigitStepCount > 0) {
      completedDigitSteps.forEach(({ carryOut, multiplicandDigitIndex }) => {
        if (carryOut === 0 || multiplicandDigitIndex === leadingStep.multiplicandDigitIndex) return
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
  children.push(macroLine('multiplication.input-bar', 'adjacent'))

  if (hasMultiplePartialProducts) {
    const product = createNumberRow()
    if (settings.showCarrySteps && visibleAdditionStepCount > 0) {
      computation.additionSteps.slice(0, visibleAdditionStepCount).forEach((step) => {
        const targetColumnFromRight = step.columnFromRight + 1
        if (step.carryOut === 0 || targetColumnFromRight >= visibleAdditionColumnCount) return
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
    const productToDisplay = isComplete ? computation.productText : visibleProduct
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
      children.push(macroLine('multiplication.sum-bar', settings.uniformMultiplicationBars ? 'full' : 'adjacent'))
    if (visibleAdditionStepCount > 0 || isComplete)
      children.push(macroRow(renderNumberCells(product, numberColumnCount, 'multiplication.product')))
  } else {
    // 只有一条有效部分积时，在小数点步骤用最终文本替换过程数字；全零小数没有部分积。
    const product = createNumberRow()
    if (isComplete) putNumber(product, computation.productText, arithmeticRightmostNumberIndex)
    const row = isComplete ? product : partialRows[0]
    if (row) children.push(macroRow(renderNumberCells(row, numberColumnCount, 'multiplication.product')))
  }

  return macroGrid(
    numberColumnCount + 1,
    settings,
    `${computation.multiplicandText} 乘以 ${computation.multiplierText} 的竖式`,
    children,
  )
}

/** @deprecated 使用宏源码编译；保留名称以兼容既有调用方。 */
export const createMultiplicationGridScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): GridScene => compileCalculatorMacro(createMultiplicationMacroSource(computation, settings))
