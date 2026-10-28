/** Board-scene geometry: resolves variable tracks and turns cell positions into pixel rectangles. */
import type { BoardCell, BoardScene } from './types'

export interface BoardMetrics {
  width: number
  height: number
  columnOffsets: number[]
  rowOffsets: number[]
}

export interface BoardRect {
  left: number
  top: number
  width: number
  height: number
}

/** Resolves variable unit tracks before either renderer touches the DOM. */
export const resolveBoardMetrics = (scene: BoardScene): BoardMetrics => {
  const columnOffsets = [scene.padding.left]
  const rowOffsets = [scene.padding.top]

  scene.columns.forEach((track) => {
    columnOffsets.push(columnOffsets[columnOffsets.length - 1] + track.size * scene.unitWidth)
  })
  scene.rows.forEach((track) => {
    rowOffsets.push(rowOffsets[rowOffsets.length - 1] + track.size * scene.unitHeight)
  })

  return {
    width: columnOffsets[columnOffsets.length - 1] + scene.padding.right,
    height: rowOffsets[rowOffsets.length - 1] + scene.padding.bottom,
    columnOffsets,
    rowOffsets,
  }
}

export const getBoardCellRect = (cell: BoardCell, metrics: BoardMetrics): BoardRect => {
  const { column, row, columnSpan = 1, rowSpan = 1 } = cell.position
  const rightColumn = column + columnSpan
  const bottomRow = row + rowSpan

  if (metrics.columnOffsets[rightColumn] === undefined || metrics.rowOffsets[bottomRow] === undefined) {
    throw new Error(`棋盘单元格 ${cell.id} 超出轨道范围。`)
  }

  return {
    left: metrics.columnOffsets[column],
    top: metrics.rowOffsets[row],
    width: metrics.columnOffsets[rightColumn] - metrics.columnOffsets[column],
    height: metrics.rowOffsets[bottomRow] - metrics.rowOffsets[row],
  }
}
