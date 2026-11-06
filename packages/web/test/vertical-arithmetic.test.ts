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
      calculation: { maxDecimalDigits: 4 },
    })
    expect(division.computation.quotientText).toBe('409.2')
    expectPortalResult(division)
  })

  it('未配置小数位时返回整数余数，配置后保留到目标位的截断小数过程', () => {
    const remainder = shushiCore({ operation: 'division', divisor: '3', dividend: '1' })
    expect(remainder.computation).toMatchObject({
      quotientText: '0',
      remainder: '1',
      hasFraction: false,
      decimalTruncated: false,
    })

    const cappedDecimal = shushiCore({
      operation: 'division',
      divisor: '3',
      dividend: '1',
      calculation: { maxDecimalDigits: 2 },
    })
    expect(cappedDecimal.computation).toMatchObject({
      quotientText: '0.33',
      remainder: '1',
      hasFraction: true,
      fractionalDigitCount: 2,
      decimalTruncated: true,
    })
    expect(cappedDecimal.computation.steps).toHaveLength(3)
    expectPortalResult(cappedDecimal)

    const finiteDecimal = shushiCore({
      operation: 'division',
      divisor: '8',
      dividend: '1',
      calculation: { maxDecimalDigits: 4 },
    })
    expect(finiteDecimal.computation).toMatchObject({
      quotientText: '0.125',
      remainder: '0',
      decimalTruncated: false,
    })
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
    expect(result.scene.fontFamily).toBe('STIX Two Math')
    expect(result.inspection.scene).toEqual(result.scene)
    expect(Object.keys(result.inspection.references).length).toBeGreaterThan(0)
  })

  it('将颜色和字体在同一次宏编译中写入场景', () => {
    const result = shushi('2 + 3', {
      fontFamily: 'Noto Sans Math',
      colorTheme: {
        text: '#111111',
        carry: '#222222',
        borrow: '#333333',
        operator: '#444444',
        decimal: '#555555',
        rule: { color: '#666666', thickness: 2 },
        bracketRule: { color: '#777777', thickness: 2 },
      },
    })

    expect(result.scene.fontFamily).toBe('Noto Sans Math')
    expect(result.inspection.scene).toEqual(result.scene)
    expect(result.rendered).toContain('--grid-font-family:Noto Sans Math')
    expect(result.scene.elements.find(({ content }) => content.kind === 'text' && content.text === '+')?.content).toMatchObject({ color: '#444444' })
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

    const commonFactor = shushi('|12 24')
    if (!('mode' in commonFactor.computation)) throw new Error('应解析为短除法。')
    expect(commonFactor.computation.mode).toBe('commonFactor')
    if (commonFactor.computation.mode !== 'commonFactor') throw new Error('应解析为公因数短除法。')
    expect(commonFactor.computation.gcd).toBe('12')

    const autoCommonFactor = shushi('|12 28')
    if (!('mode' in autoCommonFactor.computation)) throw new Error('应解析为短除法。')
    expect(autoCommonFactor.computation.mode).toBe('commonFactor')
    if (autoCommonFactor.computation.mode !== 'commonFactor') throw new Error('应解析为自动试除的公因数短除法。')
    expect(autoCommonFactor.computation.gcd).toBe('4')
    expect(autoCommonFactor.computation.lcm).toBe('84')

    const coprimeTriple = shushi('|12 28 33')
    if (!('mode' in coprimeTriple.computation)) throw new Error('应解析为短除法。')
    expect(coprimeTriple.computation.mode).toBe('commonFactor')
    if (coprimeTriple.computation.mode !== 'commonFactor') throw new Error('应解析为三数公因数短除法。')
    expect(coprimeTriple.computation.gcd).toBe('1')
    expect(coprimeTriple.computation.lcm).toBe('11088')
    expect(coprimeTriple.scene.rows).toHaveLength(1)
    expect(() => shushi('2|12')).toThrow('短除法请使用')

    const conversion = shushi('(124)2')
    if (!('mode' in conversion.computation)) throw new Error('应解析为短除法。')
    expect(conversion.computation.mode).toBe('baseConversion')
    if (conversion.computation.mode !== 'baseConversion') throw new Error('应解析为进制转换短除法。')
    expect(conversion.computation.convertedText).toBe('1111100')
  })
})
