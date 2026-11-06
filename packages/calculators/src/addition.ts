/** Addition calculator: emits a decimal-string, renderer-independent column process. */
import type { AdditionColumnStep, AdditionComputation } from './types'
import { formatDecimal, parseDecimal, scaleDecimalDigits, trimLeadingZeros } from './decimal'

/**
 * 计算两个或多个非负整数字符串的逐列加法。传入单个数组同样支持，便于连加调用方
 * 保持自己的输入集合；至少两个加数才构成一个竖式加法。
 */
export const computeAddition = (...values: unknown[]): AdditionComputation => {
  const rawValues = values.length === 1 && Array.isArray(values[0]) ? values[0] : values
  if (rawValues.length < 2) throw new Error('加法至少需要两个加数。')

  const addends = rawValues.map((value, index) => parseDecimal(value, `第 ${index + 1} 个加数`))
  const decimalPlaces = Math.max(...addends.map(({ decimalPlaces: count }) => count))
  const scaledAddends = addends.map((addend) => scaleDecimalDigits(addend, decimalPlaces))
  const maximumLength = Math.max(...scaledAddends.map(({ length }) => length))
  const resultDigits: string[] = []
  const steps: AdditionColumnStep[] = []
  let carry = 0

  for (let columnFromRight = 0; columnFromRight < maximumLength || carry > 0; columnFromRight += 1) {
    const addendDigitsInColumn = scaledAddends.map((addend) => addend[addend.length - 1 - columnFromRight] ?? '0')
    const carryIn = carry
    const total = addendDigitsInColumn.reduce((sum, digit) => sum + Number(digit), carryIn)
    const resultDigit = String(total % 10)
    carry = Math.floor(total / 10)
    resultDigits.unshift(resultDigit)
    steps.push({ columnFromRight, addendDigits: addendDigitsInColumn, carryIn, total, resultDigit, carryOut: carry })
  }

  const sumDigits = trimLeadingZeros(resultDigits.join(''))
  return {
    addendDigits: addends.map(({ digits }) => digits),
    addendTexts: addends.map(({ text }) => text),
    addendDecimalPlaces: addends.map(({ decimalPlaces: count }) => count),
    decimalPlaces,
    sumDigits,
    sumText: formatDecimal(sumDigits, decimalPlaces),
    steps,
  }
}
