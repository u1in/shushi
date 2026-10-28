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

export interface RenderSettings {
  cellWidth: number
  rowHeight: number
  fontSizeRatio: number
  bracketBend: number
  showGuideGrid: boolean
  textHorizontalAlign?: BoardTextHorizontalAlign
  textVerticalAlign?: BoardTextVerticalAlign
  uniformSubtractionBars: boolean
  showZeroQuotientSteps: boolean
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
