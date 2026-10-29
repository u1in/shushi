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
