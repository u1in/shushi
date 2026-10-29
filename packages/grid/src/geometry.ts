/** Grid geometry: resolves variable tracks and turns cell positions into pixel rectangles. */
import type {
  GridCell,
  GridScene,
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
  if (!Number.isFinite(track.size) || track.size < 0) {
    throw new Error(`网格${axis}轨道 ${track.id} 的尺寸必须是非负有限数，当前为 ${track.size}。`)
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

export const getGridCellRect = (cell: GridCell, metrics: GridMetrics): GridRect => {
  const { column, row, columnSpan = 1, rowSpan = 1 } = cell.position
  const rightColumn = column + columnSpan
  const bottomRow = row + rowSpan

  if (metrics.columnOffsets[rightColumn] === undefined || metrics.rowOffsets[bottomRow] === undefined) {
    throw new Error(`网格单元格 ${cell.id} 超出轨道范围。`)
  }

  return {
    left: metrics.columnOffsets[column],
    top: metrics.rowOffsets[row],
    width: metrics.columnOffsets[rightColumn] - metrics.columnOffsets[column],
    height: metrics.rowOffsets[bottomRow] - metrics.rowOffsets[row],
  }
}

/**
 * Converts a cell rect and its resolved alignment into an anchor point plus the
 * edge that must touch it. A zero-width or zero-height rect has a single
 * possible point, so the alignment degenerates into the extension direction.
 * Both renderers implement this same anchor, which keeps zero-size tracks
 * predictable and identical across SVG and DOM/CSS.
 */
export const getGridTextAnchor = (
  rect: GridRect,
  horizontalAlign: GridTextHorizontalAlign,
  verticalAlign: GridTextVerticalAlign,
): GridTextAnchor => ({
  x: horizontalAlign === 'left'
    ? rect.left
    : horizontalAlign === 'right' ? rect.left + rect.width : rect.left + rect.width / 2,
  y: verticalAlign === 'top'
    ? rect.top
    : verticalAlign === 'bottom' ? rect.top + rect.height : rect.top + rect.height / 2,
  horizontalAlign,
  verticalAlign,
})

/** Collapses offsets that coincide because of zero-size tracks, for guide grids. */
export const getDistinctOffsets = (offsets: number[]): number[] => offsets.filter(
  (offset, index) => index === 0 || Math.abs(offset - offsets[index - 1]) > 1e-6,
)
