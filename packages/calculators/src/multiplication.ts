/** Multiplication calculator: validates inputs and produces a layout-free long-multiplication process. */
import type {
  MultiplicationAdditionStep,
  MultiplicationComputation,
  MultiplicationDigitStep,
  MultiplicationOptions,
  MultiplicationPartialProduct,
  MultiplicationTrailingZeroShortcut,
} from './types'

const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '') || '0'

/** Validates an integer input and returns its canonical decimal-string form. */
const parseIntegerDigits = (value: unknown, label: string): string => {
  const raw = String(value ?? '')

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label}请输入非负整数，例如 12 或 3456。`)
  }

  return trimLeadingZeros(raw)
}

/** Compares canonical non-negative decimal strings without numeric conversion. */
const compareDigitStrings = (left: string, right: string): number => {
  if (left.length !== right.length) return left.length > right.length ? 1 : -1
  if (left === right) return 0
  return left > right ? 1 : -1
}

/** 零本身没有可计算的有效位，不能作为“末尾补零”的快捷乘数。 */
const isTrailingZeroMultiple = (value: string): boolean => value !== '0' && value.endsWith('0')

/** 拆出十进制末尾零，保留仍需逐位相乘的有效乘数。 */
const splitTrailingZeros = (value: string): MultiplicationTrailingZeroShortcut => {
  const significantMultiplierDigits = value.replace(/0+$/, '')

  return {
    trailingZeroCount: value.length - significantMultiplierDigits.length,
    significantMultiplierDigits,
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
  const firstOperandDigits = parseIntegerDigits(multiplicandValue, '被乘数')
  const secondOperandDigits = parseIntegerDigits(multiplierValue, '乘数')
  const firstIsTrailingZeroMultiple = isTrailingZeroMultiple(firstOperandDigits)
  const secondIsTrailingZeroMultiple = isTrailingZeroMultiple(secondOperandDigits)
  const useTrailingZeroShortcut = options.useTrailingZeroShortcut !== false
  // 只有启用快捷计算时，才为了拆除末尾零而把唯一的十倍数放到第二行。
  // 关闭时始终按“大数在上”，避免展示顺序与完整逐位乘法规则相冲突。
  const operandsSwapped = options.preserveOperandOrder
    ? false
    : useTrailingZeroShortcut && firstIsTrailingZeroMultiple !== secondIsTrailingZeroMultiple
      ? firstIsTrailingZeroMultiple
      : compareDigitStrings(firstOperandDigits, secondOperandDigits) < 0
  const multiplicandDigits = operandsSwapped ? secondOperandDigits : firstOperandDigits
  const multiplierDigits = operandsSwapped ? firstOperandDigits : secondOperandDigits
  const trailingZeroShortcut = useTrailingZeroShortcut && isTrailingZeroMultiple(multiplierDigits)
    ? splitTrailingZeros(multiplierDigits)
    : null
  // 快捷计算只移除乘数末尾的零；中间零仍然是实际位值，不能跳过。
  const calculationMultiplierDigits = trailingZeroShortcut?.significantMultiplierDigits ?? multiplierDigits
  const partialProducts: MultiplicationPartialProduct[] = []

  for (let index = calculationMultiplierDigits.length - 1; index >= 0; index -= 1) {
    partialProducts.push(calculatePartialProduct(
      multiplicandDigits,
      calculationMultiplierDigits[index],
      index,
      calculationMultiplierDigits.length - 1 - index,
    ))
  }

  const { productDigits: baseProductDigits, additionSteps } = calculateAddition(partialProducts)
  const productDigits = trailingZeroShortcut && baseProductDigits !== '0'
    ? `${baseProductDigits}${'0'.repeat(trailingZeroShortcut.trailingZeroCount)}`
    : baseProductDigits

  return {
    multiplicandDigits,
    multiplierDigits,
    operandsSwapped,
    productDigits,
    trailingZeroShortcut,
    partialProducts,
    additionSteps,
  }
}
