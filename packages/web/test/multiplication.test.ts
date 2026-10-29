import { describe, expect, test } from 'vitest'

import { computeMultiplication } from '@vertical-arithmetic/calculators'
import { createMultiplicationGridScene } from '@vertical-arithmetic/layout'
import { resolveGridMetrics } from '@vertical-arithmetic/grid'

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
    expect(normalizedZero).toMatchObject({ multiplicandDigits: '12', multiplierDigits: '0', productDigits: '0', operandsSwapped: true })

    const trailingZero = computeMultiplication('120', '10')
    expect(trailingZero.productDigits).toBe('1200')
    expect(trailingZero.partialProducts.map(({ shift, value }) => ({ shift, value }))).toEqual([
      { shift: 0, value: '0' },
      { shift: 1, value: '120' },
    ])
  })

  test('输入顺序会规范化为大数在上、小数在下', () => {
    const result = computeMultiplication('12', '145')

    expect(result).toMatchObject({
      multiplicandDigits: '145',
      multiplierDigits: '12',
      operandsSwapped: true,
      productDigits: '1740',
    })
    expect(result.partialProducts.map(({ multiplierDigit, shift, value }) => ({ multiplierDigit, shift, value }))).toEqual([
      { multiplierDigit: '2', shift: 0, value: '290' },
      { multiplierDigit: '1', shift: 1, value: '145' },
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

describe('createMultiplicationGridScene', () => {
  test('布局层仅消费计算过程，并用通用网格表达错位部分积、进位与横线', () => {
    const computation = computeMultiplication('145', '12')
    const scene = createMultiplicationGridScene(computation, {
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
    expect(carryCell?.content).toMatchObject({ fontSizeRatio: 0.42, horizontalAlign: 'center', verticalAlign: 'bottom' })
    expect(carryCell).toBeDefined()
    expect(scene.rows[carryCell!.position.row]).toMatchObject({ id: 'carry-row-0', size: 0 })
    expect(scene.columns[carryCell!.position.column]).toMatchObject({ id: 'carry-boundary-2', size: 0 })
    const inputBar = scene.cells.find(({ id }) => id === 'multiplication-input-bar')
    expect(inputBar).toBeDefined()
    expect(scene.rows[inputBar!.position.row]).toMatchObject({ id: 'input-bar-row', size: 0 })
    expect(scene.cells.find(({ id }) => id === 'multiplier-0')?.content).not.toHaveProperty('verticalAlign')
    const additionCarry = scene.cells.find(({ id }) => id === 'addition-carry-1')
    expect(additionCarry).toMatchObject({
      position: { column: 4 },
      content: {
        text: '1',
        styleToken: 'multiplication.addition-carry',
        fontSizeRatio: 0.42,
        horizontalAlign: 'center',
        verticalAlign: 'bottom',
      },
    })
    expect(scene.rows[additionCarry!.position.row]).toMatchObject({ id: 'addition-carry-row', size: 0 })
    expect(scene.columns[additionCarry!.position.column]).toMatchObject({ id: 'carry-boundary-1', size: 0 })
    const sumBar = scene.cells.find(({ id }) => id === 'multiplication-sum-bar')
    expect(sumBar).toBeDefined()
    expect(scene.rows[sumBar!.position.row]).toMatchObject({ id: 'sum-bar-row', size: 0 })
    expect(scene.cells.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { column: 0, columnSpan: 8 } })
    expect(scene.cells.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { column: 1, columnSpan: 7 } })
    expect(scene.cells.some(({ styleToken }) => styleToken === 'multiplication.input-bar')).toBe(true)
    expect(scene.cells.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(true)
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product' && content.text === '1')).toBe(true)
    expect(scene.showGuideGrid).toBe(true)
    expect(scene.textHorizontalAlign).toBe('right')
    expect(scene.textVerticalAlign).toBe('top')
    expect(resolveGridMetrics(scene).width).toBeGreaterThan(0)
  })

  test('一位乘数只显示一次最终积，零乘法仍显示结果 0', () => {
    const singleDigit = createMultiplicationGridScene(computeMultiplication('145', '2'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    expect(singleDigit.cells.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(false)
    expect(singleDigit.cells.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product')).toHaveLength(3)

    const zero = createMultiplicationGridScene(computeMultiplication('145', '0'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    expect(zero.cells.find(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product')?.content).toMatchObject({ text: '0' })
  })

  test('最后一步产生的最高位进位只进入部分积，不单独显示进位符号', () => {
    const computation = computeMultiplication('99', '9')
    const scene = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })

    expect(computation.partialProducts[0].value).toBe('891')
    expect(scene.cells.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.carry'
    ))).toHaveLength(1)
    expect(scene.cells.find(({ id }) => id === 'carry-0-1')?.content).toMatchObject({ text: '8' })
    expect(scene.cells.some(({ id }) => id === 'carry-0-0')).toBe(false)
  })

  test('部分积相加的最高位进位也会显示在求和横线上', () => {
    const computation = computeMultiplication('99', '99')
    const scene = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })

    expect(computation.productDigits).toBe('9801')
    expect(scene.cells.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.addition-carry'
    ))).toHaveLength(2)
    expect(scene.cells.some(({ id }) => id === 'addition-carry-1')).toBe(true)
    const highestCarry = scene.cells.find(({ id }) => id === 'addition-carry-2')
    expect(highestCarry).toMatchObject({
      position: { column: 2 },
      content: { text: '1', horizontalAlign: 'center', verticalAlign: 'bottom' },
    })
    expect(scene.columns[highestCarry!.position.column]).toMatchObject({ id: 'carry-boundary-0', size: 0 })
  })

  test('145 × 24 的最高位相加进位落在 2 与 9 之间的求和横线上', () => {
    const scene = createMultiplicationGridScene(computeMultiplication('145', '24'), {
      cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    const carry = scene.cells.find(({ id }) => id === 'addition-carry-2')
    expect(carry).toMatchObject({
      position: { column: 2 },
      content: {
        text: '1',
        styleToken: 'multiplication.addition-carry',
        horizontalAlign: 'center',
        verticalAlign: 'bottom',
      },
    })
    expect(scene.columns[carry!.position.column]).toMatchObject({ id: 'carry-boundary-0', size: 0 })
    expect(scene.rows[carry!.position.row]).toMatchObject({ id: 'addition-carry-row', size: 0 })
  })

  test('可隐藏乘法与加法进位，并让两条横线使用相同的范围', () => {
    const scene = createMultiplicationGridScene(computeMultiplication('145', '12'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: true, showCarrySteps: false,
    })

    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.carry')).toBe(false)
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.addition-carry')).toBe(false)
    const carryRows = scene.rows.filter(({ id }) => id.startsWith('carry-row') || id === 'addition-carry-row')
    expect(carryRows).toHaveLength(3)
    expect(carryRows.every(({ size }) => size === 0)).toBe(true)
    expect(scene.cells.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { column: 0, columnSpan: 8 } })
    expect(scene.cells.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { column: 0, columnSpan: 8 } })
  })

  test('进位与横线使用零高行，隐藏进位不改变网格高度和横线位置', () => {
    const computation = computeMultiplication('145', '12')
    const baseSettings = {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      uniformMultiplicationBars: false,
    }
    const withCarries = createMultiplicationGridScene(computation, { ...baseSettings, showCarrySteps: true })
    const withoutCarries = createMultiplicationGridScene(computation, { ...baseSettings, showCarrySteps: false })

    expect(resolveGridMetrics(withCarries).height).toBe(resolveGridMetrics(withoutCarries).height)

    const inputBarRowId = (scene: ReturnType<typeof createMultiplicationGridScene>): string => {
      const cell = scene.cells.find(({ id }) => id === 'multiplication-input-bar')
      return scene.rows[cell!.position.row].id
    }
    expect(inputBarRowId(withCarries)).toBe('input-bar-row')
    expect(inputBarRowId(withoutCarries)).toBe('input-bar-row')
    expect(withCarries.rows.find(({ id }) => id === 'carry-row-0')).toMatchObject({ size: 0 })
    expect(withCarries.rows.find(({ id }) => id === 'addition-carry-row')).toMatchObject({ size: 0 })
  })

  test('进位行与进位列会提前创建，即使当前没有进位', () => {
    const baseSettings = {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 1,
      showGuideGrid: false,
      uniformMultiplicationBars: false,
    }
    const noCarry = createMultiplicationGridScene(computeMultiplication('123', '2'), {
      ...baseSettings,
      showCarrySteps: true,
    })
    expect(noCarry.columns.filter(({ id }) => id.startsWith('carry-boundary'))).toHaveLength(2)
    expect(noCarry.rows.filter(({ id }) => id.startsWith('carry-row'))).toHaveLength(1)
    expect(noCarry.rows.filter(({ id }) => id.startsWith('carry-row')).every(({ size }) => size === 0)).toBe(true)
    expect(noCarry.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.carry')).toBe(false)

    const hidden = createMultiplicationGridScene(computeMultiplication('145', '12'), {
      ...baseSettings,
      showCarrySteps: false,
    })
    expect(hidden.columns.filter(({ id }) => id.startsWith('carry-boundary'))).toHaveLength(3)
    expect(hidden.rows.filter(({ id }) => id.startsWith('carry-row') || id === 'addition-carry-row')).toHaveLength(3)
    expect(hidden.cells.some(({ content }) => (
      content?.kind === 'text'
      && (content.styleToken === 'multiplication.carry' || content.styleToken === 'multiplication.addition-carry')
    ))).toBe(false)
  })
})
