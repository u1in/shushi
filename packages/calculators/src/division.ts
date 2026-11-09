/** Division calculator: validates inputs and produces the renderer-independent long-division process. */
import type { DivisionComputation, DivisionOptions, LongDivisionStep } from './types'
import { formatDecimal, parseDecimal, trimLeadingZeros } from './decimal'

interface PositionedQuotientDigit {
  column: number
  digit: string
}

/** 循环小数必须有终止点；调用方仍可通过选项提高或收紧此默认教学上限。 */
export const DEFAULT_MAX_DECIMAL_DIGITS = 10

/** Compares two non-negative decimal strings without converting them to large numbers. */
const compareDigitStrings = (left: string, right: string): number => {
  const normalizedLeft = trimLeadingZeros(left)
  const normalizedRight = trimLeadingZeros(right)

  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length > normalizedRight.length ? 1 : -1
  }

  if (normalizedLeft === normalizedRight) return 0
  return normalizedLeft > normalizedRight ? 1 : -1
}

/** Returns minuend - subtrahend for canonical strings where minuend >= subtrahend. */
const subtractDigitStrings = (minuend: string, subtrahend: string): string => {
  let borrow = 0
  let result = ''

  for (let index = minuend.length - 1; index >= 0; index -= 1) {
    let digit = Number(minuend[index]) - borrow
    const subtrahendDigit = Number(subtrahend[subtrahend.length - minuend.length + index] ?? '0')

    if (digit < subtrahendDigit) {
      digit += 10
      borrow = 1
    } else {
      borrow = 0
    }

    result = `${digit - subtrahendDigit}${result}`
  }

  return trimLeadingZeros(result)
}

/** Multiplies a decimal string by one trial quotient digit (0–9). */
const multiplyBySingleDigit = (value: string, digit: number): string => {
  if (digit === 0 || value === '0') return '0'

  let carry = 0
  let result = ''

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const product = Number(value[index]) * digit + carry
    result = `${product % 10}${result}`
    carry = Math.floor(product / 10)
  }

  return `${carry || ''}${result}`
}

/** Finds the largest single digit whose product with divisor does not exceed partialDividend. */
const findQuotientDigit = (partialDividend: string, divisorDigits: string): { digit: number; product: string } => {
  for (let digit = 9; digit >= 1; digit -= 1) {
    const product = multiplyBySingleDigit(divisorDigits, digit)

    if (compareDigitStrings(product, partialDividend) <= 0) {
      return { digit, product }
    }
  }

  return { digit: 0, product: '0' }
}

const appendDigit = (value: string, digit: string): string => trimLeadingZeros(`${value}${digit}`)

const createStep = (
  dividendColumn: number,
  divisor: string,
  quotientDigit: string,
  partialDividend: string,
  product: string,
  remainder: string,
): LongDivisionStep => ({
  dividendColumn,
  divisor,
  quotientDigit,
  partialDividend,
  product,
  remainder,
})

const normalizeOptions = ({ maxDecimalDigits = DEFAULT_MAX_DECIMAL_DIGITS }: DivisionOptions): DivisionOptions => {
  if (maxDecimalDigits !== undefined && (!Number.isInteger(maxDecimalDigits) || maxDecimalDigits < 0)) {
    throw new Error('小数最大位数必须是非负整数。')
  }

  return { maxDecimalDigits }
}

/**
 * Calculates a primary-school long division using decimal strings only.
 *
 * 具体规则见 `packages/calculators/docs/除法计算规则.md`：开头被跳过的商零不记录为步骤；
 * 商开始后，每次试除（包括商位为 `0`）都会记录。商全为零时保留最后一次
 * `partialDividend - 0` 步骤。整数部分有余数时自动补零展开商小数；配置小数位上限后
 * 会采用该上限，未配置时最多计算十位。返回结果不含布局信息，因而任意渲染器都可将其编排为竖式。
 */
export const computeDivision = (
  divisorValue: unknown,
  dividendValue: unknown,
  options: DivisionOptions = {},
): DivisionComputation => {
  const { maxDecimalDigits } = normalizeOptions(options)
  const decimalLimit = maxDecimalDigits ?? DEFAULT_MAX_DECIMAL_DIGITS
  const divisor = parseDecimal(divisorValue, '除数')
  const dividend = parseDecimal(dividendValue, '被除数')
  // 先把除数的小数点右移为整数；被除数同步右移，保留剩余的小数部分供逐位过程处理。
  const divisorDigits = trimLeadingZeros(divisor.digits)
  const dividendDigits = `${dividend.digits}${'0'.repeat(Math.max(divisor.decimalPlaces - dividend.decimalPlaces, 0))}`
  const decimalPlaces = Math.max(dividend.decimalPlaces - divisor.decimalPlaces, 0)
  const integerDividendDigitCount = dividendDigits.length - decimalPlaces
  const divisorText = formatDecimal(divisorDigits, 0)
  const dividendText = formatDecimal(dividendDigits, decimalPlaces)

  if (divisorDigits === '0') {
    throw new Error('除数不能为 0。')
  }

  const quotientDigits: PositionedQuotientDigit[] = []
  const steps: LongDivisionStep[] = []
  const integerQuotientDigits: string[] = []
  let remainder = '0'
  let quotientStarted = false
  let integerStartColumn = -1

  for (let dividendColumn = 0; dividendColumn < integerDividendDigitCount; dividendColumn += 1) {
    const partialDividend = appendDigit(remainder, dividendDigits[dividendColumn])

    if (!quotientStarted && compareDigitStrings(partialDividend, divisorDigits) < 0) {
      remainder = partialDividend
      continue
    }

    quotientStarted = true
    integerStartColumn = integerStartColumn === -1 ? dividendColumn : integerStartColumn
    const { digit, product } = findQuotientDigit(partialDividend, divisorDigits)
    const quotientDigit = String(digit)
    remainder = subtractDigitStrings(partialDividend, product)
    quotientDigits.push({ column: dividendColumn, digit: quotientDigit })
    integerQuotientDigits.push(quotientDigit)
    steps.push(createStep(dividendColumn, divisorDigits, quotientDigit, partialDividend, product, remainder))
  }

  // R5/R6: a zero integer quotient still has one visible `partialDividend - 0` step.
  if (!quotientStarted) {
    const dividendColumn = integerDividendDigitCount - 1
    quotientDigits.push({ column: dividendColumn, digit: '0' })
    steps.push(createStep(dividendColumn, divisorDigits, '0', remainder, '0', remainder))
  }

  const integerText = quotientStarted ? integerQuotientDigits.join('') : '0'
  const fractionalDigits: string[] = []
  let fractionalDigitCount = 0

  /** 继续使用整数试商步骤处理原输入的小数位或后续补出的零。 */
  const calculateFractionalDigit = (dividendColumn: number, digit: string): void => {
    const partialDividend = appendDigit(remainder, digit)
    const trial = findQuotientDigit(partialDividend, divisorDigits)
    remainder = subtractDigitStrings(partialDividend, trial.product)
    const quotientDigit = String(trial.digit)
    fractionalDigits.push(quotientDigit)
    quotientDigits.push({ column: dividendColumn, digit: quotientDigit })
    steps.push(createStep(dividendColumn, divisorDigits, quotientDigit, partialDividend, trial.product, remainder))
  }

  // 原被除数带小数时，点后每一位都属于商的小数过程；否则只在有余数时补零展开。
  const needsFractionalCalculation = decimalPlaces > 0 || remainder !== '0'
  if (needsFractionalCalculation) {
    for (let dividendColumn = integerDividendDigitCount; dividendColumn < dividendDigits.length; dividendColumn += 1) {
      calculateFractionalDigit(dividendColumn, dividendDigits[dividendColumn])
    }
    for (let fractionIndex = 0; fractionIndex < decimalLimit && remainder !== '0'; fractionIndex += 1) {
      calculateFractionalDigit(dividendDigits.length + fractionIndex, '0')
      fractionalDigitCount += 1
    }
  }

  // 只有输入本身带小数，或确实追加了小数位时才输出小数点；上限为 0 时，整数输入直接保留余数。
  const hasFraction = decimalPlaces > 0 || fractionalDigitCount > 0
  const decimalTruncated = hasFraction && remainder !== '0' && fractionalDigitCount === decimalLimit
  const quotientTokens = quotientDigits.flatMap(({ column, digit }) => {
    const token = { kind: 'digit' as const, digit, column }
    return hasFraction && column === integerDividendDigitCount
      ? [{ kind: 'decimalSeparator' as const, digit: '.' as const, column: integerDividendDigitCount - 1 }, token]
      : [token]
  })

  return {
    sourceDivisorText: divisor.text,
    sourceDividendText: dividend.text,
    normalizationShift: divisor.decimalPlaces,
    divisorDigits,
    divisorText,
    dividendText,
    dividendDigits,
    integerDividendDigitCount,
    quotientText: hasFraction ? `${integerText}.${fractionalDigits.join('')}` : integerText,
    quotientTokens,
    steps,
    remainder,
    hasFraction,
    fractionalDigitCount,
    decimalTruncated,
    integerStartColumn,
    digitColumnCount: dividendDigits.length + fractionalDigitCount,
  }
}
