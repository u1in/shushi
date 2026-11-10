/** 播放器只读取计算器步骤前缀，不再根据运算类型另行拼接布局事件。 */
import type { AnyVerticalArithmeticResult } from '@u1in/shushi-core'

/** 单项与组合表达式共用首页播放控件，不能退回到底层算术列数。 */
export const getOperationPlaybackStepCount = (
  result: AnyVerticalArithmeticResult | undefined,
  _showZeroQuotientSteps: boolean,
): number => result?.computation.calculationSteps.length ?? 0
