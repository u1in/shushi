import { describe, expect, test } from 'vitest'
import {
  computeAddition,
  computeDivision,
  computeMultiplication,
  computeShortDivision,
  computeSubtraction,
} from '@u1in/shushi-calculators'
import {
  createAdditionMacroSource,
  createDivisionMacroSource,
  createMultiplicationMacroSource,
  createShortDivisionMacroSource,
  createSubtractionMacroSource,
} from '@u1in/shushi-layout'
import { compileMacro, formatMacro, minifyMacro, minifyMacroForCopy } from '@u1in/shushi-macro'
import { arithmeticExamples, formatExampleSource } from '../src/components/macroPlaygroundExamples'

const DEFAULT_GRID_SETTINGS = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
}

/** 宏试验区示例必须来自正式的计算、布局和复制导出链路，而不是另一份人工维护的宏文本。 */
const expectedExampleSources = (): string[] => [
  minifyMacroForCopy(createAdditionMacroSource(computeAddition('356', '278'), { ...DEFAULT_GRID_SETTINGS, showCarrySteps: true })),
  minifyMacroForCopy(createSubtractionMacroSource(computeSubtraction('502', '137'), { ...DEFAULT_GRID_SETTINGS, showBorrowSteps: true })),
  minifyMacroForCopy(createMultiplicationMacroSource(computeMultiplication('97', '89'), {
    ...DEFAULT_GRID_SETTINGS,
    showCarrySteps: true,
    uniformMultiplicationBars: false,
  })),
  minifyMacroForCopy(createDivisionMacroSource(computeDivision('25', '10230', { resultMode: 'decimal' }), {
    ...DEFAULT_GRID_SETTINGS,
    bracketBend: 1,
    uniformSubtractionBars: false,
    showZeroQuotientSteps: false,
  })),
  minifyMacroForCopy(createShortDivisionMacroSource(
    computeShortDivision({ mode: 'factorization', values: ['60'] }),
    { ...DEFAULT_GRID_SETTINGS, showRemainders: false },
  )),
  minifyMacroForCopy(createShortDivisionMacroSource(
    computeShortDivision({ mode: 'commonFactor', values: ['60', '84'] }),
    { ...DEFAULT_GRID_SETTINGS, showRemainders: false },
  )),
]

describe('首页网格宏试验区示例', () => {
  test.each(arithmeticExamples)('$label 默认使用格式化源码', ({ source }) => {
    const formatted = formatExampleSource(source)
    expect(formatted).toBe(formatMacro(source))
    expect(minifyMacro(formatted)).toBe(minifyMacro(source))
    expect(compileMacro(formatted)).toEqual(compileMacro(source))
  })

  test('所有示例由计算器、布局器和复制导出 API 生成', () => {
    expect(arithmeticExamples.map(({ source }) => source)).toEqual(expectedExampleSources())
    arithmeticExamples.forEach(({ source }) => {
      expect(source).not.toContain('ariaLabel')
      expect(source).not.toContain('KV(style')
    })
  })

  test('源码无法格式化时保留原文', () => {
    expect(formatExampleSource('GRID(')).toBe('GRID(')
  })
})
