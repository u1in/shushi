/** Division calculator: validates inputs and produces the renderer-independent long-division process. */
import type {
  DivisionComputation,
  DivisionOptions,
  LongDivisionStep,
} from '../scene/types'

interface PositionedQuotientDigit {
  column: number
  digit: string
}

const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '') || '0'

/** Validates an integer input and returns its canonical decimal-string form. */
const parseIntegerDigits = (value: unknown, label: string): string => {
  const raw = String(value ?? '')

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label}请输入非负整数，例如 12 或 3456。`)
  }

  return trimLeadingZeros(raw)
}

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
const findQuotientDigit = (partialDividend: string, divisorDigits: string): { digit: number, product: string } => {
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

interface DecimalExpansion {
  fractionalDigits: string[]
  quotientDigits: PositionedQuotientDigit[]
  steps: LongDivisionStep[]
}

/**
 * Extends a completed integer process with appended-zero columns. Returning
 * null deliberately discards the tentative work, which implements the rule
 * that recurring or capped decimals fall back to the integer-remainder result.
 */
const calculateFiniteDecimalExpansion = ({
  divisorDigits,
  dividendDigits,
  quotientDigits,
  steps,
  remainder,
  maxDecimalDigits,
}: {
  divisorDigits: string
  dividendDigits: string
  quotientDigits: PositionedQuotientDigit[]
  steps: LongDivisionStep[]
  remainder: string
  maxDecimalDigits: number
}): DecimalExpansion | null => {
  const decimalQuotientDigits = [...quotientDigits]
  const decimalSteps = [...steps]
  const fractionalDigits: string[] = []
  const seenRemainders = new Set<string>()
  let workingRemainder = remainder

  for (let fractionIndex = 0; fractionIndex < maxDecimalDigits; fractionIndex += 1) {
    if (seenRemainders.has(workingRemainder)) return null

    seenRemainders.add(workingRemainder)
    const dividendColumn = dividendDigits.length + fractionIndex
    const partialDividend = appendDigit(workingRemainder, '0')
    const { digit, product } = findQuotientDigit(partialDividend, divisorDigits)

    workingRemainder = subtractDigitStrings(partialDividend, product)
    fractionalDigits.push(String(digit))
    decimalQuotientDigits.push({ column: dividendColumn, digit: String(digit) })
    decimalSteps.push(createStep(dividendColumn, divisorDigits, String(digit), partialDividend, product, workingRemainder))

    if (workingRemainder === '0') {
      return { fractionalDigits, quotientDigits: decimalQuotientDigits, steps: decimalSteps }
    }
  }

  return null
}

const normalizeOptions = ({ resultMode = 'remainder', maxDecimalDigits = 24 }: DivisionOptions): Required<DivisionOptions> => {
  if (!Number.isInteger(maxDecimalDigits) || maxDecimalDigits < 1) {
    throw new Error('小数最大位数必须是正整数。')
  }

  return { resultMode, maxDecimalDigits }
}

/**
 * Calculates a primary-school long division using decimal strings only.
 *
 * It follows `docs/除法计算规则.md`: skipped leading quotient zeroes are not
 * steps, while every trial after the quotient starts is recorded, including
 * quotient digit `0`. An all-zero quotient keeps one final `partialDividend - 0`
 * step. A finite decimal expansion is committed only after its remainder reaches
 * zero. The returned process is layout-free so any renderer can turn it into a
 * vertical-division diagram.
 */
export const computeDivision = (
  divisorValue: unknown,
  dividendValue: unknown,
  options: DivisionOptions = {},
): DivisionComputation => {
  const { resultMode, maxDecimalDigits } = normalizeOptions(options)
  const divisorDigits = parseIntegerDigits(divisorValue, '除数')
  const dividendDigits = parseIntegerDigits(dividendValue, '被除数')

  if (divisorDigits === '0') {
    throw new Error('除数不能为 0。')
  }

  const quotientDigits: PositionedQuotientDigit[] = []
  const steps: LongDivisionStep[] = []
  const integerQuotientDigits: string[] = []
  let remainder = '0'
  let quotientStarted = false
  let integerStartColumn = -1

  for (let dividendColumn = 0; dividendColumn < dividendDigits.length; dividendColumn += 1) {
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
    const dividendColumn = dividendDigits.length - 1
    quotientDigits.push({ column: dividendColumn, digit: '0' })
    steps.push(createStep(dividendColumn, divisorDigits, '0', remainder, '0', remainder))
  }

  const integerText = quotientStarted ? integerQuotientDigits.join('') : '0'
  const decimalExpansion = resultMode === 'decimal' && remainder !== '0'
    ? calculateFiniteDecimalExpansion({
      divisorDigits,
      dividendDigits,
      quotientDigits,
      steps,
      remainder,
      maxDecimalDigits,
    })
    : null
  const hasFraction = decimalExpansion !== null
  const fractionalDigitCount = decimalExpansion?.fractionalDigits.length ?? 0

  const finalQuotientDigits = decimalExpansion?.quotientDigits ?? quotientDigits
  const quotientTokens = finalQuotientDigits.flatMap(({ column, digit }) => {
    const displayColumn = column + (hasFraction && column >= dividendDigits.length ? 1 : 0)
    const token = { kind: 'digit' as const, digit, column: displayColumn }
    return hasFraction && column === dividendDigits.length
      ? [{ kind: 'decimalSeparator' as const, digit: '.' as const, column }, token]
      : [token]
  })

  return {
    divisorDigits,
    dividendDigits,
    quotientText: hasFraction ? `${integerText}.${decimalExpansion.fractionalDigits.join('')}` : integerText,
    quotientTokens,
    steps: decimalExpansion?.steps ?? steps,
    remainder: hasFraction ? '0' : remainder,
    hasFraction,
    fractionalDigitCount,
    decimalFallback: resultMode === 'decimal' && remainder !== '0' && !hasFraction,
    integerStartColumn,
    digitColumnCount: dividendDigits.length + fractionalDigitCount,
  }
}
