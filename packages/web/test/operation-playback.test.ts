import { describe, expect, it } from 'vitest'
import { getAdditionStepCount, getSubtractionStepCount, shushi } from '@u1in/shushi-core'
import { getOperationPlaybackStepCount } from '../src/composables/operationPlayback'

describe('首页表达式预览的播放步数', () => {
  it('单项小数减法使用布局器事件数，不会在数位计算结束时提前禁用下一步', () => {
    const result = shushi('8.7 - 0.89')
    if (!('differenceDigits' in result.computation)) throw new Error('应解析为减法。')

    expect(getOperationPlaybackStepCount(result, false)).toBe(getSubtractionStepCount(result.computation))
    expect(getOperationPlaybackStepCount(result, false)).toBeGreaterThan(result.computation.steps.length)
  })

  it('单项小数加法同样计入补零与结果小数点事件', () => {
    const result = shushi('1.2 + 3.04')
    if (!('sumDigits' in result.computation)) throw new Error('应解析为加法。')

    expect(getOperationPlaybackStepCount(result, false)).toBe(getAdditionStepCount(result.computation))
    expect(getOperationPlaybackStepCount(result, false)).toBeGreaterThan(result.computation.steps.length)
  })
})
