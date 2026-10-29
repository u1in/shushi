/** Renderer-neutral grid contracts shared by the layout engine and renderers. */
export type GridTextHorizontalAlign = 'left' | 'center' | 'right'
export type GridTextVerticalAlign = 'top' | 'center' | 'bottom'

/**
 * A variable-sized row or column expressed in normal-cell units.
 *
 * `size === 0` creates a zero-size anchor track: it consumes no grid space,
 * keeps its index in `columns` / `rows`, and lets text placed on it extend into
 * neighbouring tracks by using its alignment as the extension direction.
 */
export interface GridTrack {
  id: string
  size: number
}

export interface GridCellPosition {
  column: number
  row: number
  columnSpan?: number
  rowSpan?: number
}

/**
 * An anchored, non-wrapping text box. The box keeps its natural size and is
 * never clipped to the cell rect, so text on a zero-size track can deliberately
 * overlap the surrounding rows and columns.
 */
export interface GridTextContent {
  kind: 'text'
  text: string
  /** Optional override. Omitted text inherits the renderer's default text style. */
  styleToken?: string
  /** Optional multiplier of the scene font size for compact annotations such as carries. */
  fontSizeRatio?: number
  /**
   * Optional per-cell override. Omitted values inherit the grid configuration.
   * On a zero-width or zero-height track the value chooses the extension side:
   * `left` / `top` extend right / down, `center` straddles the track line, and
   * `right` / `bottom` extend left / up.
   */
  horizontalAlign?: GridTextHorizontalAlign
  verticalAlign?: GridTextVerticalAlign
}

export interface GridCornerContent {
  kind: 'corner'
  corner: 'bottomRight'
  /** Multiplier of the smaller resolved cell dimension. */
  radiusRatio: number
}

export type GridCellContent = GridTextContent | GridCornerContent

export interface GridCellEdges {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
}

/** The single drawable primitive: text, a corner, or an empty bordered cell. */
export interface GridCell {
  id: string
  position: GridCellPosition
  content?: GridCellContent
  edges?: GridCellEdges
  /** Optional cell/edge style. Omitted values inherit renderer defaults. */
  styleToken?: string
}

/** A fully operation-agnostic, variable-track scene consumed by grid renderers. */
export interface GridScene {
  columns: GridTrack[]
  rows: GridTrack[]
  padding: { top: number, right: number, bottom: number, left: number }
  unitWidth: number
  unitHeight: number
  fontSize: number
  /** Render configuration inherited by text cells without a local style token. */
  defaultTextStyleToken?: string
  textHorizontalAlign: GridTextHorizontalAlign
  textVerticalAlign: GridTextVerticalAlign
  cells: GridCell[]
  showGuideGrid: boolean
  ariaLabel: string
}
