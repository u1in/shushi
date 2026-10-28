/** Multiplication calculator: validates inputs and produces a layout-free long-multiplication process. */
import type {
  MultiplicationAdditionStep,
  MultiplicationComputation,
  MultiplicationDigitStep,
  MultiplicationPartialProduct,
} from '../scene/types'

const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '') || '0'

/** Validates an integer input and returns its canonical decimal-string form. */
const parseIntegerDigits = (value: unknown, label: string): string => {
  const raw = String(value ?? '')

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label}请输入非负整数，例如 12 或 3456。`)
  }

  return trimLeadingZeros(raw)
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
 * addition, keeping the calculator independent from board rows and pixels.
 */
export const computeMultiplication = (
  multiplicandValue: unknown,
  multiplierValue: unknown,
): MultiplicationComputation => {
  const multiplicandDigits = parseIntegerDigits(multiplicandValue, '被乘数')
  const multiplierDigits = parseIntegerDigits(multiplierValue, '乘数')
  const partialProducts: MultiplicationPartialProduct[] = []

  for (let index = multiplierDigits.length - 1; index >= 0; index -= 1) {
    partialProducts.push(calculatePartialProduct(
      multiplicandDigits,
      multiplierDigits[index],
      index,
      multiplierDigits.length - 1 - index,
    ))
  }

  const { productDigits, additionSteps } = calculateAddition(partialProducts)

  return { multiplicandDigits, multiplierDigits, productDigits, partialProducts, additionSteps }
}
