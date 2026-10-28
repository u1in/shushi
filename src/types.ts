export type DivisionResultMode = 'decimal' | 'remainder'

/** A quotient digit and the dividend column that produced it. */
export interface QuotientDigit {
  column: number
  digit: string
}

/**
 * One visible subtraction in the long-division process. All numeric values are
 * normalized decimal strings so the calculation never depends on Number size.
 */
export interface LongDivisionStep {
  dividendColumn: number
  divisor: string
  quotientDigit: string
  partialDividend: string
  product: string
  remainder: string
}

/** The calculation-layer output consumed by the vertical-division layout layer. */
export interface DivisionComputation {
  divisorDigits: string
  dividendDigits: string
  quotientText: string
  /** Column boundary where the decimal point is rendered; null when absent. */
  decimalPointColumn: number | null
  quotientDigits: QuotientDigit[]
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

export interface RenderSettings {
  cellWidth: number
  rowHeight: number
  fontSizeRatio: number
  bracketBend: number
  showGuideGrid: boolean
  uniformSubtractionBars: boolean
  showZeroQuotientSteps: boolean
}

export type DigitRole =
  | 'divisor'
  | 'dividend'
  | 'appendedZero'
  | 'quotient'
  | 'partialDividend'
  | 'product'
  | 'remainder'

export interface PlacedDigit {
  role: DigitRole
  digit: string
  column: number
  row: number
}

export interface DecimalPoint {
  kind: 'decimalPoint'
  boundaryColumn: number
  row: number
  /** Absolute horizontal position of the boundary between dividend cells. */
  x: number
}

export interface DivisionBracketArc {
  kind: 'divisionBracketArc'
  left: number
  top: number
  width: number
  height: number
  cornerRadius: number
}

export type StraightLineKind =
  | 'divisionBracketTopLine'
  | 'subtractionBar'
  | 'guideGridHorizontal'
  | 'guideGridVertical'

export interface StraightLine {
  kind: StraightLineKind
  x1: number
  y1: number
  x2: number
  y2: number
}

/** A renderer-neutral, fully positioned description of one vertical division. */
export interface VerticalDivisionRenderModel {
  width: number
  height: number
  rowCount: number
  cellWidth: number
  rowHeight: number
  digitSize: number
  divisorLeft: number
  dividendLeft: number
  bracketArc: DivisionBracketArc
  lines: StraightLine[]
  digits: PlacedDigit[]
  decimalPoint?: DecimalPoint
  ariaLabel: string
}
