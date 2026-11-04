import { describe, expect, it } from 'vitest'
import {
  shushi,
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
  it('用一个判别入口覆盖加减乘与长除法', () => {
    const addition = shushi({ operation: 'addition', values: ['356', '278'] })
    expect(addition.computation.sumDigits).toBe('634')
    expectPortalResult(addition)

    const subtraction = shushi({ operation: 'subtraction', operands: ['502', '137'] })
    expect(subtraction.computation.differenceDigits).toBe('365')
    // 单项减法保持教学页面的默认：默认显示借位；组合模式另有自己的默认值。
    expect(subtraction.source).toContain('MTD(')
    expectPortalResult(subtraction)

    const multiplication = shushi({ operation: 'multiplication', operands: ['97', '89'] })
    expect(multiplication.computation.productDigits).toBe('8633')
    expectPortalResult(multiplication)

    const division = shushi({
      operation: 'division',
      divisor: '25',
      dividend: '10230',
      calculation: { resultMode: 'decimal' },
    })
    expect(division.computation.quotientText).toBe('409.2')
    expectPortalResult(division)
  })

  it('覆盖短除、组合表达式及专项设置覆盖', () => {
    const shortDivision = shushi({
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

    const composite = shushi({ operation: 'composite', expression: '502 - 137 + 5' })
    expect(composite.computation.resultDigits).toBe('370')
    // 组合竖式默认关闭借位，调用方仍可通过 settings 显式开启。
    expect(composite.source).not.toContain('MTD(')
    expectPortalResult(composite)
  })

  it('默认返回 SSR 安全的 SVG 字符串，并提供可注入的 AST 检查器', () => {
    const result = shushi({ operation: 'addition', values: ['2', '3'] })

    expect(typeof result.rendered).toBe('string')
    expect(result.rendered).toMatch(/^<svg/)
    expect(result.inspection.scene).toEqual(result.scene)
    expect(Object.keys(result.inspection.references).length).toBeGreaterThan(0)
  })

  it('客户端 DOM 渲染模式在服务端环境中明确拒绝执行', () => {
    expect(() => shushi({
      operation: 'addition',
      values: ['2', '3'],
      renderMode: 'div',
    })).toThrow('需要客户端 DOM 环境')

    expect(() => shushi({
      operation: 'addition',
      values: ['2', '3'],
      renderMode: 'svg',
    })).toThrow('需要客户端 DOM 环境')
  })

  it('svg-string 模式不允许传入客户端挂载点', () => {
    expect(() => shushi({
      operation: 'addition',
      values: ['2', '3'],
      renderMode: 'svg-string',
      el: {} as never,
    })).toThrow('不能传入 el')
  })
})
