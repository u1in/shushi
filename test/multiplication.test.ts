import { describe, expect, test } from 'vitest'

import { computeMultiplication } from '../src/calculators/multiplication'
import { createMultiplicationBoardScene } from '../src/layouts/multiplication-layout'
import { resolveBoardMetrics } from '../src/scene/geometry'

describe('computeMultiplication', () => {
  test('计算规则文档中的 145 × 12，并记录逐位进位、部分积和按列求和', () => {
    const result = computeMultiplication('145', '12')

    expect(result.productDigits).toBe('1740')
    expect(result.partialProducts.map(({ multiplierDigit, shift, value }) => ({ multiplierDigit, shift, value }))).toEqual([
      { multiplierDigit: '2', shift: 0, value: '290' },
      { multiplierDigit: '1', shift: 1, value: '145' },
    ])
    expect(result.partialProducts[0].digitSteps).toEqual([
      { multiplicandDigitIndex: 0, multiplicandDigit: '1', multiplierDigit: '2', carryIn: 0, total: 2, resultDigit: '2', carryOut: 0 },
      { multiplicandDigitIndex: 1, multiplicandDigit: '4', multiplierDigit: '2', carryIn: 1, total: 9, resultDigit: '9', carryOut: 0 },
      { multiplicandDigitIndex: 2, multiplicandDigit: '5', multiplierDigit: '2', carryIn: 0, total: 10, resultDigit: '0', carryOut: 1 },
    ])
    expect(result.additionSteps.map(({ columnFromRight, total, resultDigit, carryOut }) => ({ columnFromRight, total, resultDigit, carryOut }))).toEqual([
      { columnFromRight: 0, total: 0, resultDigit: '0', carryOut: 0 },
      { columnFromRight: 1, total: 14, resultDigit: '4', carryOut: 1 },
      { columnFromRight: 2, total: 7, resultDigit: '7', carryOut: 0 },
      { columnFromRight: 3, total: 1, resultDigit: '1', carryOut: 0 },
    ])
  })

  test('中间零乘数保留零部分积及其错位，零和前导零输入会规范化', () => {
    const middleZero = computeMultiplication('123', '101')
    expect(middleZero.productDigits).toBe('12423')
    expect(middleZero.partialProducts.map(({ multiplierDigit, shift, value }) => ({ multiplierDigit, shift, value }))).toEqual([
      { multiplierDigit: '1', shift: 0, value: '123' },
      { multiplierDigit: '0', shift: 1, value: '0' },
      { multiplierDigit: '1', shift: 2, value: '123' },
    ])

    const normalizedZero = computeMultiplication('0000', '0012')
    expect(normalizedZero).toMatchObject({ multiplicandDigits: '0', multiplierDigits: '12', productDigits: '0' })

    const trailingZero = computeMultiplication('12', '120')
    expect(trailingZero.productDigits).toBe('1440')
    expect(trailingZero.partialProducts.map(({ shift, value }) => ({ shift, value }))).toEqual([
      { shift: 0, value: '0' },
      { shift: 1, value: '24' },
      { shift: 2, value: '12' },
    ])
  })

  test('超长数字串不依赖 JavaScript 安全整数范围', () => {
    const value = `9${'0'.repeat(120)}7`
    const result = computeMultiplication(value, '1')

    expect(result.productDigits).toBe(value)
  })

  test('非法输入会报错', () => {
    ;['', '1.5', '-1', 'abc', ' 12 ', '12 '].forEach((value) => {
      expect(() => computeMultiplication(value, '2')).toThrow(/被乘数请输入非负整数/)
      expect(() => computeMultiplication('2', value)).toThrow(/乘数请输入非负整数/)
    })
  })
})

describe('createMultiplicationBoardScene', () => {
  test('布局层仅消费计算过程，并用通用棋盘表达错位部分积、进位与横线', () => {
    const computation = computeMultiplication('145', '12')
    const scene = createMultiplicationBoardScene(computation, {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 0.82,
      showGuideGrid: true,
      textHorizontalAlign: 'right',
      textVerticalAlign: 'top',
      uniformMultiplicationBars: false,
      showCarrySteps: true,
    })

    expect(scene.columns[0]).toMatchObject({ id: 'multiplication-operator', size: 0.72 })
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.operator' && content.text === '×')).toBe(true)
    expect(scene.cells.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.partial-product')).toHaveLength(6)
    const carryCell = scene.cells.find(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.carry' && content.text === '1'
    ))
    expect(carryCell?.content).toMatchObject({ fontSizeRatio: 0.42, verticalAlign: 'bottom' })
    expect(carryCell).toMatchObject({ position: { row: 2 } })
    expect(scene.rows[2]).toMatchObject({ id: 'carry-row-0', size: 0.36 })
    expect(scene.cells.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { row: 2 } })
    expect(scene.cells.find(({ id }) => id === 'multiplier-0')?.content).not.toHaveProperty('verticalAlign')
    expect(scene.rows[5]).toMatchObject({ id: 'addition-carry-row', size: 0.36 })
    expect(scene.cells.find(({ id }) => id === 'addition-carry-1')).toMatchObject({
      position: { column: 2, row: 5 },
      content: { text: '1', styleToken: 'multiplication.addition-carry', fontSizeRatio: 0.42, verticalAlign: 'bottom' },
    })
    expect(scene.cells.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { row: 5 } })
    expect(scene.cells.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { column: 0, columnSpan: 5 } })
    expect(scene.cells.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { column: 1, columnSpan: 4 } })
    expect(scene.cells.some(({ styleToken }) => styleToken === 'multiplication.input-bar')).toBe(true)
    expect(scene.cells.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(true)
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product' && content.text === '1')).toBe(true)
    expect(scene.showGuideGrid).toBe(true)
    expect(scene.textHorizontalAlign).toBe('right')
    expect(scene.textVerticalAlign).toBe('top')
    expect(resolveBoardMetrics(scene).width).toBeGreaterThan(0)
  })

  test('一位乘数只显示一次最终积，零乘法仍显示结果 0', () => {
    const singleDigit = createMultiplicationBoardScene(computeMultiplication('145', '2'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    expect(singleDigit.cells.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(false)
    expect(singleDigit.cells.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product')).toHaveLength(3)

    const zero = createMultiplicationBoardScene(computeMultiplication('145', '0'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    expect(zero.cells.find(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product')?.content).toMatchObject({ text: '0' })
  })

  test('可隐藏乘法与加法进位，并让两条横线使用相同的范围', () => {
    const scene = createMultiplicationBoardScene(computeMultiplication('145', '12'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: true, showCarrySteps: false,
    })

    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.carry')).toBe(false)
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.addition-carry')).toBe(false)
    expect(scene.rows.some(({ id }) => id.startsWith('carry-row') || id === 'addition-carry-row')).toBe(false)
    expect(scene.cells.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { column: 0, columnSpan: 5 } })
    expect(scene.cells.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { column: 0, columnSpan: 5 } })
  })
})
