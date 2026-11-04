import { describe, expect, it } from 'vitest'
import { computeCompositeArithmetic } from '@u1in/shushi-calculators'
import { extractVisibleTextRows } from '@u1in/shushi-grid'
import { compileMacro, minifyMacroForCopy } from '@u1in/shushi-macro'
import { createCompositeArithmeticMacroSource, getCompositeArithmeticStepCount } from '@u1in/shushi-layout'

describe('组合竖式', () => {
  it('按书写顺序串联加、减、乘，并保留每一步的单项过程', () => {
    const computation = computeCompositeArithmetic('125 + 75 - 20 × 3')

    expect(computation.resultDigits).toBe('540')
    expect(computation.steps.map(({ operator, resultDigits }) => [operator, resultDigits])).toEqual([
      ['+', '200'],
      ['-', '180'],
      ['×', '540'],
    ])
    const multiplicationStep = computation.steps[2]
    expect(multiplicationStep.operator).toBe('×')
    if (multiplicationStep.operator !== '×') throw new Error('测试表达式的最后一步应为乘法。')
    const multiplication = multiplicationStep.computation
    expect(multiplication.trailingZeroShortcut).toBeNull()
    expect(multiplication.operandsSwapped).toBe(false)

    const source = createCompositeArithmeticMacroSource(computation)
    const scene = compileMacro(source)
    const copiedSource = minifyMacroForCopy(source)
    const operators = scene.elements
      .filter(({ content }) => content.kind === 'text' && ['+', '−', '×'].includes(content.text))
      .map(({ content }) => (content.kind === 'text' ? content.text : ''))
    expect(source).not.toContain('GRID(')
    expect(source).not.toContain('ariaLabel')
    expect(copiedSource).toBe(source)
    expect(copiedSource).not.toContain('ariaLabel')
    expect(copiedSource).not.toContain('KV(')
    expect(compileMacro(copiedSource)).toEqual(scene)
    expect(scene.elements.filter(({ content }) => content.kind === 'text').every(({ content }) => (
      content.kind === 'text' && content.color !== undefined
    ))).toBe(true)
    expect(operators).toEqual(['+', '−', '×'])
    const visibleRows = extractVisibleTextRows(scene)
    // 200 与 180 分别只作为前一步结果出现，直接复用于紧跟的 −20、×3。
    expect(visibleRows.filter((row) => row === '200')).toHaveLength(1)
    expect(visibleRows.filter((row) => row === '180')).toHaveLength(1)
  })

  it('将全局播放游标映射为同一份连续竖式宏快照', () => {
    const computation = computeCompositeArithmetic('12 + 8 - 5 × 4')
    const total = getCompositeArithmeticStepCount(computation)
    const resultOnlySource = createCompositeArithmeticMacroSource(computation, { visibleStepCount: 2 })
    const introductionSource = createCompositeArithmeticMacroSource(computation, { visibleStepCount: 3 })
    const scene = compileMacro(introductionSource)

    // 两列加法结束时只保留结果；下一帧才单独引入减数行。
    expect(total).toBeGreaterThan(3)
    expect(resultOnlySource).not.toContain('subtraction.operator')
    expect(introductionSource).not.toContain('GRID(')
    expect(extractVisibleTextRows(scene)).toContain('−5')
    expect(introductionSource).not.toContain('MM("×")')
    expect(scene.rows.length).toBeGreaterThan(3)
  })

  it('默认隐藏后续减法借位，但可显式叠加到复用的上一段结果行', () => {
    const computation = computeCompositeArithmetic('500 + 1 - 237')
    const defaultSource = createCompositeArithmeticMacroSource(computation)
    const defaultScene = compileMacro(defaultSource)
    const source = createCompositeArithmeticMacroSource(computation, { showBorrowSteps: true })
    const scene = compileMacro(source)

    expect(extractVisibleTextRows(defaultScene).filter((row) => row === '501')).toHaveLength(1)
    expect(defaultSource).not.toContain('MTD')
    expect(defaultScene.elements.some(({ content }) => content.kind === 'text' && content.text === '·')).toBe(false)
    expect(extractVisibleTextRows(scene).filter((row) => row === '501')).toHaveLength(1)
    expect(source).toContain('MTD')
    expect(scene.elements.some(({ content }) => content.kind === 'text' && content.text === '·')).toBe(true)
  })

  it('拒绝中间负数继续参与下一项非负整数竖式', () => {
    expect(() => computeCompositeArithmetic('3 - 5 + 1')).toThrow('中间结果为负数')
  })
})
