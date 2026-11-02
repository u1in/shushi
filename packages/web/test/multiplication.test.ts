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
    expect(trailingZero.trailingZeroShortcut).toEqual({ trailingZeroCount: 1, significantMultiplierDigits: '1' })
    expect(trailingZero.partialProducts.map(({ shift, value }) => ({ shift, value }))).toEqual([
      { shift: 0, value: '120' },
    ])
  })

  test('启用快捷计算时把唯一的 10 倍数放在第二行，关闭后始终大数在上', () => {
    const shortcut = computeMultiplication('10', '24')
    expect(shortcut).toMatchObject({
      multiplicandDigits: '24',
      multiplierDigits: '10',
      operandsSwapped: true,
      productDigits: '240',
      trailingZeroShortcut: { trailingZeroCount: 1, significantMultiplierDigits: '1' },
    })
    expect(shortcut.partialProducts.map(({ multiplierDigit, shift, value }) => ({ multiplierDigit, shift, value }))).toEqual([
      { multiplierDigit: '1', shift: 0, value: '24' },
    ])

    const shortcutWithMultipleDigits = computeMultiplication('7', '120')
    expect(shortcutWithMultipleDigits).toMatchObject({
      multiplicandDigits: '7', multiplierDigits: '120', productDigits: '840',
      trailingZeroShortcut: { trailingZeroCount: 1, significantMultiplierDigits: '12' },
    })
    expect(shortcutWithMultipleDigits.partialProducts.map(({ multiplierDigit, shift }) => ({ multiplierDigit, shift }))).toEqual([
      { multiplierDigit: '2', shift: 0 }, { multiplierDigit: '1', shift: 1 },
    ])

    const regular = computeMultiplication('97', '800', { useTrailingZeroShortcut: false })
    expect(regular).toMatchObject({ multiplicandDigits: '800', multiplierDigits: '97', operandsSwapped: true, productDigits: '77600', trailingZeroShortcut: null })
    expect(regular.partialProducts.map(({ multiplierDigit, shift, value }) => ({ multiplierDigit, shift, value }))).toEqual([
      { multiplierDigit: '7', shift: 0, value: '5600' },
      { multiplierDigit: '9', shift: 1, value: '7200' },
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
    expect(scene.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.operator' && content.text === '×')).toBe(true)
    expect(scene.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.partial-product')).toHaveLength(6)
    const carryCell = scene.elements.find(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.carry' && content.text === '1'
    ))
    expect(carryCell?.content).toMatchObject({ fontSizeRatio: 0.42, horizontalAlign: 'center', verticalAlign: 'bottom' })
    expect(carryCell).toBeDefined()
    expect(carryCell).toMatchObject({ position: { kind: 'intersection', columnLine: 4, rowLine: 2 } })
    const inputBar = scene.elements.find(({ id }) => id === 'multiplication-input-bar')
    expect(inputBar).toBeDefined()
    expect(inputBar).toMatchObject({ position: { kind: 'edge', row: 1, edge: 'bottom' } })
    expect(scene.elements.find(({ id }) => id === 'multiplier-0')?.content).not.toHaveProperty('verticalAlign')
    const additionCarry = scene.elements.find(({ id }) => id === 'addition-carry-1')
    expect(additionCarry).toMatchObject({
      position: { kind: 'intersection', columnLine: 3, rowLine: 4 },
      content: {
        text: '1',
        styleToken: 'multiplication.addition-carry',
        fontSizeRatio: 0.42,
        horizontalAlign: 'center',
        verticalAlign: 'bottom',
      },
    })
    const sumBar = scene.elements.find(({ id }) => id === 'multiplication-sum-bar')
    expect(sumBar).toBeDefined()
    expect(sumBar).toMatchObject({ position: { kind: 'edge', row: 4, edge: 'top' } })
    expect(scene.elements.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { column: 0, columnSpan: 5 } })
    expect(scene.elements.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { column: 1, columnSpan: 4 } })
    expect(scene.rows.every(({ size }) => size > 0)).toBe(true)
    expect(scene.columns.every(({ size }) => size > 0)).toBe(true)
    expect(scene.elements.some(({ styleToken }) => styleToken === 'multiplication.input-bar')).toBe(true)
    expect(scene.elements.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(true)
    expect(scene.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product' && content.text === '1')).toBe(true)
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
    expect(singleDigit.elements.some(({ styleToken }) => styleToken === 'multiplication.sum-bar')).toBe(false)
    expect(singleDigit.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product')).toHaveLength(3)

    const zero = createMultiplicationGridScene(computeMultiplication('145', '0'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    const zeroProductCells = zero.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.product'
    ))
    expect(zeroProductCells).toHaveLength(1)
    expect(zeroProductCells[0].content).toMatchObject({ text: '0' })
  })

  test('10 的倍数快捷计算直接在乘法横线下显示补零后的最终积', () => {
    const computation = computeMultiplication('10', '24')
    const scene = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })

    expect(scene.rows).toHaveLength(3)
    expect(scene.elements.some(({ id }) => id === 'multiplication-sum-bar')).toBe(false)
    expect(scene.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.partial-product'
    ))).toHaveLength(0)
    expect(scene.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.product'
    )).map(({ content }) => content?.kind === 'text' ? content.text : '')).toEqual(['2', '4', '0'])
    // 快捷竖式先按基础算式 `24 × 1` 对齐，再在右侧扩展补零位。
    expect(scene.elements.find(({ id }) => id === 'multiplicand-0')).toMatchObject({ position: { column: 1 } })
    expect(scene.elements.find(({ id }) => id === 'multiplier-0')).toMatchObject({ position: { column: 2 } })
    expect(scene.elements.find(({ id }) => id === 'product-0')).toMatchObject({ position: { column: 1 } })
  })

  test('十倍数快捷计算以基础算式对齐，并只向右扩展乘数和积的补零位', () => {
    const computation = computeMultiplication('97', '800')
    const settings = {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    }
    const scene = createMultiplicationGridScene(computation, settings)

    expect(computation).toMatchObject({
      multiplicandDigits: '97',
      multiplierDigits: '800',
      trailingZeroShortcut: { significantMultiplierDigits: '8', trailingZeroCount: 2 },
      productDigits: '77600',
    })
    // 数字区先容纳 `97 × 8 = 776` 的三列，再向右追加两个零位。
    expect(scene.columns).toHaveLength(6)
    expect(scene.elements.find(({ id }) => id === 'multiplicand-0')).toMatchObject({ position: { column: 2 } })
    expect(scene.elements.find(({ id }) => id === 'multiplicand-1')).toMatchObject({ position: { column: 3 } })
    expect(scene.elements.find(({ id }) => id === 'multiplier-0')).toMatchObject({ content: { text: '8' }, position: { column: 3 } })
    expect(scene.elements.find(({ id }) => id === 'multiplier-1')).toMatchObject({ content: { text: '0' }, position: { column: 4 } })
    expect(scene.elements.find(({ id }) => id === 'multiplier-2')).toMatchObject({ content: { text: '0' }, position: { column: 5 } })
    expect(scene.elements.find(({ id }) => id === 'product-0')).toMatchObject({ content: { text: '7' }, position: { column: 1 } })
    expect(scene.elements.find(({ id }) => id === 'product-3')).toMatchObject({ content: { text: '0' }, position: { column: 4 } })
    expect(scene.elements.find(({ id }) => id === 'product-4')).toMatchObject({ content: { text: '0' }, position: { column: 5 } })

    const incomplete = createMultiplicationGridScene(computation, { ...settings, visibleStepCount: 1 })
    expect(incomplete.elements.filter(({ id }) => id?.startsWith('multiplier-')).map(({ content }) => (
      content?.kind === 'text' ? content.text : ''
    ))).toEqual(['8'])
  })

  test('最后一步产生的最高位进位只进入部分积，不单独显示进位符号', () => {
    const computation = computeMultiplication('99', '9')
    const scene = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })

    expect(computation.partialProducts[0].value).toBe('891')
    expect(scene.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.carry'
    ))).toHaveLength(1)
    expect(scene.elements.find(({ id }) => id === 'carry-0-1')?.content).toMatchObject({ text: '8' })
    expect(scene.elements.some(({ id }) => id === 'carry-0-0')).toBe(false)
  })

  test('部分积相加的最高位进位也会显示在求和横线上', () => {
    const computation = computeMultiplication('99', '99')
    const scene = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })

    expect(computation.productDigits).toBe('9801')
    expect(scene.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.addition-carry'
    ))).toHaveLength(2)
    expect(scene.elements.some(({ id }) => id === 'addition-carry-1')).toBe(true)
    const highestCarry = scene.elements.find(({ id }) => id === 'addition-carry-2')
    expect(highestCarry).toMatchObject({
      position: { kind: 'intersection', columnLine: 2 },
      content: { text: '1', horizontalAlign: 'center', verticalAlign: 'bottom' },
    })
  })

  test('145 × 24 的最高位相加进位落在 2 与 9 之间的求和横线上', () => {
    const scene = createMultiplicationGridScene(computeMultiplication('145', '24'), {
      cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true,
    })
    const carry = scene.elements.find(({ id }) => id === 'addition-carry-2')
    expect(carry).toMatchObject({
      position: { kind: 'intersection', columnLine: 2 },
      content: {
        text: '1',
        styleToken: 'multiplication.addition-carry',
        horizontalAlign: 'center',
        verticalAlign: 'bottom',
      },
    })
  })

  test('可隐藏乘法与加法进位，并让两条横线使用相同的范围', () => {
    const scene = createMultiplicationGridScene(computeMultiplication('145', '12'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: true, showCarrySteps: false,
    })

    expect(scene.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.carry')).toBe(false)
    expect(scene.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.addition-carry')).toBe(false)
    expect(scene.rows.every(({ size }) => size > 0)).toBe(true)
    expect(scene.columns.every(({ size }) => size > 0)).toBe(true)
    expect(scene.elements.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { column: 0, columnSpan: 5 } })
    expect(scene.elements.find(({ id }) => id === 'multiplication-sum-bar')).toMatchObject({ position: { column: 0, columnSpan: 5 } })
  })

  test('进位与横线使用已有边界，隐藏进位不改变网格高度和横线位置', () => {
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

    expect(withCarries.elements.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { row: 1, edge: 'bottom' } })
    expect(withoutCarries.elements.find(({ id }) => id === 'multiplication-input-bar')).toMatchObject({ position: { row: 1, edge: 'bottom' } })
    expect(withCarries.rows.every(({ size }) => size > 0)).toBe(true)
  })

  test('即使当前没有进位，真实行列仍保持完整且不含虚拟轨道', () => {
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
    expect(noCarry.columns).toHaveLength(4)
    expect(noCarry.rows).toHaveLength(3)
    expect(noCarry.rows.every(({ size }) => size > 0)).toBe(true)
    expect(noCarry.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.carry')).toBe(false)

    const hidden = createMultiplicationGridScene(computeMultiplication('145', '12'), {
      ...baseSettings,
      showCarrySteps: false,
    })
    expect(hidden.columns).toHaveLength(5)
    expect(hidden.rows).toHaveLength(5)
    expect(hidden.elements.some(({ content }) => (
      content?.kind === 'text'
      && (content.styleToken === 'multiplication.carry' || content.styleToken === 'multiplication.addition-carry')
    ))).toBe(false)
  })

  test('逐位展示部分积，进入加法阶段后才出现求和横线和最终积', () => {
    const computation = computeMultiplication('145', '12')
    const firstDigit = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false, showCarrySteps: true, visibleStepCount: 1,
    })
    const partialDigits = firstDigit.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.partial-product'
    ))
    expect(partialDigits).toHaveLength(1)
    expect(partialDigits[0].content).toMatchObject({ text: '0' })
    expect(firstDigit.elements.some(({ id }) => id === 'multiplication-sum-bar')).toBe(false)
    expect(firstDigit.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'multiplication.product')).toBe(false)

    const additionFirstStep = createMultiplicationGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      uniformMultiplicationBars: false,
      showCarrySteps: true,
      visibleStepCount: computation.partialProducts.reduce((count, partialProduct) => count + partialProduct.digitSteps.length, 0) + 1,
    })
    expect(additionFirstStep.elements.some(({ id }) => id === 'multiplication-sum-bar')).toBe(true)
    expect(additionFirstStep.elements.some(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'multiplication.product' && content.text === '0'
    ))).toBe(true)
  })
})
