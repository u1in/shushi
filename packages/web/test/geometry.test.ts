import { describe, expect, test } from 'vitest'

import {
  GRID_TEXT_NINE_REGION_SIDE_RATIO,
  getGridPositionRect,
  getGridTextAnchor,
  resolveGridMetrics,
} from '@u1in/shushi-grid'
import type { GridScene, GridTrack } from '@u1in/shushi-grid'

const createScene = (columns: GridTrack[], rows: GridTrack[]): GridScene => ({
  columns,
  rows,
  padding: { top: 10, right: 10, bottom: 10, left: 10 },
  unitWidth: 30,
  unitHeight: 40,
  fontSize: 24,
  textHorizontalAlign: 'center',
  textVerticalAlign: 'center',
  elements: [],
  showGuideGrid: false,
  ariaLabel: '',
})

describe('resolveGridMetrics', () => {
  test('正尺寸轨道只定义可见网格结构', () => {
    const metrics = resolveGridMetrics(
      createScene(
        [
          { id: 'a', size: 1 },
          { id: 'b', size: 1 },
        ],
        [
          { id: 'r0', size: 1 },
          { id: 'r1', size: 1 },
        ],
      ),
    )

    expect(metrics.columnOffsets).toEqual([10, 40, 70])
    expect(metrics.rowOffsets).toEqual([10, 50, 90])
    expect(metrics.width).toBe(80)
    expect(metrics.height).toBe(100)
  })

  test('零、负或非有限尺寸会报错', () => {
    expect(() => resolveGridMetrics(createScene([{ id: 'bad', size: 0 }], [{ id: 'r', size: 1 }]))).toThrow(/列轨道/)
    expect(() => resolveGridMetrics(createScene([{ id: 'bad', size: -1 }], [{ id: 'r', size: 1 }]))).toThrow(/列轨道/)
    expect(() => resolveGridMetrics(createScene([{ id: 'r', size: 1 }], [{ id: 'bad', size: Number.NaN }]))).toThrow(
      /行轨道/,
    )
  })
})

describe('getGridPositionRect', () => {
  const metrics = resolveGridMetrics(
    createScene(
      [
        { id: 'a', size: 1 },
        { id: 'b', size: 1 },
      ],
      [
        { id: 'r0', size: 1 },
        { id: 'r1', size: 1 },
      ],
    ),
  )

  test('单元区域、交点、边和边中点都是显式位置', () => {
    expect(getGridPositionRect({ kind: 'cell', column: 0, row: 0 }, metrics)).toEqual({
      left: 10,
      top: 10,
      width: 30,
      height: 40,
    })
    expect(getGridPositionRect({ kind: 'intersection', columnLine: 1, rowLine: 1 }, metrics)).toEqual({
      left: 40,
      top: 50,
      width: 0,
      height: 0,
    })
    expect(getGridPositionRect({ kind: 'edge', column: 0, row: 0, edge: 'bottom', columnSpan: 2 }, metrics)).toEqual({
      left: 10,
      top: 50,
      width: 60,
      height: 0,
    })
    expect(getGridPositionRect({ kind: 'edgeMidpoint', column: 0, row: 0, edge: 'right' }, metrics)).toEqual({
      left: 40,
      top: 30,
      width: 0,
      height: 0,
    })
  })
})

describe('getGridTextAnchor', () => {
  test('单元格分为九区，边和交点保留零面积锚点', () => {
    const rect = { left: 100, top: 200, width: 30, height: 40 }
    expect(getGridTextAnchor(rect, 'left', 'top')).toMatchObject({
      x: 100 + (30 * GRID_TEXT_NINE_REGION_SIDE_RATIO.horizontal) / 2,
      y: 200 + (40 * GRID_TEXT_NINE_REGION_SIDE_RATIO.vertical) / 2,
      horizontalAlign: 'center',
      verticalAlign: 'center',
    })
    expect(getGridTextAnchor(rect, 'center', 'center')).toMatchObject({ x: 115, y: 220 })
    expect(getGridTextAnchor({ left: 100, top: 200, width: 0, height: 0 }, 'center', 'bottom')).toMatchObject({
      x: 100,
      y: 200,
    })
    expect(getGridTextAnchor(rect, 'right', 'bottom')).toMatchObject({
      x: 130 - (30 * GRID_TEXT_NINE_REGION_SIDE_RATIO.horizontal) / 2,
      y: 240 - (40 * GRID_TEXT_NINE_REGION_SIDE_RATIO.vertical) / 2,
      horizontalAlign: 'center',
      verticalAlign: 'center',
    })
  })
})
