/** Subtraction calculator: emits borrowing data without leaking rows, columns, or rendering details. */
import type { SubtractionColumnStep, SubtractionComputation } from './types'

const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '') || '0'

const parseIntegerDigits = (value: unknown, label: string): string => {
  const raw = String(value ?? '')
  if (!/^\d+$/.test(raw)) throw new Error(`${label}请输入非负整数，例如 12 或 3456。`)
  return trimLeadingZeros(raw)
}

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

/** 计算减法；被减数小于减数时仍给出负结果及其绝对值的借位过程。 */
export const computeSubtraction = (minuendValue: unknown, subtrahendValue: unknown): SubtractionComputation => {
  const minuendDigits = parseIntegerDigits(minuendValue, '被减数')
  const subtrahendDigits = parseIntegerDigits(subtrahendValue, '减数')
  const isNegative = compareDigitStrings(minuendDigits, subtrahendDigits) < 0
  const workingMinuendDigits = isNegative ? subtrahendDigits : minuendDigits
  const workingSubtrahendDigits = isNegative ? minuendDigits : subtrahendDigits
  const { differenceDigits, steps } = calculateNonNegativeDifference(workingMinuendDigits, workingSubtrahendDigits)

  return {
    minuendDigits,
    subtrahendDigits,
    workingMinuendDigits,
    workingSubtrahendDigits,
    differenceDigits,
    resultText: isNegative && differenceDigits !== '0' ? `-${differenceDigits}` : differenceDigits,
    isNegative,
    steps,
  }
}
