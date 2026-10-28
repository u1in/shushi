import { describe, expect, test } from 'vitest'

import { computeDivision } from '../src/division.js'

const exactDivisionCases = [
  ['0', '5', '0', '0'],
  ['5', '5', '1', '0'],
  ['4', '5', '0', '4'],
  ['102', '3', '34', '0'],
  ['1040', '5', '208', '0'],
  ['60', '3', '20', '0'],
  ['100', '7', '14', '2'],
  ['1000000', '1000', '1000', '0'],
]

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

  test('输入前导零会被规范化，商中的中间零会被保留', () => {
  const leadingZeroResult = computeDivision('0005', '0001040')
  expect(leadingZeroResult.divisorDigits).toBe('5')
  expect(leadingZeroResult.dividendDigits).toBe('1040')
  expect(leadingZeroResult.quotientText).toBe('208')
  expect(leadingZeroResult.remainder).toBe('0')

  const middleZeroResult = computeDivision('2', '608')
  expect(middleZeroResult.quotientText).toBe('304')
  expect(middleZeroResult.quotientByPosition.get(1)).toBe('0')
  expect(middleZeroResult.steps[1].showSubtract).toBe(false)
  expect(middleZeroResult.steps[1].productText).toBe('0')
  })

  test('商尚未开始时不写前导零，除数大于被除数时商为零', () => {
  const result = computeDivision('12', '4')

  expect(result.quotientText).toBe('0')
  expect(result.remainder).toBe('4')
  expect([...result.quotientByPosition.entries()]).toEqual([[0, '0']])
  expect(result.steps).toEqual([])
  })

  test('每个商位与产生它的被除数位置对齐，商位为零的步骤不显示减法', () => {
  const result = computeDivision('2', '608')

  expect([...result.quotientByPosition.entries()]).toEqual([[0, '3'], [1, '0'], [2, '4']])
  expect(
    result.steps.map(({ position, currentText, productText, showSubtract }) => ({
      position,
      currentText,
      productText,
      showSubtract,
    })),
  ).toEqual([
    { position: 0, currentText: '6', productText: '6', showSubtract: true },
    { position: 1, currentText: '0', productText: '0', showSubtract: false },
    { position: 2, currentText: '8', productText: '8', showSubtract: true },
  ])
  })

  test('小数模式能计算有限小数，并保留不占单元格的小数点边界位置数据', () => {
  const result = computeDivision('8', '1', { resultMode: 'decimal' })

  expect(result.quotientText).toBe('0.125')
  expect(result.remainder).toBe('0')
  expect(result.hasFraction).toBe(true)
  expect(result.fractionalDigitCount).toBe(3)
  expect(result.digitCount).toBe(4)
  expect([...result.quotientByPosition.entries()]).toEqual([
    [0, '0'],
    [1, '1'],
    [2, '2'],
    [3, '5'],
  ])
  })

  test('小数模式保留小数部分的零位', () => {
  const result = computeDivision('20', '1', { resultMode: 'decimal' })

  expect(result.quotientText).toBe('0.05')
  expect(result.remainder).toBe('0')
  expect(result.quotientByPosition.get(1)).toBe('0')
  expect(result.steps[0].showSubtract).toBe(false)
  })

  test('循环小数和达到位数上限时回退到余数模式', () => {
  const repeating = computeDivision('3', '1', { resultMode: 'decimal' })
  expect(repeating.quotientText).toBe('0')
  expect(repeating.remainder).toBe('1')
  expect(repeating.hasFraction).toBe(false)
  expect(repeating.decimalFallback).toBe(true)

  const limited = computeDivision('8', '1', {
    resultMode: 'decimal',
    maxDecimalDigits: 2,
  })
  expect(limited.quotientText).toBe('0')
  expect(limited.remainder).toBe('1')
  expect(limited.decimalFallback).toBe(true)
  })

  test('非法输入和除数零会报错', () => {
  ;['', '1.5', '-1', 'abc', ' 12 ', '12 '].forEach((value) => {
    expect(() => computeDivision('2', value)).toThrow(/被除数请输入非负整数/)
  })

  expect(() => computeDivision('0', '12')).toThrow(/除数不能为 0/)
  expect(() => computeDivision('1.5', '12')).toThrow(/除数请输入非负整数/)
  })

  test('超长数字串不依赖 JavaScript 安全整数范围', () => {
  const dividend = `1${'0'.repeat(120)}`
  const result = computeDivision('1', dividend)

  expect(result.quotientText).toBe(dividend)
  expect(result.remainder).toBe('0')
  })
})
