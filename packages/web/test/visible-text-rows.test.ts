import { describe, expect, test } from 'vitest'

import { extractVisibleTextRows } from '@u1in/shushi-grid'
import type { GridScene } from '@u1in/shushi-grid'
import { computeAddition } from '@u1in/shushi-calculators'
import { computeSubtraction } from '@u1in/shushi-calculators'
import { createAdditionGridScene, createSubtractionGridScene } from '@u1in/shushi-layout'
import { compileMacro } from '@u1in/shushi-macro'

const createScene = (elements: GridScene['elements']): GridScene => ({
  columns: [
    { id: 'left', size: 1 },
    { id: 'right', size: 1 },
  ],
  rows: [
    { id: 'top', size: 1 },
    { id: 'bottom', size: 1 },
  ],
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  unitWidth: 30,
  unitHeight: 40,
  fontSize: 24,
  textHorizontalAlign: 'center',
  textVerticalAlign: 'center',
  elements,
  showGuideGrid: false,
  ariaLabel: '测试网格',
})

describe('extractVisibleTextRows', () => {
  test('从左到右输出可见文本，忽略空白行与非文本图元', () => {
    const scene = createScene([
      { id: 'right', position: { kind: 'cell', column: 1, row: 0 }, content: { kind: 'text', text: '2' } },
      {
        id: 'line',
        position: { kind: 'edge', column: 0, row: 1, edge: 'top', columnSpan: 2 },
        content: { kind: 'line' },
      },
      { id: 'left', position: { kind: 'cell', column: 0, row: 0 }, content: { kind: 'text', text: '1' } },
      { id: 'bottom', position: { kind: 'cell', column: 1, row: 1 }, content: { kind: 'text', text: '3' } },
    ])

    expect(extractVisibleTextRows(scene)).toEqual(['12', '3'])
  })

  test('交点与横向边界文本单列为注记行，竖向边中点仍与数字行合并', () => {
    const scene = createScene([
      { id: 'top-digit', position: { kind: 'cell', column: 0, row: 0 }, content: { kind: 'text', text: '8' } },
      {
        id: 'decimal',
        position: { kind: 'edgeMidpoint', column: 0, row: 0, edge: 'right' },
        content: { kind: 'text', text: '.' },
      },
      { id: 'top-right', position: { kind: 'cell', column: 1, row: 0 }, content: { kind: 'text', text: '5' } },
      {
        id: 'carry',
        position: { kind: 'intersection', columnLine: 1, rowLine: 1 },
        content: { kind: 'text', text: '1' },
      },
      { id: 'bottom', position: { kind: 'cell', column: 1, row: 1 }, content: { kind: 'text', text: '3' } },
    ])

    expect(extractVisibleTextRows(scene)).toEqual(['8.5', '1', '3'])
  })

  test('加法进位作为独立一行，供手写 OCR 结果直接逐行比对', () => {
    const scene = createAdditionGridScene(computeAddition('356', '278'), {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      showCarrySteps: true,
    })

    expect(extractVisibleTextRows(scene)).toEqual(['356', '+278', '11', '634'])
  })

  test('减法借位提示同样不会混入被减数行', () => {
    const scene = createSubtractionGridScene(computeSubtraction('502', '137'), {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      showBorrowSteps: true,
    })

    expect(extractVisibleTextRows(scene)).toEqual(['··', '502', '−137', '365'])
  })

  test('宏的 RB 进位根据局部底部对齐单列为一行', () => {
    const scene = compileMacro(`
      GRID(
        ROW(MM(3), MM(5), MM(6)),
        ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),
        LINE,
        ROW(MM(6), MM(3), MM(4))
      )
    `)

    expect(extractVisibleTextRows(scene)).toEqual(['356', '+278', '11', '634'])
  })
})
