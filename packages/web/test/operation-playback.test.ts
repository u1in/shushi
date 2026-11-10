import { describe, expect, it } from 'vitest'
import { getAdditionStepCount, getSubtractionStepCount, shushi } from '@u1in/shushi-core'
import { getOperationPlaybackStepCount } from '../src/composables/operationPlayback'

describe('首页表达式预览的计算器步骤', () => {
  it('单项小数减法直接使用计算器快照，不会在数位计算结束时提前禁用下一步', () => {
    const result = shushi('8.7 - 0.89')
    if (!('differenceDigits' in result.computation)) throw new Error('应解析为减法。')

    expect(getOperationPlaybackStepCount(result, false)).toBe(getSubtractionStepCount(result.computation))
    expect(getOperationPlaybackStepCount(result, false)).toBe(result.computation.calculationSteps.length)
    expect(result.computation.calculationSteps.map(({ action }) => action)).toContain('pad-decimal')
    expect(result.computation.calculationSteps.map(({ action }) => action)).toContain('place-decimal')
  })

  it('单项小数加法按数组顺序产生扁平快照，且补零与结果小数点均由计算器产出', () => {
    const result = shushi('1.2 + 3.04')
    if (!('sumDigits' in result.computation)) throw new Error('应解析为加法。')

    expect(getOperationPlaybackStepCount(result, false)).toBe(getAdditionStepCount(result.computation))
    expect(getOperationPlaybackStepCount(result, false)).toBe(result.computation.calculationSteps.length)
    expect(result.computation.calculationSteps[0]).toMatchObject({
      action: 'pad-decimal',
      operands: ['1.20', '3.04'],
    })
    expect(result.computation.calculationSteps.at(-1)).toMatchObject({
      action: 'place-decimal',
      result: '4.24',
    })
  })

  it('组合表达式展平已完成子运算的计算器步骤，不提前包含后续操作结果', () => {
    const result = shushi('12 + 8 - 5 × 4')
    if (!('initialValueDigits' in result.computation)) throw new Error('应解析为组合表达式。')

    const { calculationSteps } = result.computation
    expect(getOperationPlaybackStepCount(result, false)).toBe(calculationSteps.length)
    expect(calculationSteps.find(({ action }) => action === 'start-operation')).toMatchObject({
      operationIndex: 1,
      operator: '-',
      operands: ['20', '5'],
    })
    expect(calculationSteps.at(-1)).toMatchObject({ operationIndex: 2, operator: '×' })
  })
})
