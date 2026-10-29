/** Semantic process contracts emitted by operation calculators. */
export type DivisionResultMode = 'decimal' | 'remainder'

export type QuotientToken =
  | { kind: 'digit', digit: string, column: number }
  | { kind: 'decimalSeparator', digit: '.', column: number }

export interface LongDivisionStep {
  dividendColumn: number
  divisor: string
  quotientDigit: string
  partialDividend: string
  product: string
  remainder: string
}

export interface DivisionComputation {
  divisorDigits: string
  dividendDigits: string
  quotientText: string
  quotientTokens: QuotientToken[]
  steps: LongDivisionStep[]
  remainder: string
  hasFraction: boolean
  fractionalDigitCount: number
  decimalFallback: boolean
  integerStartColumn: number
  digitColumnCount: number
}

export interface DivisionOptions {
  resultMode?: DivisionResultMode
  maxDecimalDigits?: number
}

export interface MultiplicationDigitStep {
  multiplicandDigitIndex: number
  multiplicandDigit: string
  multiplierDigit: string
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

export interface MultiplicationPartialProduct {
  multiplierDigitIndex: number
  multiplierDigit: string
  shift: number
  value: string
  digitSteps: MultiplicationDigitStep[]
}

export interface MultiplicationAdditionStep {
  columnFromRight: number
  addendDigits: string[]
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

export interface MultiplicationComputation {
  multiplicandDigits: string
  multiplierDigits: string
  operandsSwapped: boolean
  productDigits: string
  partialProducts: MultiplicationPartialProduct[]
  additionSteps: MultiplicationAdditionStep[]
}

/** 一列加法的输入、进位和输出；列号从个位（0）向左计数。 */
export interface AdditionColumnStep {
  columnFromRight: number
  addendDigits: string[]
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

/** 不含任何布局坐标的非负整数加法过程。 */
export interface AdditionComputation {
  addendDigits: string[]
  sumDigits: string
  steps: AdditionColumnStep[]
}

/** 一列减法的借位过程；`minuendDisplay` 是中间计算时实际参与相减的数。 */
export interface SubtractionColumnStep {
  columnFromRight: number
  minuendDigit: string
  subtrahendDigit: string
  borrowIn: number
  minuendDisplay: string
  resultDigit: string
  borrowOut: number
}

/**
 * 非负整数减法过程。负数结果时，`working*` 是用于求绝对值的“大数减小数”过程，
 * 原始输入仍保留在 `minuendDigits` 与 `subtrahendDigits` 中。
 */
export interface SubtractionComputation {
  minuendDigits: string
  subtrahendDigits: string
  workingMinuendDigits: string
  workingSubtrahendDigits: string
  differenceDigits: string
  resultText: string
  isNegative: boolean
  steps: SubtractionColumnStep[]
}
