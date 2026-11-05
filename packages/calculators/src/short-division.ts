/** Short-division calculator: explicit division, factorization, common factors, and base conversion. */
import type {
  BaseConversionShortDivisionComputation,
  CommonFactorShortDivisionComputation,
  DivisionShortDivisionComputation,
  FactorizationShortDivisionComputation,
  ShortDivisionComputation,
  ShortDivisionInput,
  ShortDivisionStep,
} from './types'

// 课堂试除采用逐个候选质数枚举；设置上限可避免大质数输入令浏览器长时间阻塞。
const MAX_SHORT_DIVISION_DECIMAL = '1000000000'

const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '') || '0'

/** 进制转换允许任意长度的十进制字符串；其余模式需要受限整数来枚举质数。 */
const parseDecimal = (value: unknown, label: string): string => {
  const raw = String(value ?? '')
  if (!/^\d+$/.test(raw)) throw new Error(`${label}请输入非负整数，例如 12 或 3456。`)
  return trimLeadingZeros(raw)
}

const compareDecimal = (left: string, right: string): number => (
  left.length === right.length ? (left === right ? 0 : left > right ? 1 : -1) : left.length > right.length ? 1 : -1
)

const parsePositiveSafeInteger = (value: unknown, label: string): number => {
  const digits = parseDecimal(value, label)
  if (digits === '0') throw new Error(`${label}必须是正整数。`)
  if (compareDecimal(digits, MAX_SHORT_DIVISION_DECIMAL) > 0) {
    throw new Error(`${label}不能超过 ${MAX_SHORT_DIVISION_DECIMAL}，以保证课堂试除不会阻塞页面。`)
  }
  return Number(digits)
}

const isPrime = (value: number): boolean => {
  if (value < 2) return false
  if (value === 2) return true
  if (value % 2 === 0) return false
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) {
    if (value % divisor === 0) return false
  }
  return true
}

const findSmallestPrimeDivisor = (value: number): number => {
  if (value % 2 === 0) return 2
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) {
    if (value % divisor === 0) return divisor
  }
  return value
}

/** 用十进制字符串相乘，避免 LCM 与约数和超出安全整数范围。 */
const multiplyDecimal = (left: string, right: string): string => {
  if (left === '0' || right === '0') return '0'
  const result = Array<number>(left.length + right.length).fill(0)
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      result[leftIndex + rightIndex + 1] += Number(left[leftIndex]) * Number(right[rightIndex])
    }
  }
  for (let index = result.length - 1; index > 0; index -= 1) {
    result[index - 1] += Math.floor(result[index] / 10)
    result[index] %= 10
  }
  return trimLeadingZeros(result.join(''))
}

const addDecimal = (left: string, right: string): string => {
  let carry = 0
  let result = ''
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length || carry > 0; index += 1) {
    const total = Number(left[left.length - 1 - index] ?? '0') + Number(right[right.length - 1 - index] ?? '0') + carry
    result = `${total % 10}${result}`
    carry = Math.floor(total / 10)
  }
  return trimLeadingZeros(result)
}

const powerDecimal = (base: string, exponent: number): string => {
  let result = '1'
  for (let index = 0; index < exponent; index += 1) result = multiplyDecimal(result, base)
  return result
}

/** 用小学长除法计算“超长十进制数 ÷ 小进制数”。 */
const divideDecimalByBase = (digits: string, base: number): { quotient: string, remainder: number } => {
  let remainder = 0
  let quotient = ''
  for (const digit of digits) {
    const value = remainder * 10 + Number(digit)
    const quotientDigit = Math.floor(value / base)
    if (quotient || quotientDigit !== 0) quotient += String(quotientDigit)
    remainder = value % base
  }
  return { quotient: quotient || '0', remainder }
}

/** 指定除数的短除法保留一行过程；余数供调用方读取，但默认不作为教学余数显示。 */
const createDivision = (value: unknown, divisorValue: unknown): DivisionShortDivisionComputation => {
  const dividend = parseDecimal(value, '被除数')
  const divisor = parsePositiveSafeInteger(divisorValue, '除数')
  const { quotient, remainder } = divideDecimalByBase(dividend, divisor)
  return {
    mode: 'division',
    inputValues: [dividend],
    steps: [{ divisor: String(divisor), dividends: [dividend], quotients: [quotient], remainders: [String(remainder)] }],
    finalValues: [quotient],
    divisor: String(divisor),
    quotient,
    remainder: String(remainder),
  }
}

const createFactorization = (value: unknown): FactorizationShortDivisionComputation => {
  const input = parsePositiveSafeInteger(value, '待分解数')
  const steps: ShortDivisionStep[] = []
  const divisors: string[] = []
  let current = input
  // 最后一行的质数不再继续写左侧除数，和小学短除法版式一致。
  while (current > 1 && !isPrime(current)) {
    const divisor = findSmallestPrimeDivisor(current)
    const quotient = current / divisor
    divisors.push(String(divisor))
    steps.push({ divisor: String(divisor), dividends: [String(current)], quotients: [String(quotient)], remainders: ['0'] })
    current = quotient
  }
  const primeFactors = [...divisors, ...(current > 1 ? [String(current)] : [])]
  const exponents = new Map<string, number>()
  primeFactors.forEach((factor) => exponents.set(factor, (exponents.get(factor) ?? 0) + 1))
  const factorizationText = [...exponents.entries()].map(([factor, exponent]) => exponent === 1 ? factor : `${factor}^${exponent}`).join(' × ') || '1'
  const divisorCount = [...exponents.values()].reduce((total, exponent) => total * (exponent + 1), 1)
  const divisorSum = [...exponents.entries()].reduce((total, [factor, exponent]) => {
    let geometricSum = '0'
    for (let index = 0; index <= exponent; index += 1) geometricSum = addDecimal(geometricSum, powerDecimal(factor, index))
    return multiplyDecimal(total, geometricSum)
  }, '1')
  return { mode: 'factorization', inputValues: [String(input)], steps, finalValues: [String(current)], divisors, primeFactors, factorizationText, divisorCount, divisorSum }
}

const createCommonFactor = (values: unknown[]): CommonFactorShortDivisionComputation => {
  if (values.length < 2) throw new Error('求最大公约数和最小公倍数至少需要两个正整数。')
  const initialValues = values.map((value, index) => parsePositiveSafeInteger(value, `第 ${index + 1} 个数`))
  const currentValues = [...initialValues]
  const divisors: string[] = []
  const steps: ShortDivisionStep[] = []
  while (true) {
    const smallest = Math.min(...currentValues)
    let divisor = 0
    for (let candidate = 2; candidate <= smallest; candidate += candidate === 2 ? 1 : 2) {
      if (isPrime(candidate) && currentValues.every((value) => value % candidate === 0)) {
        divisor = candidate
        break
      }
    }
    if (divisor === 0) break
    const quotients = currentValues.map((value) => value / divisor)
    divisors.push(String(divisor))
    steps.push({ divisor: String(divisor), dividends: currentValues.map(String), quotients: quotients.map(String), remainders: currentValues.map(() => '0') })
    currentValues.splice(0, currentValues.length, ...quotients)
  }
  const gcd = divisors.reduce(multiplyDecimal, '1')
  const lcm = [...divisors, ...currentValues.map(String)].reduce(multiplyDecimal, '1')
  return { mode: 'commonFactor', inputValues: initialValues.map(String), steps, finalValues: currentValues.map(String), divisors, gcd, lcm }
}

const createBaseConversion = (value: unknown, targetBaseValue: unknown): BaseConversionShortDivisionComputation => {
  const input = parseDecimal(value, '待转换数')
  const targetBase = Number(targetBaseValue)
  if (!Number.isInteger(targetBase) || targetBase < 2 || targetBase > 36) throw new Error('目标进制必须是 2 到 36 的整数。')
  const steps: ShortDivisionStep[] = []
  const remainders: string[] = []
  let current = input
  // 0 的转换结果是 0，但无需伪造一行“0 ÷ base”的计算过程。
  while (current !== '0') {
    const { quotient, remainder } = divideDecimalByBase(current, targetBase)
    const remainderToken = remainder.toString(36).toUpperCase()
    steps.push({ divisor: String(targetBase), dividends: [current], quotients: [quotient], remainders: [remainderToken] })
    remainders.push(remainderToken)
    current = quotient
  }
  const remaindersBottomUp = [...remainders].reverse()
  return { mode: 'baseConversion', inputValues: [input], steps, finalValues: ['0'], targetBase, remaindersBottomUp, convertedText: remaindersBottomUp.join('') || '0' }
}

/** 根据用途选择终止条件和记录内容，输出完全不含像素或 DOM 信息的短除法过程。 */
export const computeShortDivision = ({ mode, values, divisor, targetBase = 2 }: ShortDivisionInput): ShortDivisionComputation => {
  if (!Array.isArray(values)) throw new Error('短除法输入必须提供数值数组。')
  if (mode === 'division') return createDivision(values[0], divisor)
  if (mode === 'factorization') return createFactorization(values[0])
  if (mode === 'commonFactor') return createCommonFactor(values)
  if (mode === 'baseConversion') return createBaseConversion(values[0], targetBase)
  throw new Error('未知的短除法用途。')
}
