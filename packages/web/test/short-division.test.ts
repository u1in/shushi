import { describe, expect, test } from 'vitest'

import { computeShortDivision } from '@vertical-arithmetic/calculators'
import { createShortDivisionGridScene } from '@vertical-arithmetic/layout'
import { getGridCellRect, resolveGridMetrics } from '@vertical-arithmetic/grid'

describe('computeShortDivision', () => {
  test('分解质因数时保留最后的质数底行，并导出约数信息', () => {
    const result = computeShortDivision({ mode: 'factorization', values: ['60'] })
    expect(result).toMatchObject({
      mode: 'factorization',
      divisors: ['2', '2', '3'],
      finalValues: ['5'],
      primeFactors: ['2', '2', '3', '5'],
      factorizationText: '2^2 × 3 × 5',
      divisorCount: 12,
      divisorSum: '168',
    })
    expect(result.steps.map(({ dividends, quotients }) => [dividends[0], quotients[0]])).toEqual([
      ['60', '30'], ['30', '15'], ['15', '5'],
    ])
  })

  test('公共质因数短除法直到底行互质，并分别计算 GCD 和 LCM', () => {
    const result = computeShortDivision({ mode: 'commonFactor', values: ['12', '18'] })
    expect(result).toMatchObject({
      mode: 'commonFactor', divisors: ['2', '3'], finalValues: ['2', '3'], gcd: '6', lcm: '36',
    })
    const coprime = computeShortDivision({ mode: 'commonFactor', values: ['8', '9'] })
    expect(coprime).toMatchObject({ steps: [], finalValues: ['8', '9'], gcd: '1', lcm: '72' })
  })

  test('进制转换用整数商继续计算，并倒序读取余数', () => {
    const binary = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
    expect(binary).toMatchObject({
      mode: 'baseConversion', finalValues: ['0'], convertedText: '1101', remaindersBottomUp: ['1', '1', '0', '1'],
    })
    expect(binary.steps.map(({ dividends, quotients, remainders }) => [dividends[0], quotients[0], remainders[0]])).toEqual([
      ['13', '6', '1'], ['6', '3', '0'], ['3', '1', '1'], ['1', '0', '1'],
    ])
    expect(computeShortDivision({ mode: 'baseConversion', values: ['100'], targetBase: 8 })).toMatchObject({ convertedText: '144' })
    expect(computeShortDivision({ mode: 'baseConversion', values: ['0'], targetBase: 2 })).toMatchObject({ steps: [], convertedText: '0' })
  })

  test('验证模式各自的边界输入', () => {
    expect(() => computeShortDivision({ mode: 'factorization', values: ['0'] })).toThrow(/正整数/)
    expect(() => computeShortDivision({ mode: 'commonFactor', values: ['12'] })).toThrow(/至少需要两个/)
    expect(() => computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 1 })).toThrow(/2 到 36/)
    expect(() => computeShortDivision({ mode: 'factorization', values: ['1000000001'] })).toThrow(/不能超过/)
  })

  test('短除法布局只消费过程数据，以边框单元格生成竖线与横线', () => {
    const computation = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
    const scene = createShortDivisionGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 0.82, showGuideGrid: true, showRemainders: true,
    })
    const separators = scene.cells.filter(({ styleToken }) => styleToken === 'short-division.separator')
    const separator = separators[0]
    const firstBar = scene.cells.find(({ styleToken }) => styleToken === 'short-division.bar')
    const metrics = resolveGridMetrics(scene)
    expect(separator?.edges).toEqual({ left: true })
    expect(separators).toHaveLength(computation.steps.length)
    expect(getGridCellRect(separator!, metrics).width).toBe(0)
    const firstStepDigit = scene.cells.find(({ id }) => id === 'short-division-dividend-0-0-0')
    const secondStepDigit = scene.cells.find(({ id }) => id === 'short-division-dividend-1-0-0')
    const firstDivisor = scene.cells.find(({ id }) => id === 'short-division-divisor-0')
    const secondDivisor = scene.cells.find(({ id }) => id === 'short-division-divisor-1')
    // 数字保持右对齐；位数变少时，本轮零宽竖线移动到该数字的左边框。
    expect(secondStepDigit!.position.column).toBeGreaterThan(firstStepDigit!.position.column)
    expect(separators[0].position.column).toBe(firstStepDigit!.position.column - 1)
    expect(separators[1].position.column).toBe(secondStepDigit!.position.column - 1)
    // 除数随竖线移动，始终写在本轮竖线左侧紧邻的一格。
    expect(firstDivisor!.position.column + 1).toBe(separators[0].position.column)
    expect(secondDivisor!.position.column + 1).toBe(separators[1].position.column)
    // 横线从数值区右边界完整回延，左端精确落在本轮竖线锚点。
    const barRect = getGridCellRect(firstBar!, metrics)
    expect(barRect.left).toBe(getGridCellRect(separator!, metrics).left)
    expect(barRect.left + barRect.width).toBe(metrics.columnOffsets[firstBar!.position.column + firstBar!.position.columnSpan!])
    expect(scene.cells.filter(({ styleToken }) => styleToken === 'short-division.bar')).toHaveLength(computation.steps.length)
    expect(scene.cells.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'short-division.remainder')).toHaveLength(computation.steps.length)
    scene.cells.filter(({ styleToken }) => styleToken === 'short-division.bar').forEach((cell) => {
      expect(scene.rows[cell.position.row].size).toBe(0)
    })
    expect(scene.cells.some(({ content }) => content?.kind === 'text' && content.styleToken === 'short-division.final')).toBe(true)
    expect(metrics).toMatchObject({ width: expect.any(Number), height: expect.any(Number) })
  })
})
