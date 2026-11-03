import { describe, expect, it } from 'vitest'
import {
  computeAddition,
  computeDivision,
  computeMultiplication,
  computeShortDivision,
  computeSubtraction,
} from '@u1in/shushi-calculators'
import {
  createAdditionGridScene,
  createAdditionMacroSource,
  createDivisionGridScene,
  createDivisionMacroSource,
  createMultiplicationGridScene,
  createMultiplicationMacroSource,
  createShortDivisionGridScene,
  createShortDivisionMacroSource,
  createSubtractionGridScene,
  createSubtractionMacroSource,
} from '@u1in/shushi-layout'
import type { GridScene } from '@u1in/shushi-grid'
import { compileMacro, formatMacro, parseMacro } from '@u1in/shushi-macro'

/** 自动竖式必须先成为人工可输入的源码，再走同一解析与编译链路。 */
const expectHumanReproducible = (source: string, scene: unknown): void => {
  expect(source).toMatch(/^GRID\(/)
  expect(() => parseMacro(source)).not.toThrow()
  expect(compileMacro(source)).toEqual(scene)
  expect(compileMacro(formatMacro(source))).toEqual(scene)
}

/** 计算器宏必须把最终颜色写进 GridScene，两个渲染器才能消费同一份颜色数据。 */
const expectAutoColorScene = (source: string, scene: GridScene): void => {
  expect(source).toContain('KV(autoColor, true)')
  expect(scene.elements.some(({ content }) => content.color !== undefined)).toBe(true)
}

describe('计算器宏源码布局', () => {
  it('加法、减法和乘法不直接构造 GridScene', () => {
    const addition = computeAddition('356', '278')
    const additionSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showCarrySteps: true }
    const additionSource = createAdditionMacroSource(addition, additionSettings)
    expect(additionSource).toContain('RB(')
    const additionScene = createAdditionGridScene(addition, additionSettings)
    expectAutoColorScene(additionSource, additionScene)
    expectHumanReproducible(additionSource, additionScene)

    const subtraction = computeSubtraction('502', '137')
    const subtractionSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showBorrowSteps: true }
    const subtractionSource = createSubtractionMacroSource(subtraction, subtractionSettings)
    expect(subtractionSource).toContain('MTD(')
    const subtractionScene = createSubtractionGridScene(subtraction, subtractionSettings)
    expectAutoColorScene(subtractionSource, subtractionScene)
    expectHumanReproducible(subtractionSource, subtractionScene)

    const multiplication = computeMultiplication('97', '89')
    const multiplicationSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, uniformMultiplicationBars: false, showCarrySteps: true }
    const multiplicationSource = createMultiplicationMacroSource(multiplication, multiplicationSettings)
    expect(multiplicationSource).toContain('LINE(')
    const multiplicationScene = createMultiplicationGridScene(multiplication, multiplicationSettings)
    expectAutoColorScene(multiplicationSource, multiplicationScene)
    expectHumanReproducible(multiplicationSource, multiplicationScene)
  })

  it('长除与短除连同播放快照都由公开宏命令复刻', () => {
    const division = computeDivision('25', '10230', { resultMode: 'decimal' })
    const divisionSettings = {
      cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      bracketBend: 1, uniformSubtractionBars: false, showZeroQuotientSteps: false, visibleStepCount: 3,
    }
    const divisionSource = createDivisionMacroSource(division, divisionSettings)
    expect(divisionSource).toContain('BRACKET')
    const divisionScene = createDivisionGridScene(division, divisionSettings)
    expectAutoColorScene(divisionSource, divisionScene)
    expectHumanReproducible(divisionSource, divisionScene)

    const shortDivision = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
    const shortDivisionSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showRemainders: true, visibleStepCount: 2 }
    const shortDivisionSource = createShortDivisionMacroSource(shortDivision, shortDivisionSettings)
    expect(shortDivisionSource).toContain('DIV')
    expect(shortDivisionSource).toContain('VALUE')
    const shortDivisionScene = createShortDivisionGridScene(shortDivision, shortDivisionSettings)
    expectAutoColorScene(shortDivisionSource, shortDivisionScene)
    expectHumanReproducible(shortDivisionSource, shortDivisionScene)
  })
})
