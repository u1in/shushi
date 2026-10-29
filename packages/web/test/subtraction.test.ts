import { describe, expect, test } from 'vitest'

import { computeSubtraction } from '@vertical-arithmetic/calculators'
import { createSubtractionGridScene } from '@vertical-arithmetic/layout'
import { resolveGridMetrics } from '@vertical-arithmetic/grid'

describe('computeSubtraction', () => {
  test('计算规则文档中的 502 − 137，并导出连续借位后的 4、9、12', () => {
    const result = computeSubtraction('502', '137')
    expect(result).toMatchObject({ differenceDigits: '365', resultText: '365', isNegative: false })
    expect(result.steps.map(({ columnFromRight, minuendDisplay, borrowIn, borrowOut, resultDigit }) => ({ columnFromRight, minuendDisplay, borrowIn, borrowOut, resultDigit }))).toEqual([
      { columnFromRight: 0, minuendDisplay: '12', borrowIn: 0, borrowOut: 1, resultDigit: '5' },
      { columnFromRight: 1, minuendDisplay: '9', borrowIn: 1, borrowOut: 1, resultDigit: '6' },
      { columnFromRight: 2, minuendDisplay: '4', borrowIn: 1, borrowOut: 0, resultDigit: '3' },
    ])
  })

  test('支持连续借位、零、前导零和负结果', () => {
    expect(computeSubtraction('1000', '1').resultText).toBe('999')
    expect(computeSubtraction('0005', '0005')).toMatchObject({ differenceDigits: '0', resultText: '0' })
    expect(computeSubtraction('12', '35')).toMatchObject({
      workingMinuendDigits: '35', workingSubtrahendDigits: '12', differenceDigits: '23', resultText: '-23', isNegative: true,
    })
  })

  test('拒绝非法输入，并支持超长数字', () => {
    expect(() => computeSubtraction('12', '-3')).toThrow(/减数请输入非负整数/)
    const value = `1${'0'.repeat(120)}`
    expect(computeSubtraction(value, '1').resultText).toBe('9'.repeat(120))
  })
})

describe('createSubtractionGridScene', () => {
  test('用通用网格表现原始被减数、借位提示和减法横线', () => {
    const scene = createSubtractionGridScene(computeSubtraction('502', '137'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: true,
      showBorrowSteps: true,
    })
    expect(scene.rows[0]).toMatchObject({ id: 'minuend-row', size: 1 })
    expect(scene.rows.every(({ size }) => size > 0)).toBe(true)
    expect(scene.elements.find(({ id }) => id === 'minuend-0')?.content).toMatchObject({ text: '2', styleToken: 'subtraction.minuend' })
    expect(scene.elements.find(({ id }) => id === 'minuend-1')?.content).toMatchObject({ text: '0', styleToken: 'subtraction.minuend' })
    expect(scene.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'subtraction.borrow')).toHaveLength(2)
    expect(scene.elements.find(({ id }) => id === 'borrow-0')).toMatchObject({
      position: { column: 2 },
      content: { text: '·', fontSizeRatio: 0.84, horizontalAlign: 'center', verticalAlign: 'center' },
    })
    expect(scene.elements.find(({ id }) => id === 'subtraction-difference-bar')).toMatchObject({ position: { column: 0, columnSpan: 4 } })
    expect(resolveGridMetrics(scene).width).toBeGreaterThan(0)
  })

  test('可隐藏借位过程，且负结果带有负号单元格', () => {
    const hidden = createSubtractionGridScene(computeSubtraction('502', '137'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      showBorrowSteps: false,
    })
    expect(hidden.elements.find(({ id }) => id === 'minuend-0')?.content).toMatchObject({ text: '2' })
    expect(hidden.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'subtraction.borrow')).toBe(false)
    expect(hidden.elements.find(({ id }) => id === 'subtraction-difference-bar')).toMatchObject({ position: { column: 0, columnSpan: 4 } })
    const negative = createSubtractionGridScene(computeSubtraction('12', '35'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      showBorrowSteps: true,
    })
    expect(negative.elements.find(({ id }) => id === 'negative-sign')?.content).toMatchObject({ text: '−', styleToken: 'subtraction.negative-sign' })
  })

  test('按可见步骤渐进显示差和借位，输入被减数保持完整', () => {
    const scene = createSubtractionGridScene(computeSubtraction('502', '137'), {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showBorrowSteps: true,
      visibleStepCount: 2,
    })
    const differenceDigits = scene.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'subtraction.difference')
    expect(differenceDigits.map(({ content }) => content?.kind === 'text' ? content.text : '')).toEqual(['6', '5'])
    expect(scene.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'subtraction.minuend')).toHaveLength(3)
    expect(scene.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'subtraction.borrow')).toHaveLength(2)
  })
})
