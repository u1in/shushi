/** 小数仅在计算器中拆成整数数字和位数；逐位算法始终只处理数字字符串。 */
export interface ParsedDecimal {
  digits: string
  decimalPlaces: number
  text: string
}

export const trimLeadingZeros = (value: string): string => value.replace(/^0+(?=\d)/, '') || '0'

/** 规范化非负十进制小数，同时保留小数末尾零以维持教学竖式的位值。 */
export const parseDecimal = (value: unknown, label: string): ParsedDecimal => {
  const raw = String(value ?? '')
  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    throw new Error(`${label}请输入非负十进制数，例如 12、0.5 或 3456.78。`)
  }

  const [integerPart, fractionalPart = ''] = raw.split('.')
  const integerDigits = trimLeadingZeros(integerPart)
  return {
    digits: `${integerDigits}${fractionalPart}`,
    decimalPlaces: fractionalPart.length,
    text: fractionalPart ? `${integerDigits}.${fractionalPart}` : integerDigits,
  }
}

/** 把已按同一倍率计算的数字串恢复为十进制文本；小数位数由调用方决定。 */
export const formatDecimal = (value: string, decimalPlaces: number): string => {
  const digits = trimLeadingZeros(value)
  if (decimalPlaces === 0) return digits

  const padded = digits.padStart(decimalPlaces + 1, '0')
  const integerPart = trimLeadingZeros(padded.slice(0, -decimalPlaces))
  return `${integerPart}.${padded.slice(-decimalPlaces)}`
}

/** 以公共小数位补零，让原有整数逐位算法可直接复用。 */
export const scaleDecimalDigits = (value: ParsedDecimal, decimalPlaces: number): string =>
  `${value.digits}${'0'.repeat(decimalPlaces - value.decimalPlaces)}`

export const decimalDigitLength = (value: string): number => value.replace('.', '').length
