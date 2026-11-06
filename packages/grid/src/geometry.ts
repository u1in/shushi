/** Grid geometry: resolves variable tracks and turns cell positions into pixel rectangles. */
import type {
  GridCellPosition,
  GridElement,
  GridScene,
  GridPosition,
  GridTextHorizontalAlign,
  GridTextVerticalAlign,
  GridTrack,
} from './types'

export interface GridMetrics {
  width: number
  height: number
  columnOffsets: number[]
  rowOffsets: number[]
}

export interface GridRect {
  left: number
  top: number
  width: number
  height: number
}

/** Where a text box attaches to a cell rect and which edge faces the anchor. */
export interface GridTextAnchor {
  x: number
  y: number
  horizontalAlign: GridTextHorizontalAlign
  verticalAlign: GridTextVerticalAlign
}

const assertValidTrackSize = (track: GridTrack, axis: '列' | '行'): void => {
  if (!Number.isFinite(track.size) || track.size <= 0) {
    throw new Error(`网格${axis}轨道 ${track.id} 的尺寸必须是正有限数，当前为 ${track.size}。`)
  }
}

/** Resolves variable unit tracks before either renderer touches the DOM. */
export const resolveGridMetrics = (scene: GridScene): GridMetrics => {
  const columnOffsets = [scene.padding.left]
  const rowOffsets = [scene.padding.top]

  scene.columns.forEach((track) => {
    assertValidTrackSize(track, '列')
    columnOffsets.push(columnOffsets[columnOffsets.length - 1] + track.size * scene.unitWidth)
  })
  scene.rows.forEach((track) => {
    assertValidTrackSize(track, '行')
    rowOffsets.push(rowOffsets[rowOffsets.length - 1] + track.size * scene.unitHeight)
  })

  return {
    width: columnOffsets[columnOffsets.length - 1] + scene.padding.right,
    height: rowOffsets[rowOffsets.length - 1] + scene.padding.bottom,
    columnOffsets,
    rowOffsets,
  }
}

const getCellRect = (position: Omit<GridCellPosition, 'kind'>, metrics: GridMetrics): GridRect => {
  const { column, row, columnSpan = 1, rowSpan = 1 } = position
  const rightColumn = column + columnSpan
  const bottomRow = row + rowSpan

  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    !Number.isInteger(columnSpan) ||
    !Number.isInteger(rowSpan) ||
    column < 0 ||
    row < 0 ||
    columnSpan <= 0 ||
    rowSpan <= 0 ||
    metrics.columnOffsets[column] === undefined ||
    metrics.rowOffsets[row] === undefined ||
    metrics.columnOffsets[rightColumn] === undefined ||
    metrics.rowOffsets[bottomRow] === undefined
  ) {
    throw new Error('网格单元区域超出轨道范围。')
  }

  return {
    left: metrics.columnOffsets[column],
    top: metrics.rowOffsets[row],
    width: metrics.columnOffsets[rightColumn] - metrics.columnOffsets[column],
    height: metrics.rowOffsets[bottomRow] - metrics.rowOffsets[row],
  }
}

const getIntersectionRect = (columnLine: number, rowLine: number, metrics: GridMetrics): GridRect => {
  if (
    !Number.isInteger(columnLine) ||
    !Number.isInteger(rowLine) ||
    metrics.columnOffsets[columnLine] === undefined ||
    metrics.rowOffsets[rowLine] === undefined
  ) {
    throw new Error('网格交点超出轨道范围。')
  }
  return { left: metrics.columnOffsets[columnLine], top: metrics.rowOffsets[rowLine], width: 0, height: 0 }
}

/** Resolves every first-class grid position without inventing hidden tracks. */
export const getGridPositionRect = (position: GridPosition, metrics: GridMetrics): GridRect => {
  if (position.kind === 'cell') return getCellRect(position, metrics)
  if (position.kind === 'intersection') return getIntersectionRect(position.columnLine, position.rowLine, metrics)

  const cellRect = getCellRect(position, metrics)
  const isHorizontal = position.edge === 'top' || position.edge === 'bottom'
  const edgeRect = isHorizontal
    ? {
        left: cellRect.left,
        top: position.edge === 'top' ? cellRect.top : cellRect.top + cellRect.height,
        width: cellRect.width,
        height: 0,
      }
    : {
        left: position.edge === 'left' ? cellRect.left : cellRect.left + cellRect.width,
        top: cellRect.top,
        width: 0,
        height: cellRect.height,
      }

  if (position.kind === 'edge') return edgeRect
  return {
    left: edgeRect.left + edgeRect.width / 2,
    top: edgeRect.top + edgeRect.height / 2,
    width: 0,
    height: 0,
  }
}

/** Resolves the rectangle associated with a drawable element's declared position. */
export const getGridElementRect = (element: GridElement, metrics: GridMetrics): GridRect =>
  getGridPositionRect(element.position, metrics)

/**
 * Converts an area, edge, midpoint or intersection rect and its resolved
 * alignment into an anchor point plus the edge that must touch it. Both
 * renderers share this calculation so all first-class positions agree.
 */
export const getGridTextAnchor = (
  rect: GridRect,
  horizontalAlign: GridTextHorizontalAlign,
  verticalAlign: GridTextVerticalAlign,
): GridTextAnchor => ({
  x:
    horizontalAlign === 'left'
      ? rect.left
      : horizontalAlign === 'right'
        ? rect.left + rect.width
        : rect.left + rect.width / 2,
  y:
    verticalAlign === 'top'
      ? rect.top
      : verticalAlign === 'bottom'
        ? rect.top + rect.height
        : rect.top + rect.height / 2,
  horizontalAlign,
  verticalAlign,
})
