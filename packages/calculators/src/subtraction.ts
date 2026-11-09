/** Subtraction calculator: emits borrowing data without leaking rows, columns, or rendering details. */
import type { SubtractionColumnStep, SubtractionComputation } from './types'
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
    steps.push({
      columnFromRight,
      minuendDigit,
      subtrahendDigit,
      borrowIn,
      minuendDisplay: String(workingDigit),
      resultDigit,
      borrowOut: borrow,
    })
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
  const { differenceDigits, steps } = calculateNonNegativeDifference(workingMinuendDigits, workingSubtrahendDigits)

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
    resultText: `${isNegative && differenceDigits !== '0' ? '-' : ''}${formatDecimal(differenceDigits, decimalPlaces)}`,
    isNegative,
    steps,
  }
}
