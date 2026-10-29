import { describe, expect, test } from 'vitest'

import {
  getGridCellRect,
  getGridTextAnchor,
  getDistinctOffsets,
  resolveGridMetrics,
} from '@vertical-arithmetic/grid'
import type { GridCell, GridScene, GridTrack } from '@vertical-arithmetic/grid'

const createScene = (columns: GridTrack[], rows: GridTrack[]): GridScene => ({
  columns,
  rows,
  padding: { top: 10, right: 10, bottom: 10, left: 10 },
  unitWidth: 30,
  unitHeight: 40,
  fontSize: 24,
  textHorizontalAlign: 'center',
  textVerticalAlign: 'center',
  cells: [],
  showGuideGrid: false,
  ariaLabel: '',
})

describe('resolveGridMetrics', () => {
  test('零尺寸轨道不占空间，但保留轨道索引和边界', () => {
    const scene = createScene(
      [{ id: 'a', size: 1 }, { id: 'zero', size: 0 }, { id: 'b', size: 1 }],
      [{ id: 'r0', size: 1 }, { id: 'rz', size: 0 }, { id: 'r1', size: 1 }],
    )
    const metrics = resolveGridMetrics(scene)

    expect(metrics.columnOffsets).toEqual([10, 40, 40, 70])
    expect(metrics.rowOffsets).toEqual([10, 50, 50, 90])
    expect(metrics.width).toBe(80)
    expect(metrics.height).toBe(100)

    const zeroCell: GridCell = { id: 'dot', position: { column: 1, row: 2 } }
    expect(getGridCellRect(zeroCell, metrics)).toEqual({ left: 40, top: 50, width: 0, height: 40 })
  })

  test('负尺寸或非有限尺寸会报错', () => {
    expect(() => resolveGridMetrics(createScene([{ id: 'bad', size: -1 }], [{ id: 'r', size: 1 }]))).toThrow(/列轨道/)
    expect(() => resolveGridMetrics(createScene([{ id: 'r', size: 1 }], [{ id: 'bad', size: Number.NaN }]))).toThrow(/行轨道/)
  })
})

describe('getGridTextAnchor', () => {
  const rect = { left: 100, top: 200, width: 30, height: 40 }

  test('普通单元格用格子边缘和中心作为锚点', () => {
    expect(getGridTextAnchor(rect, 'left', 'top')).toMatchObject({ x: 100, y: 200 })
    expect(getGridTextAnchor(rect, 'center', 'center')).toMatchObject({ x: 115, y: 220 })
    expect(getGridTextAnchor(rect, 'right', 'bottom')).toMatchObject({ x: 130, y: 240 })
  })

  test('零宽列的三种水平对齐都落在同一条列线上', () => {
    const zeroWidth = { ...rect, width: 0 }
    expect(getGridTextAnchor(zeroWidth, 'left', 'center')).toMatchObject({ x: 100, y: 220, horizontalAlign: 'left' })
    expect(getGridTextAnchor(zeroWidth, 'center', 'center')).toMatchObject({ x: 100, y: 220, horizontalAlign: 'center' })
    expect(getGridTextAnchor(zeroWidth, 'right', 'center')).toMatchObject({ x: 100, y: 220, horizontalAlign: 'right' })
  })

  test('零高行的三种垂直对齐都落在同一条行线上', () => {
    const zeroHeight = { ...rect, height: 0 }
    expect(getGridTextAnchor(zeroHeight, 'center', 'top')).toMatchObject({ x: 115, y: 200, verticalAlign: 'top' })
    expect(getGridTextAnchor(zeroHeight, 'center', 'center')).toMatchObject({ x: 115, y: 200, verticalAlign: 'center' })
    expect(getGridTextAnchor(zeroHeight, 'center', 'bottom')).toMatchObject({ x: 115, y: 200, verticalAlign: 'bottom' })
  })
})

describe('getDistinctOffsets', () => {
  test('折叠零尺寸轨道产生的重合辅助线', () => {
    expect(getDistinctOffsets([10, 40, 40, 70])).toEqual([10, 40, 70])
    expect(getDistinctOffsets([0, 0, 0])).toEqual([0])
  })
})
