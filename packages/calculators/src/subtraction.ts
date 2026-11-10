/** Subtraction calculator: emits borrowing data without leaking rows, columns, or rendering details. */
import type { CalculationStepSnapshot, SubtractionColumnStep, SubtractionComputation } from './types'
import { formatDecimal, parseDecimal, scaleDecimalDigits, trimLeadingZeros } from './decimal'

const compareDigitStrings = (left: string, right: string): number => {
  if (left.length !== right.length) return left.length > right.length ? 1 : -1
  if (left === right) return 0
  return left > right ? 1 : -1
}

/**
 * 计算大数减小数。`minuendDisplay` 保留中间计算时借位后的本位值，例如 502 − 137 导出 4、9、12，
 * 供计算步骤和数据流查看；竖式主行仍显示原始工作被减数。
 */
const calculateNonNegativeDifference = (
  minuend: string,
  subtrahend: string,
  onStep?: (step: SubtractionColumnStep, visibleDifferenceDigits: string) => void,
): Pick<SubtractionComputation, 'differenceDigits' | 'steps'> => {
  const resultDigits: string[] = []
  const steps: SubtractionColumnStep[] = []
  let borrow = 0

  for (let columnFromRight = 0; columnFromRight < minuend.length; columnFromRight += 1) {
    const minuendDigit = minuend[minuend.length - 1 - columnFromRight]
    const subtrahendDigit = subtrahend[subtrahend.length - 1 - columnFromRight] ?? '0'
    const borrowIn = borrow
    let workingDigit = Number(minuendDigit) - borrowIn
    const subtrahendValue = Number(subtrahendDigit)
    if (workingDigit < subtrahendValue) {
      workingDigit += 10
      borrow = 1
    } else {
      borrow = 0
    }
    const resultDigit = String(workingDigit - subtrahendValue)
    resultDigits.unshift(resultDigit)
    const step = {
      columnFromRight,
      minuendDigit,
      subtrahendDigit,
      borrowIn,
      minuendDisplay: String(workingDigit),
      resultDigit,
      borrowOut: borrow,
    }
    steps.push(step)
    onStep?.(step, resultDigits.join(''))
  }

  return { differenceDigits: trimLeadingZeros(resultDigits.join('')), steps }
}

/**
 * 计算减法。小数先右补零为同倍率整数，再沿用同一套逐列借位过程；
 * 被减数小于减数时仍给出负结果及其绝对值的借位过程。
 */
export const computeSubtraction = (minuendValue: unknown, subtrahendValue: unknown): SubtractionComputation => {
  const minuend = parseDecimal(minuendValue, '被减数')
  const subtrahend = parseDecimal(subtrahendValue, '减数')
  const decimalPlaces = Math.max(minuend.decimalPlaces, subtrahend.decimalPlaces)
  const minuendDigits = scaleDecimalDigits(minuend, decimalPlaces)
  const subtrahendDigits = scaleDecimalDigits(subtrahend, decimalPlaces)
  const isNegative = compareDigitStrings(minuendDigits, subtrahendDigits) < 0
  const workingMinuendDigits = isNegative ? subtrahendDigits : minuendDigits
  const workingSubtrahendDigits = isNegative ? minuendDigits : subtrahendDigits
  const workingOperandTexts = isNegative ? [subtrahend.text, minuend.text] : [minuend.text, subtrahend.text]
  const workingOperandDecimalPlaces = isNegative
    ? [subtrahend.decimalPlaces, minuend.decimalPlaces]
    : [minuend.decimalPlaces, subtrahend.decimalPlaces]
  const displayedOperands = [...workingOperandTexts]
  const calculationSteps: CalculationStepSnapshot[] = []

  // 先逐一公开小数补零，后续借位步骤只读取已对齐的当前操作数。
  workingOperandDecimalPlaces.forEach((operandDecimalPlaces, operandIndex) => {
    for (let count = operandDecimalPlaces; count < decimalPlaces; count += 1) {
      displayedOperands[operandIndex] =
        `${displayedOperands[operandIndex].includes('.') ? displayedOperands[operandIndex] : `${displayedOperands[operandIndex]}.`}0`
      calculationSteps.push({
        action: 'pad-decimal',
        operandIndex,
        operands: [...displayedOperands],
      })
    }
  })

  const columnSnapshots: Array<{ step: SubtractionColumnStep; visibleDifferenceDigits: string }> = []
  const { differenceDigits, steps } = calculateNonNegativeDifference(
    workingMinuendDigits,
    workingSubtrahendDigits,
    (step, visibleDifferenceDigits) => {
      columnSnapshots.push({ step, visibleDifferenceDigits })
    },
  )
  const resultDigitStepCount = decimalPlaces === 0 ? steps.length : Math.max(differenceDigits.length, decimalPlaces)
  // 小于 1 的最终整数零由专用步骤补齐，避免在过程和结果中重复一次。
  columnSnapshots.slice(0, resultDigitStepCount).forEach(({ step, visibleDifferenceDigits }) => {
    calculationSteps.push({
      action: 'subtract-column',
      operands: [...displayedOperands],
      result: visibleDifferenceDigits,
      column: step.columnFromRight,
      inputs: [step.minuendDisplay, step.subtrahendDigit],
      borrowIn: step.borrowIn,
      borrowOut: step.borrowOut,
    })
  })

  const resultText = `${isNegative && differenceDigits !== '0' ? '-' : ''}${formatDecimal(differenceDigits, decimalPlaces)}`
  if (decimalPlaces > 0) {
    calculationSteps.push({
      action: 'place-decimal',
      operands: [...displayedOperands],
      result: resultText,
    })
    if (differenceDigits.length <= decimalPlaces)
      calculationSteps.push({
        action: 'place-leading-zero',
        operands: [...displayedOperands],
        result: resultText,
      })
  }

  return {
    minuendDigits,
    subtrahendDigits,
    minuendText: minuend.text,
    subtrahendText: subtrahend.text,
    minuendDecimalPlaces: minuend.decimalPlaces,
    subtrahendDecimalPlaces: subtrahend.decimalPlaces,
    decimalPlaces,
    workingMinuendDigits,
    workingSubtrahendDigits,
    workingMinuendText: formatDecimal(workingMinuendDigits, decimalPlaces),
    workingSubtrahendText: formatDecimal(workingSubtrahendDigits, decimalPlaces),
    differenceDigits,
    resultText,
    isNegative,
    steps,
    calculationSteps,
  }
}
