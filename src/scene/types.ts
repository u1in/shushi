/** Renderer-neutral contracts shared by calculators, layouts, and board renderers. */
export type DivisionResultMode = 'decimal' | 'remainder'

/** A quotient symbol tied to the calculation column that produced it. */
export type QuotientToken =
  | { kind: 'digit', digit: string, column: number }
  | { kind: 'decimalSeparator', digit: '.', column: number }

/** One subtraction in the long-division process, using only decimal strings. */
export interface LongDivisionStep {
  dividendColumn: number
  divisor: string
  quotientDigit: string
  partialDividend: string
  product: string
  remainder: string
}

/** The calculation-layer output consumed by operation-specific layout layers. */
export interface DivisionComputation {
  divisorDigits: string
  dividendDigits: string
  quotientText: string
  /** Semantic quotient content with no board or pixel coordinates. */
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

/** One digit-level multiplication operation, before any board coordinates are assigned. */
export interface MultiplicationDigitStep {
  /** Zero-based index in the multiplicand, counted from the left. */
  multiplicandDigitIndex: number
  multiplicandDigit: string
  multiplierDigit: string
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

/** One unshifted partial product; `shift` states its decimal-place offset. */
export interface MultiplicationPartialProduct {
  multiplierDigitIndex: number
  multiplierDigit: string
  /** Decimal places to shift left, where the multiplier's ones digit is 0. */
  shift: number
  value: string
  digitSteps: MultiplicationDigitStep[]
}

/** A right-to-left column addition used to obtain the final product. */
export interface MultiplicationAdditionStep {
  /** Zero-based decimal position counted from the right. */
  columnFromRight: number
  addendDigits: string[]
  carryIn: number
  total: number
  resultDigit: string
  carryOut: number
}

/** Renderer-independent result of a non-negative-integer long multiplication. */
export interface MultiplicationComputation {
  multiplicandDigits: string
  multiplierDigits: string
  productDigits: string
  partialProducts: MultiplicationPartialProduct[]
  additionSteps: MultiplicationAdditionStep[]
}

/** Board configuration shared by every operation-specific layout adapter. */
export interface BoardRenderSettings {
  cellWidth: number
  rowHeight: number
  fontSizeRatio: number
  showGuideGrid: boolean
  textHorizontalAlign?: BoardTextHorizontalAlign
  textVerticalAlign?: BoardTextVerticalAlign
}

/** Division-only additions to the shared board configuration. */
export interface RenderSettings extends BoardRenderSettings {
  bracketBend: number
  uniformSubtractionBars: boolean
  showZeroQuotientSteps: boolean
}

/** Multiplication-only additions to the shared board configuration. */
export interface MultiplicationRenderSettings extends BoardRenderSettings {
  /** Makes the input and partial-product-sum horizontal bars share one width. */
  uniformMultiplicationBars: boolean
  /** Controls both digit-multiplication and partial-product-addition carry annotations. */
  showCarrySteps: boolean
}

export type BoardTextHorizontalAlign = 'left' | 'center' | 'right'
export type BoardTextVerticalAlign = 'top' | 'center' | 'bottom'

/** A variable-sized row or column expressed in normal-cell units. */
export interface BoardTrack {
  id: string
  size: number
}

export interface BoardCellPosition {
  column: number
  row: number
  columnSpan?: number
  rowSpan?: number
}

export interface BoardTextContent {
  kind: 'text'
  text: string
  /** Optional override. Omitted text inherits the renderer's default text style. */
  styleToken?: string
  /** Optional multiplier of the scene font size for compact annotations such as carries. */
  fontSizeRatio?: number
  /** Optional per-cell override. Omitted values inherit the board configuration. */
  horizontalAlign?: BoardTextHorizontalAlign
  verticalAlign?: BoardTextVerticalAlign
}

export interface BoardCornerContent {
  kind: 'corner'
  corner: 'bottomRight'
  /** Multiplier of the smaller resolved cell dimension. */
  radiusRatio: number
}

export type BoardCellContent = BoardTextContent | BoardCornerContent

export interface BoardCellEdges {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
}

/** The single drawable primitive: text, a corner, or an empty bordered cell. */
export interface BoardCell {
  id: string
  position: BoardCellPosition
  content?: BoardCellContent
  edges?: BoardCellEdges
  /** Optional cell/edge style. Omitted values inherit renderer defaults. */
  styleToken?: string
}

/** A fully operation-agnostic, variable-track scene consumed by board renderers. */
export interface BoardScene {
  columns: BoardTrack[]
  rows: BoardTrack[]
  padding: { top: number, right: number, bottom: number, left: number }
  unitWidth: number
  unitHeight: number
  fontSize: number
  /** Render configuration inherited by text cells without a local style token. */
  defaultTextStyleToken?: string
  textHorizontalAlign: BoardTextHorizontalAlign
  textVerticalAlign: BoardTextVerticalAlign
  cells: BoardCell[]
  showGuideGrid: boolean
  ariaLabel: string
}
