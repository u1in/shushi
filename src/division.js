const trimLeadingZeros = (value) => value.replace(/^0+(?=\d)/, '') || '0'

const parseInteger = (value, label) => {
  const raw = String(value ?? '')

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label}请输入非负整数，例如 12 或 3456。`)
  }

  return trimLeadingZeros(raw)
}

const compareDigits = (left, right) => {
  const normalizedLeft = trimLeadingZeros(left)
  const normalizedRight = trimLeadingZeros(right)

  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length > normalizedRight.length ? 1 : -1
  }

  if (normalizedLeft === normalizedRight) return 0
  return normalizedLeft > normalizedRight ? 1 : -1
}

const subtractDigits = (minuend, subtrahend) => {
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

const multiplyByDigit = (value, digit) => {
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

const findQuotientDigit = (current, divisorDigits) => {
  for (let digit = 9; digit >= 1; digit -= 1) {
    const product = multiplyByDigit(divisorDigits, digit)

    if (compareDigits(product, current) <= 0) {
      return { digit, product }
    }
  }

  return { digit: 0, product: '0' }
}

const appendDigit = (value, digit) => trimLeadingZeros(`${value}${digit}`)

const createOperation = ({ position, current, product }) => {
  const currentText = current.toString()
  const productText = product.toString()

  return {
    position,
    currentText,
    productText,
    currentLeft: position - currentText.length + 1,
    productLeft: position - productText.length + 1,
  }
}

const calculateDecimalExpansion = ({
  divisorDigits,
  dividendDigits,
  quotientByPosition,
  steps,
  remainder,
  maxDecimalDigits,
}) => {
  const decimalQuotientByPosition = new Map(quotientByPosition)
  const decimalSteps = [...steps]
  const fractionalDigits = []
  const seenRemainders = new Set()
  let workingRemainder = remainder

  for (let fractionIndex = 0; fractionIndex < maxDecimalDigits; fractionIndex += 1) {
    if (seenRemainders.has(workingRemainder)) return null

    seenRemainders.add(workingRemainder)
    const position = dividendDigits.length + fractionIndex
    const current = appendDigit(workingRemainder, '0')
    const { digit: quotientDigit, product } = findQuotientDigit(current, divisorDigits)

    workingRemainder = subtractDigits(current, product)
    fractionalDigits.push(String(quotientDigit))
    decimalQuotientByPosition.set(position, String(quotientDigit))
    decimalSteps.push({
      ...createOperation({ position, current, product }),
      remainder: workingRemainder,
      showSubtract: quotientDigit > 0,
    })

    if (workingRemainder === '0') {
      return {
        fractionalDigits,
        quotientByPosition: decimalQuotientByPosition,
        steps: decimalSteps,
      }
    }
  }

  return null
}

export const computeDivision = (
  divisorValue,
  dividendValue,
  { resultMode = 'remainder', maxDecimalDigits = 24 } = {},
) => {
  const divisorDigits = parseInteger(divisorValue, '除数')
  const dividendDigits = parseInteger(dividendValue, '被除数')

  if (divisorDigits === '0') {
    throw new Error('除数不能为 0。')
  }

  const quotientByPosition = new Map()
  const steps = []
  let remainder = '0'
  let started = false
  let integerStart = -1
  const integerQuotientDigits = []

  for (let position = 0; position < dividendDigits.length; position += 1) {
    const current = appendDigit(remainder, dividendDigits[position])

    if (!started && compareDigits(current, divisorDigits) < 0) {
      remainder = current
      continue
    }

    started = true
    integerStart = integerStart === -1 ? position : integerStart
    const { digit: quotientDigit, product } = findQuotientDigit(current, divisorDigits)
    quotientByPosition.set(position, String(quotientDigit))
    integerQuotientDigits.push(String(quotientDigit))
    remainder = subtractDigits(current, product)
    steps.push({
      ...createOperation({ position, current, product }),
      remainder,
      showSubtract: quotientDigit > 0,
    })
  }

  if (!started) {
    quotientByPosition.set(dividendDigits.length - 1, '0')
  }

  const integerText = started ? integerQuotientDigits.join('') : '0'
  const decimalExpansion = resultMode === 'decimal' && remainder !== '0'
    ? calculateDecimalExpansion({
      divisorDigits,
      dividendDigits,
      quotientByPosition,
      steps,
      remainder,
      maxDecimalDigits,
    })
    : null
  const hasFraction = decimalExpansion !== null

  return {
    divisorDigits,
    dividendDigits,
    quotientText: hasFraction ? `${integerText}.${decimalExpansion.fractionalDigits.join('')}` : integerText,
    quotientByPosition: decimalExpansion?.quotientByPosition ?? quotientByPosition,
    steps: decimalExpansion?.steps ?? steps,
    remainder: hasFraction ? '0' : remainder,
    hasFraction,
    fractionalDigitCount: decimalExpansion?.fractionalDigits.length ?? 0,
    decimalFallback: resultMode === 'decimal' && remainder !== '0' && !hasFraction,
    integerStart,
    digitCount: dividendDigits.length + (decimalExpansion?.fractionalDigits.length ?? 0),
  }
}
