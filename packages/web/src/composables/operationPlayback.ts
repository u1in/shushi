/** 将门户结果映射为对应布局器的完整教学播放事件数。 */
import {
  getAdditionStepCount,
  getCompositeArithmeticStepCount,
  getDivisionPlaybackStepCount,
  getMultiplicationStepCount,
  getSubtractionStepCount,
} from '@u1in/shushi-core'
import type { AnyVerticalArithmeticResult } from '@u1in/shushi-core'

/** 单项与组合表达式共用首页播放控件，不能退回到底层算术列数。 */
export const getOperationPlaybackStepCount = (
  result: AnyVerticalArithmeticResult | undefined,
  showZeroQuotientSteps: boolean,
): number => {
  const computation = result?.computation
  if (!computation) return 0
  if ('initialValueDigits' in computation) return getCompositeArithmeticStepCount(computation)
  if ('quotientText' in computation) return getDivisionPlaybackStepCount(computation, showZeroQuotientSteps)
  if ('partialProducts' in computation) return getMultiplicationStepCount(computation)
  if ('sumDigits' in computation) return getAdditionStepCount(computation)
  if ('differenceDigits' in computation) return getSubtractionStepCount(computation)
  return computation.steps.length
}
