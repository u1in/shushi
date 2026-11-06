/** Multiplication calculator: validates inputs and produces a layout-free long-multiplication process. */
import type {
  MultiplicationAdditionStep,
  MultiplicationComputation,
  MultiplicationDigitStep,
  MultiplicationOptions,
  MultiplicationPartialProduct,
} from './types'
import { formatDecimal, parseDecimal, trimLeadingZeros } from './decimal'

/** 零本身没有可计算的有效位，不能作为“末尾补零”的快捷乘数。 */
const isTrailingZeroMultiple = (value: string): boolean => value !== '0' && value.endsWith('0')

/** 拆出十进制末尾零，保留仍需逐位相乘的有效乘数。 */
const splitTrailingZeros = (value: string): { trailingZeroCount: number; significantDigits: string } => {
  const significantDigits = value.replace(/0+$/, '')

  return {
    trailingZeroCount: value.length - significantDigits.length,
    significantDigits,
  }
}

const calculatePartialProduct = (
  multiplicandDigits: string,
  multiplierDigit: string,
  multiplierDigitIndex: number,
  shift: number,
): MultiplicationPartialProduct => {
  let carry = 0
  let value = ''
  const digitSteps: MultiplicationDigitStep[] = []

  for (let index = multiplicandDigits.length - 1; index >= 0; index -= 1) {
    const carryIn = carry
    const total = Number(multiplicandDigits[index]) * Number(multiplierDigit) + carryIn
    const resultDigit = String(total % 10)
    carry = Math.floor(total / 10)
    value = `${resultDigit}${value}`
    digitSteps.unshift({
      multiplicandDigitIndex: index,
      multiplicandDigit: multiplicandDigits[index],
      multiplierDigit,
      carryIn,
      total,
      resultDigit,
      carryOut: carry,
    })
  }

  if (carry > 0) value = `${carry}${value}`

  return {
    multiplierDigitIndex,
    multiplierDigit,
    shift,
    value: trimLeadingZeros(value),
    digitSteps,
  }
}

const calculateAddition = (
  partialProducts: MultiplicationPartialProduct[],
): Pick<MultiplicationComputation, 'productDigits' | 'additionSteps'> => {
  const maximumColumnCount = Math.max(...partialProducts.map(({ value, shift }) => value.length + shift))
  const resultDigits: string[] = []
  const additionSteps: MultiplicationAdditionStep[] = []
  let carry = 0

  for (let columnFromRight = 0; columnFromRight < maximumColumnCount || carry > 0; columnFromRight += 1) {
    const addendDigits = partialProducts.map(({ value, shift }) => {
      const valueIndex = value.length - 1 - (columnFromRight - shift)
      return valueIndex >= 0 && valueIndex < value.length ? value[valueIndex] : '0'
    })
    const carryIn = carry
    const total = addendDigits.reduce((sum, digit) => sum + Number(digit), carryIn)
    const resultDigit = String(total % 10)
    carry = Math.floor(total / 10)
    resultDigits.unshift(resultDigit)
    additionSteps.push({ columnFromRight, addendDigits, carryIn, total, resultDigit, carryOut: carry })
  }

  return { productDigits: trimLeadingZeros(resultDigits.join('')), additionSteps }
}

/**
 * Calculates primary-school long multiplication using only decimal strings.
 *
 * Each multiplier digit creates one unshifted partial product and records its
 * decimal-place `shift`. The final result is calculated by string-column
 * addition, keeping the calculator independent from grid rows and pixels.
 */
export const computeMultiplication = (
  multiplicandValue: unknown,
  multiplierValue: unknown,
  options: MultiplicationOptions = {},
): MultiplicationComputation => {
  const multiplicand = parseDecimal(multiplicandValue, '被乘数')
  const multiplier = parseDecimal(multiplierValue, '乘数')
  const firstOperandDigits = multiplicand.digits
  const secondOperandDigits = multiplier.digits
  const firstIsTrailingZeroMultiple = isTrailingZeroMultiple(firstOperandDigits)
  const secondIsTrailingZeroMultiple = isTrailingZeroMultiple(secondOperandDigits)
  const useTrailingZeroShortcut = options.useTrailingZeroShortcut !== false
  // 无论数值大小或是否启用快捷计算，竖式上下行都严格保留用户输入顺序。
  const operandsSwapped = false
  const multiplicandDigits = firstOperandDigits
  const multiplierDigits = secondOperandDigits
  // 小数点后的零是小数位值的一部分，不能套用整数“末尾补零”教学快捷规则。
  const canUseTrailingZeroShortcut =
    multiplicand.decimalPlaces === 0 && multiplier.decimalPlaces === 0 && useTrailingZeroShortcut
  const multiplicandShortcut =
    canUseTrailingZeroShortcut && firstIsTrailingZeroMultiple ? splitTrailingZeros(multiplicandDigits) : null
  const multiplierShortcut =
    canUseTrailingZeroShortcut && secondIsTrailingZeroMultiple ? splitTrailingZeros(multiplierDigits) : null
  const trailingZeroShortcut =
    multiplicandShortcut || multiplierShortcut
      ? {
          significantMultiplicandDigits: multiplicandShortcut?.significantDigits ?? multiplicandDigits,
          multiplicandTrailingZeroCount: multiplicandShortcut?.trailingZeroCount ?? 0,
          significantMultiplierDigits: multiplierShortcut?.significantDigits ?? multiplierDigits,
          multiplierTrailingZeroCount: multiplierShortcut?.trailingZeroCount ?? 0,
          trailingZeroCount:
            (multiplicandShortcut?.trailingZeroCount ?? 0) + (multiplierShortcut?.trailingZeroCount ?? 0),
        }
      : null
  // 快捷计算会移除上下两行各自末尾的零；中间零仍然是实际位值，不能跳过。
  const calculationMultiplicandDigits = trailingZeroShortcut?.significantMultiplicandDigits ?? multiplicandDigits
  const calculationMultiplierDigits = trailingZeroShortcut?.significantMultiplierDigits ?? multiplierDigits
  const partialProducts: MultiplicationPartialProduct[] = []

  for (let index = calculationMultiplierDigits.length - 1; index >= 0; index -= 1) {
    partialProducts.push(
      calculatePartialProduct(
        calculationMultiplicandDigits,
        calculationMultiplierDigits[index],
        index,
        calculationMultiplierDigits.length - 1 - index,
      ),
    )
  }

  const { productDigits: baseProductDigits, additionSteps } = calculateAddition(partialProducts)
  const productDigits =
    trailingZeroShortcut && baseProductDigits !== '0'
      ? `${baseProductDigits}${'0'.repeat(trailingZeroShortcut.trailingZeroCount)}`
      : baseProductDigits

  const decimalPlaces = multiplicand.decimalPlaces + multiplier.decimalPlaces
  return {
    multiplicandDigits,
    multiplierDigits,
    multiplicandText: multiplicand.text,
    multiplierText: multiplier.text,
    multiplicandDecimalPlaces: multiplicand.decimalPlaces,
    multiplierDecimalPlaces: multiplier.decimalPlaces,
    decimalPlaces,
    operandsSwapped,
    productDigits,
    productText: formatDecimal(productDigits, decimalPlaces),
    trailingZeroShortcut,
    partialProducts,
    additionSteps,
  }
}
