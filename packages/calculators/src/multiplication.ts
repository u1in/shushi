/** Multiplication calculator: validates inputs and produces a layout-free long-multiplication process. */
import type {
  MultiplicationAdditionStep,
  CalculationStepSnapshot,
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
  multiplicandDigitOffset: number,
  multiplierDigit: string,
  multiplierDigitIndex: number,
  shift: number,
  onDigitStep?: (step: MultiplicationDigitStep, partialProductDigits: string) => void,
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
    const step = {
      // 小数计算会略过被乘数左侧仅作小数占位的零，索引仍指向原数字串。
      multiplicandDigitIndex: multiplicandDigitOffset + index,
      multiplicandDigit: multiplicandDigits[index],
      multiplierDigit,
      carryIn,
      total,
      resultDigit,
      carryOut: carry,
    }
    digitSteps.unshift(step)
    onDigitStep?.(step, value)
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
  onColumnStep?: (step: MultiplicationAdditionStep, productDigits: string) => void,
): Pick<MultiplicationComputation, 'productDigits' | 'additionSteps'> => {
  // 两个小数操作数中任一个为零时，没有需要展示的有效逐位计算。
  if (partialProducts.length === 0) return { productDigits: '0', additionSteps: [] }
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
    const step = { columnFromRight, addendDigits, carryIn, total, resultDigit, carryOut: carry }
    additionSteps.push(step)
    onColumnStep?.(step, resultDigits.join(''))
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
  const hasDecimalOperand = multiplicand.decimalPlaces > 0 || multiplier.decimalPlaces > 0
  // 小数竖式的前导零只用于定位小数点：不参与逐位乘法，也不形成空白过程行。
  const decimalMultiplicandDigits = trimLeadingZeros(multiplicandDigits)
  const decimalMultiplierDigits = trimLeadingZeros(multiplierDigits)
  const calculationMultiplicandDigits = hasDecimalOperand
    ? decimalMultiplicandDigits
    : (trailingZeroShortcut?.significantMultiplicandDigits ?? multiplicandDigits)
  const calculationMultiplierDigits = hasDecimalOperand
    ? decimalMultiplierDigits
    : (trailingZeroShortcut?.significantMultiplierDigits ?? multiplierDigits)
  const multiplicandDigitOffset = hasDecimalOperand
    ? multiplicandDigits.length - calculationMultiplicandDigits.length
    : 0
  const multiplierDigitOffset = hasDecimalOperand ? multiplierDigits.length - calculationMultiplierDigits.length : 0
  const partialProducts: MultiplicationPartialProduct[] = []
  const calculationSteps: CalculationStepSnapshot[] = []

  // 乘数或被乘数去点后全为零时，只保留最终积和小数点定位，不展示零乘法。
  const hasEffectiveDecimalCalculation =
    !hasDecimalOperand || (calculationMultiplicandDigits !== '0' && calculationMultiplierDigits !== '0')
  for (let index = calculationMultiplierDigits.length - 1; hasEffectiveDecimalCalculation && index >= 0; index -= 1) {
    const multiplierDigitIndex = multiplierDigitOffset + index
    const partialProductIndex = partialProducts.length
    partialProducts.push(
      calculatePartialProduct(
        calculationMultiplicandDigits,
        multiplicandDigitOffset,
        calculationMultiplierDigits[index],
        multiplierDigitIndex,
        hasDecimalOperand
          ? multiplierDigits.length - 1 - multiplierDigitIndex
          : calculationMultiplierDigits.length - 1 - multiplierDigitIndex,
        (digit, partialProductDigits) => {
          calculationSteps.push({
            action: 'multiply-digit',
            operands: [multiplicand.text, multiplier.text],
            result: partialProductDigits,
            inputs: [digit.multiplicandDigit, digit.multiplierDigit],
            partialProductIndex,
            multiplicandDigitIndex: digit.multiplicandDigitIndex,
            carryIn: digit.carryIn,
            carryOut: digit.carryOut,
            shift: hasDecimalOperand
              ? multiplierDigits.length - 1 - multiplierDigitIndex
              : calculationMultiplierDigits.length - 1 - multiplierDigitIndex,
          })
        },
      ),
    )
  }

  const { productDigits: baseProductDigits, additionSteps } = calculateAddition(
    partialProducts,
    (column, productDigits) => {
      if (partialProducts.length <= 1) return
      calculationSteps.push({
        action: 'add-partial-products',
        operands: partialProducts.map(({ value, shift }) => `${value}${'0'.repeat(shift)}`),
        result: productDigits,
        column: column.columnFromRight,
        inputs: column.addendDigits,
        carryIn: column.carryIn,
        carryOut: column.carryOut,
      })
    },
  )
  const productDigits =
    trailingZeroShortcut && baseProductDigits !== '0'
      ? `${baseProductDigits}${'0'.repeat(trailingZeroShortcut.trailingZeroCount)}`
      : baseProductDigits

  const decimalPlaces = multiplicand.decimalPlaces + multiplier.decimalPlaces
  const productText = formatDecimal(productDigits, decimalPlaces)
  if (decimalPlaces > 0)
    calculationSteps.push({
      action: 'place-decimal',
      operands: [multiplicand.text, multiplier.text],
      result: productText,
    })
  if (trailingZeroShortcut?.trailingZeroCount)
    calculationSteps.push({
      action: 'restore-trailing-zeros',
      operands: [multiplicand.text, multiplier.text],
      result: productText,
      zeroCount: trailingZeroShortcut.trailingZeroCount,
    })
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
    productText,
    trailingZeroShortcut,
    partialProducts,
    additionSteps,
    calculationSteps,
  }
}
