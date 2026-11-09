/** 小数补零属于教学播放状态：计算层已按公共倍率完成运算，布局层只逐帧揭示补入的零。 */
export interface DecimalPaddingEvent {
  operandIndex: number
}

/** 按操作数书写顺序逐个补零，确保每一个 0 都有独立的播放帧。 */
export const createDecimalPaddingEvents = (
  operandDecimalPlaces: readonly number[],
  decimalPlaces: number,
): DecimalPaddingEvent[] =>
  operandDecimalPlaces.flatMap((operandDecimalPlaceCount, operandIndex) =>
    Array.from({ length: Math.max(0, decimalPlaces - operandDecimalPlaceCount) }, (): DecimalPaddingEvent => ({
      operandIndex,
    })),
  )

/** 计算当前播放帧中每个操作数已显式补出的零位数。 */
export const getVisibleDecimalPaddingCounts = (
  operandCount: number,
  events: readonly DecimalPaddingEvent[],
  visibleStepCount: number,
): number[] => {
  const counts = Array.from({ length: operandCount }, () => 0)
  events.slice(0, visibleStepCount).forEach(({ operandIndex }) => {
    counts[operandIndex] += 1
  })
  return counts
}

/** 将补零写回显示文本；整数第一次补零时同时出现小数点。 */
export const appendDecimalZeros = (value: string, zeroCount: number): string => {
  if (zeroCount === 0) return value
  return `${value.includes('.') ? value : `${value}.`}${'0'.repeat(zeroCount)}`
}
