import { describe, expect, test } from 'vitest'
import { compileMacro, formatMacro, minifyMacro } from '@u1in/shushi-macro'
import { arithmeticExamples, formatExampleSource } from '../src/components/macroPlaygroundExamples'

/**
 * 首页示例在编写时保持紧凑，载入时再格式化。
 * 这里同时验证格式化结果稳定、语义未变，避免示例按钮把用户带向错误源码。
 */
describe('首页网格宏试验区示例', () => {
  test.each(arithmeticExamples)('$label 默认使用格式化源码', ({ source }) => {
    const formatted = formatExampleSource(source)
    expect(formatted).toBe(formatMacro(source))
    expect(minifyMacro(formatted)).toBe(minifyMacro(source))
    expect(compileMacro(formatted)).toEqual(compileMacro(source))
  })

  test('97 × 89 示例默认格式化为指定的多行源码', () => {
    const example = arithmeticExamples.find(({ label }) => label === '97 × 89 = 8633')
    expect(example && formatExampleSource(example.source)).toBe(`9, 7;
×, EP, [8, RB(6)], 9;
LN;
8, 7, 3;
[7, RB(1)], [7, RB(1)], [6, LT(5)], EP;
LN;
8, 6, 3, 3;`)
  })

  test('源码无法格式化时保留原文', () => {
    expect(formatExampleSource('GRID(')).toBe('GRID(')
  })
})
