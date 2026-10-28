import { describe, expect, test } from 'vitest'

import { computeDivision } from '../src/division'
import { createVerticalDivisionRenderModel } from '../src/vertical-division-layout'

const exactDivisionCases = [
  ['0', '5', '0', '0'],
  ['5', '5', '1', '0'],
  ['4', '5', '0', '4'],
  ['102', '3', '34', '0'],
  ['1040', '5', '208', '0'],
  ['60', '3', '20', '0'],
  ['100', '7', '14', '2'],
  ['1000000', '1000', '1000', '0'],
] as const

describe('computeDivision', () => {
  test('计算文档中的整数除法验证清单', () => {
    exactDivisionCases.forEach(([dividend, divisor, quotient, remainder]) => {
      const result = computeDivision(divisor, dividend)

      expect(result.quotientText, `${dividend} ÷ ${divisor} 的商不正确`).toBe(quotient)
      expect(result.remainder, `${dividend} ÷ ${divisor} 的余数不正确`).toBe(remainder)
      expect(result.hasFraction).toBe(false)
      expect(result.decimalFallback).toBe(false)
    })
  })

  test('输入前导零会被规范化，商中的中间零会保留但省略步骤', () => {
    const leadingZeroResult = computeDivision('0005', '0001040')
    expect(leadingZeroResult.divisorDigits).toBe('5')
    expect(leadingZeroResult.dividendDigits).toBe('1040')
    expect(leadingZeroResult.quotientText).toBe('208')

    const middleZeroResult = computeDivision('2', '608')
    expect(middleZeroResult.quotientDigits).toEqual([
      { column: 0, digit: '3' },
      { column: 1, digit: '0' },
      { column: 2, digit: '4' },
    ])
    expect(middleZeroResult.steps.map(({ dividendColumn, quotientDigit }) => ({ dividendColumn, quotientDigit }))).toEqual([
      { dividendColumn: 0, quotientDigit: '3' },
      { dividendColumn: 2, quotientDigit: '4' },
    ])
  })

  test('整商为零时仍导出唯一的  部分被除数 − 0  步骤', () => {
    const result = computeDivision('12', '4')
    expect(result.quotientText).toBe('0')
    expect(result.remainder).toBe('4')
    expect(result.quotientDigits).toEqual([{ column: 0, digit: '0' }])
    expect(result.steps).toEqual([{
      dividendColumn: 0,
      divisor: '12',
      quotientDigit: '0',
      partialDividend: '4',
      product: '0',
      remainder: '4',
    }])
  })

  test('有限小数导出补零列；循环和达到上限时不提交试算步骤', () => {
    const finite = computeDivision('8', '1', { resultMode: 'decimal' })
    expect(finite.quotientText).toBe('0.125')
    expect(finite.decimalPointColumn).toBe(1)
    expect(finite.fractionalDigitCount).toBe(3)
    expect(finite.quotientDigits).toEqual([
      { column: 0, digit: '0' },
      { column: 1, digit: '1' },
      { column: 2, digit: '2' },
      { column: 3, digit: '5' },
    ])

    const repeating = computeDivision('3', '1', { resultMode: 'decimal' })
    expect(repeating).toMatchObject({ quotientText: '0', remainder: '1', decimalFallback: true, decimalPointColumn: null })
    expect(repeating.steps).toHaveLength(1)

    const limited = computeDivision('8', '1', { resultMode: 'decimal', maxDecimalDigits: 2 })
    expect(limited).toMatchObject({ quotientText: '0', remainder: '1', decimalFallback: true })
    expect(limited.steps).toHaveLength(1)
  })

  test('竖式布局层仅消费计算中间过程，并输出具名视觉元素', () => {
    const computation = computeDivision('25', '10230', { resultMode: 'decimal' })
    const model = createVerticalDivisionRenderModel(computation, {
      cellWidth: 32,
      rowHeight: 46,
      fontSizeRatio: 0.82,
      bracketBend: 1,
      showGuideGrid: true,
      uniformSubtractionBars: false,
    })

    expect(model.bracketArc.kind).toBe('divisionBracketArc')
    expect(model.lines.some(({ kind }) => kind === 'divisionBracketTopLine')).toBe(true)
    expect(model.lines.filter(({ kind }) => kind === 'subtractionBar')).toHaveLength(computation.steps.length)
    expect(model.lines.some(({ kind }) => kind === 'guideGridHorizontal')).toBe(true)
    expect(model.digits.some(({ role }) => role === 'partialDividend')).toBe(true)
    expect(model.digits.some(({ role }) => role === 'appendedZero')).toBe(true)
    expect(model.decimalPoint).toMatchObject({
      kind: 'decimalPoint',
      boundaryColumn: 5,
      x: 260,
    })
  })


  test('非法输入、零除数和不合法的小数上限会报错', () => {
    ;['', '1.5', '-1', 'abc', ' 12 ', '12 '].forEach((value) => {
      expect(() => computeDivision('2', value)).toThrow(/被除数请输入非负整数/)
    })
    expect(() => computeDivision('0', '12')).toThrow(/除数不能为 0/)
    expect(() => computeDivision('2', '12', { maxDecimalDigits: 0 })).toThrow(/小数最大位数必须是正整数/)
  })

  test('超长数字串不依赖 JavaScript 安全整数范围', () => {
    const dividend = `1${'0'.repeat(120)}`
    const result = computeDivision('1', dividend)
    expect(result.quotientText).toBe(dividend)
    expect(result.remainder).toBe('0')
  })
})
