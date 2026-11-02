import { describe, expect, test } from 'vitest'

import { computeShortDivision } from '@vertical-arithmetic/calculators'
import { createShortDivisionGridScene } from '@vertical-arithmetic/layout'
import { getGridElementRect, resolveGridMetrics } from '@vertical-arithmetic/grid'

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

  test('短除法布局只消费过程数据，以显式边位置生成竖线与横线', () => {
    const computation = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
    const scene = createShortDivisionGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 0.82, showGuideGrid: true, showRemainders: true,
    })
    const separators = scene.elements.filter(({ styleToken }) => styleToken === 'short-division.separator')
    const separator = separators[0]
    const firstBar = scene.elements.find(({ styleToken }) => styleToken === 'short-division.bar')
    const metrics = resolveGridMetrics(scene)
    expect(scene.columns.every(({ size }) => size === 0.5)).toBe(true)
    expect(separator).toMatchObject({ position: { kind: 'edge', edge: 'left' }, content: { kind: 'line' } })
    expect(separators).toHaveLength(computation.steps.length)
    expect(getGridElementRect(separator!, metrics).width).toBe(0)
    const firstStepDigit = scene.elements.find(({ id }) => id === 'short-division-dividend-0-0-0')
    const secondStepDigit = scene.elements.find(({ id }) => id === 'short-division-dividend-1-0-0')
    const firstDivisor = scene.elements.find(({ id }) => id === 'short-division-divisor-0')
    const secondDivisor = scene.elements.find(({ id }) => id === 'short-division-divisor-1')
    expect(getGridElementRect(firstStepDigit!, metrics).width).toBe(32)
    expect(getGridElementRect(firstDivisor!, metrics).width).toBe(32)
    // 数字保持右对齐；为让整条过程严格呈阶梯，必要时竖线位于左侧预留空格的边界。
    expect(getGridElementRect(secondStepDigit!, metrics).left).toBeGreaterThan(getGridElementRect(firstStepDigit!, metrics).left)
    expect(getGridElementRect(separators[0], metrics).left).toBeLessThan(getGridElementRect(firstStepDigit!, metrics).left)
    expect(getGridElementRect(separators[1], metrics).left).toBeLessThan(getGridElementRect(secondStepDigit!, metrics).left)
    // 除数随竖线移动，始终写在本轮竖线左侧紧邻的一格。
    expect(getGridElementRect(firstDivisor!, metrics).left + getGridElementRect(firstDivisor!, metrics).width).toBe(getGridElementRect(separators[0], metrics).left)
    expect(getGridElementRect(secondDivisor!, metrics).left + getGridElementRect(secondDivisor!, metrics).width).toBe(getGridElementRect(separators[1], metrics).left)
    // 横线从数值区右边界完整回延，左端精确落在本轮竖线锚点。
    const barRect = getGridElementRect(firstBar!, metrics)
    expect(barRect.left).toBe(getGridElementRect(separator!, metrics).left)
    expect(barRect.left + barRect.width).toBeLessThan(metrics.width)
    expect(scene.elements.filter(({ styleToken }) => styleToken === 'short-division.bar')).toHaveLength(computation.steps.length)
    expect(scene.elements.filter(({ content }) => content?.kind === 'text' && content.styleToken === 'short-division.remainder')).toHaveLength(computation.steps.length)
    expect(scene.elements.find(({ content }) => content?.kind === 'text' && content.styleToken === 'short-division.remainder-label')?.content).toMatchObject({
      kind: 'text', text: '余', fontSizeRatio: 0.72,
    })
    expect(scene.rows.every(({ size }) => size > 0)).toBe(true)
    expect(scene.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'short-division.final')).toBe(true)
    expect(metrics).toMatchObject({ width: expect.any(Number), height: expect.any(Number) })
  })

  test('连续同宽的商行通过左侧空单元格让竖线保持阶梯状', () => {
    const computation = computeShortDivision({ mode: 'factorization', values: ['60'] })
    const scene = createShortDivisionGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 0.82, showGuideGrid: false, showRemainders: false,
    })
    const metrics = resolveGridMetrics(scene)
    const separators = scene.elements.filter(({ styleToken }) => styleToken === 'short-division.separator')
    const divisors = scene.elements.filter(({ content }) => (
      content?.kind === 'text' && content.styleToken === 'short-division.divisor'
    ))
    const firstDigits = computation.steps.map((_, stepIndex) => scene.elements.find(({ id }) => (
      id === `short-division-dividend-${stepIndex}-0-0`
    )))

    expect(computation.steps.map(({ dividends }) => dividends[0])).toEqual(['60', '30', '15'])
    expect(separators).toHaveLength(3)
    expect(divisors.map(({ content }) => content).every((content) => (
      content?.kind === 'text' && content.horizontalAlign === undefined
    ))).toBe(true)
    // 三轮均为两位数：上、中、下行分别为两个、一个、零个半格缩进。
    const separatorLefts = separators.map((separator) => getGridElementRect(separator, metrics).left)
    expect(scene.columns.every(({ size }) => size === 0.5)).toBe(true)
    expect(separatorLefts[1] - separatorLefts[0]).toBe(16)
    expect(separatorLefts[2] - separatorLefts[1]).toBe(16)
    expect(getGridElementRect(firstDigits[0]!, metrics).left - separatorLefts[0]).toBe(32)
    expect(getGridElementRect(firstDigits[1]!, metrics).left - separatorLefts[1]).toBe(16)
    expect(getGridElementRect(separators[2], metrics).left).toBe(getGridElementRect(firstDigits[2]!, metrics).left)
  })

  test('播放步骤时显示当前商作为临时结果', () => {
    const computation = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
    const scene = createShortDivisionGridScene(computation, {
      cellWidth: 32, rowHeight: 46, fontSizeRatio: 0.82, showGuideGrid: false, showRemainders: true,
      visibleStepCount: 1,
    })
    expect(scene.elements.filter(({ styleToken }) => styleToken === 'short-division.bar')).toHaveLength(1)
    expect(scene.elements.some(({ content }) => content?.kind === 'text' && content.styleToken === 'short-division.final' && content.text === '6')).toBe(true)
  })
})
