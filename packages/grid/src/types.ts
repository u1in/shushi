/** Renderer-neutral grid contracts shared by the layout engine and renderers. */
export type GridTextHorizontalAlign = 'left' | 'center' | 'right'
export type GridTextVerticalAlign = 'top' | 'center' | 'bottom'
export type GridEdge = 'top' | 'right' | 'bottom' | 'left'

/**
 * A variable-sized row or column expressed in normal-cell units.
 *
 * Tracks only describe visible grid structure. Anchors on a cell boundary are
 * represented by `GridPosition`, never by an empty zero-size track.
 */
export interface GridTrack {
  id: string
  size: number
}

/** A rectangular region made from one or more complete grid cells. */
export interface GridCellPosition {
  kind: 'cell'
  column: number
  row: number
  columnSpan?: number
  rowSpan?: number
}

/** A point where one column boundary and one row boundary meet. */
export interface GridIntersectionPosition {
  kind: 'intersection'
  columnLine: number
  rowLine: number
}

/** A complete side of a cell region, optionally spanning multiple cells. */
export interface GridEdgePosition {
  kind: 'edge'
  column: number
  row: number
  edge: GridEdge
  columnSpan?: number
  rowSpan?: number
}

/** The centre point of a complete side of a cell region. */
export interface GridEdgeMidpointPosition {
  kind: 'edgeMidpoint'
  column: number
  row: number
  edge: GridEdge
  columnSpan?: number
  rowSpan?: number
}

/** Every pre-defined position supplied by a resolved row-and-column grid. */
export type GridPosition = GridCellPosition | GridIntersectionPosition | GridEdgePosition | GridEdgeMidpointPosition

/**
 * An anchored, non-wrapping text box. The box keeps its natural size and is
 * never clipped to its anchor position, so labels can deliberately straddle a
 * cell edge or an intersection.
 */
export interface GridTextContent {
  kind: 'text'
  text: string
  /** Optional override. Omitted text inherits the renderer's default text style. */
  styleToken?: string
  /** Optional multiplier of the scene font size for compact annotations such as carries. */
  fontSizeRatio?: number
  /**
   * Optional per-element override. Omitted values inherit the grid configuration.
   * At an edge or intersection, `center` straddles the anchor while the other
   * values choose the side to which the natural-size text box extends.
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

/** A straight rule rendered along a `GridEdgePosition`. */
export interface GridLineContent {
  kind: 'line'
}

export type GridElementContent = GridTextContent | GridCornerContent | GridLineContent

/** The single drawable primitive, placed at a cell, edge, edge midpoint or intersection. */
export interface GridElement {
  id: string
  position: GridPosition
  content: GridElementContent
  /** Optional element style. Omitted values inherit renderer defaults. */
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
  elements: GridElement[]
  showGuideGrid: boolean
  ariaLabel: string
}
