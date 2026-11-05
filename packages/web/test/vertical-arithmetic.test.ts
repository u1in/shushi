import { describe, expect, it } from 'vitest'
import {
  shushi,
  shushiCore,
  compileMacro,
} from '@u1in/shushi-core'

/** 门户返回的源码仍须由统一宏编译器复刻，避免便利入口绕过可编辑源码。 */
const expectPortalResult = (result: { source: string, scene: unknown, rendered: unknown, inspection: unknown }): void => {
  expect(result.source).not.toBe('')
  expect(compileMacro(result.source)).toEqual(result.scene)
  expect(result.rendered).toBeDefined()
  expect(result.inspection).toBeDefined()
}

describe('统一竖式门户 API', () => {
  it('shushiCore 用结构化判别入口覆盖加减乘与长除法', () => {
    const addition = shushiCore({ operation: 'addition', values: ['356', '278'] })
    expect(addition.computation.sumDigits).toBe('634')
    expectPortalResult(addition)

    const subtraction = shushiCore({ operation: 'subtraction', operands: ['502', '137'] })
    expect(subtraction.computation.differenceDigits).toBe('365')
    // 单项减法保持教学页面的默认：默认显示借位；组合模式另有自己的默认值。
    expect(subtraction.source).toContain('MTD(')
    expectPortalResult(subtraction)

    const multiplication = shushiCore({ operation: 'multiplication', operands: ['97', '89'] })
    expect(multiplication.computation.productDigits).toBe('8633')
    expectPortalResult(multiplication)

    const division = shushiCore({
      operation: 'division',
      divisor: '25',
      dividend: '10230',
      calculation: { resultMode: 'decimal' },
    })
    expect(division.computation.quotientText).toBe('409.2')
    expectPortalResult(division)
  })

  it('覆盖短除、组合表达式及专项设置覆盖', () => {
    const shortDivision = shushiCore({
      operation: 'shortDivision',
      mode: 'baseConversion',
      values: ['13'],
      targetBase: 2,
      settings: { showRemainders: false },
    })
    expect(shortDivision.computation.mode).toBe('baseConversion')
    if (shortDivision.computation.mode !== 'baseConversion') throw new Error('短除法模式应为进制转换。')
    expect(shortDivision.computation.convertedText).toBe('1101')
    expect(shortDivision.source).not.toContain('short-division.remainder-label')
    expectPortalResult(shortDivision)

    const composite = shushiCore({ operation: 'composite', expression: '502 - 137 + 5' })
    expect(composite.computation.resultDigits).toBe('370')
    // 组合竖式默认关闭借位，调用方仍可通过 settings 显式开启。
    expect(composite.source).not.toContain('MTD(')
    expectPortalResult(composite)
  })

  it('默认返回 SSR 安全的 SVG 字符串，并提供可注入的 AST 检查器', () => {
    const result = shushiCore({ operation: 'addition', values: ['2', '3'] })

    expect(typeof result.rendered).toBe('string')
    expect(result.rendered).toMatch(/^<svg/)
    expect(result.inspection.scene).toEqual(result.scene)
    expect(Object.keys(result.inspection.references).length).toBeGreaterThan(0)
  })

  it('客户端 DOM 渲染模式在服务端环境中明确拒绝执行', () => {
    expect(() => shushiCore({
      operation: 'addition',
      values: ['2', '3'],
      renderMode: 'div',
    })).toThrow('需要客户端 DOM 环境')

    expect(() => shushiCore({
      operation: 'addition',
      values: ['2', '3'],
      renderMode: 'svg',
    })).toThrow('需要客户端 DOM 环境')
  })

  it('svg-string 模式不允许传入客户端挂载点', () => {
    expect(() => shushiCore({
      operation: 'addition',
      values: ['2', '3'],
      renderMode: 'svg-string',
      el: {} as never,
    })).toThrow('不能传入 el')
  })

  it('shushi 解析加减乘表达式，并兼容 * 与 ×', () => {
    const composite = shushi('244 + 133 × 24')
    if (!('resultDigits' in composite.computation)) throw new Error('应解析为组合竖式。')
    expect(composite.computation.resultDigits).toBe('9048')
    expectPortalResult(composite)

    const multiplication = shushi('244 + 133 * 24')
    if (!('resultDigits' in multiplication.computation)) throw new Error('应解析为组合竖式。')
    expect(multiplication.computation.resultDigits).toBe('9048')
    expectPortalResult(multiplication)
  })

  it('shushi 将单独的 ÷ 和 / 转为长除法', () => {
    const division = shushi('255 ÷ 5')
    if (!('quotientText' in division.computation)) throw new Error('应解析为长除法。')
    expect(division.computation.quotientText).toBe('51')
    expectPortalResult(division)

    const slashDivision = shushi('255 / 5')
    if (!('quotientText' in slashDivision.computation)) throw new Error('应解析为长除法。')
    expect(slashDivision.computation.quotientText).toBe('51')
    expect(() => shushi('12 + 8 / 5')).toThrow('长除法必须单独书写')
  })

  it('shushi 将 | 分派给短除法、公因数和进制转换', () => {
    const factorization = shushi('|48')
    if (!('mode' in factorization.computation)) throw new Error('应解析为短除法。')
    expect(factorization.computation.mode).toBe('factorization')

    const division = shushi('2|12')
    if (!('mode' in division.computation)) throw new Error('应解析为短除法。')
    expect(division.computation.mode).toBe('division')
    if (division.computation.mode !== 'division') throw new Error('应解析为指定除数的短除法。')
    expect(division.computation.quotient).toBe('6')

    const commonFactor = shushi('2|12 24')
    if (!('mode' in commonFactor.computation)) throw new Error('应解析为短除法。')
    expect(commonFactor.computation.mode).toBe('commonFactor')
    if (commonFactor.computation.mode !== 'commonFactor') throw new Error('应解析为公因数短除法。')
    expect(commonFactor.computation.gcd).toBe('12')

    const conversion = shushi('(124)2')
    if (!('mode' in conversion.computation)) throw new Error('应解析为短除法。')
    expect(conversion.computation.mode).toBe('baseConversion')
    if (conversion.computation.mode !== 'baseConversion') throw new Error('应解析为进制转换短除法。')
    expect(conversion.computation.convertedText).toBe('1111100')
  })
})
