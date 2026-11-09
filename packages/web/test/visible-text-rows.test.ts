import { describe, expect, test } from 'vitest'

import { extractVisibleTextRows } from '@u1in/shushi-grid'
import type { GridScene } from '@u1in/shushi-grid'
import { computeAddition, computeMultiplication } from '@u1in/shushi-calculators'
import { computeSubtraction } from '@u1in/shushi-calculators'
import {
  createAdditionGridScene,
  createMultiplicationGridScene,
  createSubtractionGridScene,
  getAdditionStepCount,
  getSubtractionStepCount,
} from '@u1in/shushi-layout'
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

/** 提取指定数字行的文本和列坐标，用于验证播放过程没有预占未来补零的列。 */
const getCellTextPositions = (scene: GridScene, row: number): Array<{ text: string; column: number }> =>
  scene.elements.flatMap((element) => {
    if (element.position.kind !== 'cell' || element.position.row !== row || element.content.kind !== 'text') return []
    return [{ text: element.content.text, column: element.position.column }]
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

  test('小数加减法先逐个补零对齐，再开始展示计算结果', () => {
    const addition = computeAddition('1.2', '3.04')
    const additionSettings = {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      showCarrySteps: true,
    }
    expect(getAdditionStepCount(addition)).toBe(addition.steps.length + 2)
    expect(
      [0, 1].map((visibleStepCount) =>
        extractVisibleTextRows(createAdditionGridScene(addition, { ...additionSettings, visibleStepCount })).slice(
          0,
          2,
        ),
      ),
    ).toEqual([
      ['1.2', '+3.04'],
      ['1.20', '+3.04'],
    ])
    expect(
      getCellTextPositions(createAdditionGridScene(addition, { ...additionSettings, visibleStepCount: 0 }), 0),
    ).toEqual([
      { text: '1', column: 2 },
      { text: '2', column: 3 },
    ])
    expect(
      getCellTextPositions(createAdditionGridScene(addition, { ...additionSettings, visibleStepCount: 1 }), 0),
    ).toEqual([
      { text: '1', column: 1 },
      { text: '2', column: 2 },
      { text: '0', column: 3 },
    ])

    const twoZeroAddition = computeAddition('5', '0.03')
    expect(getAdditionStepCount(twoZeroAddition)).toBe(twoZeroAddition.steps.length + 3)
    expect(
      [0, 1, 2].map((visibleStepCount) =>
        extractVisibleTextRows(createAdditionGridScene(twoZeroAddition, { ...additionSettings, visibleStepCount })).at(
          0,
        ),
      ),
    ).toEqual(['5', '5.0', '5.00'])

    const computation = computeSubtraction('0.8', '0.29')
    const settings = {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      showBorrowSteps: true,
    }

    expect(computation).toMatchObject({
      workingMinuendText: '0.80',
      workingSubtrahendText: '0.29',
      decimalPlaces: 2,
      differenceDigits: '51',
      resultText: '0.51',
    })
    expect(getSubtractionStepCount(computation)).toBe(5)
    expect(
      [0, 1].map((visibleStepCount) =>
        extractVisibleTextRows(createSubtractionGridScene(computation, { ...settings, visibleStepCount })).slice(0, 2),
      ),
    ).toEqual([
      ['0.8', '−0.29'],
      ['0.80', '−0.29'],
    ])
    expect(
      getCellTextPositions(createSubtractionGridScene(computation, { ...settings, visibleStepCount: 0 }), 0),
    ).toEqual([
      { text: '0', column: 2 },
      { text: '8', column: 3 },
    ])
    expect(
      getCellTextPositions(createSubtractionGridScene(computation, { ...settings, visibleStepCount: 1 }), 0),
    ).toEqual([
      { text: '0', column: 1 },
      { text: '8', column: 2 },
      { text: '0', column: 3 },
    ])

    const resultRows = [2, 3, 4, 5].map((visibleStepCount) =>
      extractVisibleTextRows(createSubtractionGridScene(computation, { ...settings, visibleStepCount })).at(-1),
    )
    expect(resultRows).toEqual(['1', '51', '.51', '0.51'])
  })

  test('每个播放快照只按当前输入和已完成步骤确定网格，不预留未来结果位', () => {
    const settings = {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      showCarrySteps: true,
    }
    const additionFrame = createAdditionGridScene(computeAddition('999', '1'), { ...settings, visibleStepCount: 0 })
    const multiplicationFrame = createMultiplicationGridScene(computeMultiplication('99', '99'), {
      ...settings,
      uniformMultiplicationBars: false,
      visibleStepCount: 0,
    })

    // 1000 和 9801 都尚未出现：首帧只保留操作符列与当前两个操作数的最大宽度。
    expect(additionFrame.columns).toHaveLength(4)
    expect(multiplicationFrame.columns).toHaveLength(3)
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
