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
import type { GridScene, GridTextContent } from '@u1in/shushi-grid'
import { compileMacro, formatMacro, minifyMacroForCopy, parseMacro } from '@u1in/shushi-macro'

/** 自动竖式必须先成为人工可输入的源码，再走同一解析与编译链路。 */
const expectHumanReproducible = (source: string, scene: unknown): void => {
  expect(source).toMatch(/^GRID\(/)
  expect(() => parseMacro(source)).not.toThrow()
  expect(compileMacro(source)).toEqual(scene)
  expect(compileMacro(formatMacro(source))).toEqual(scene)
}

/** 复制按钮调用正式 API 移除网页专属信息；宏调试应保持同一份可见网格和图元。 */
const expectCopiedMacroReproducible = (source: string, scene: GridScene): void => {
  const copiedSource = minifyMacroForCopy(source)
  expect(copiedSource).not.toBe('')
  expect(copiedSource).not.toContain('ariaLabel')
  expect(copiedSource).not.toContain('KV(style')
  expect(() => parseMacro(copiedSource)).not.toThrow()
  const toVisibleElements = (value: GridScene) => value.elements.map(({ position, content }) => ({
    position,
    content: content.kind === 'text' ? (({ styleToken: _, ...visibleContent }) => visibleContent)(content) : content,
  }))
  expect(toVisibleElements(compileMacro(copiedSource))).toEqual(
    toVisibleElements(scene),
  )
}

/** 计算器宏必须把最终颜色写进 GridScene，两个渲染器才能消费同一份颜色数据。 */
const expectAutoColorScene = (source: string, scene: GridScene): void => {
  expect(source).toContain('KV(autoColor, true)')
  expect(scene.elements.some(({ content }) => content.color !== undefined)).toBe(true)
}

describe('计算器宏源码布局', () => {
  it('两个乘数的末尾零均从基础过程移出，并在最终积右侧合并补回', () => {
    const multiplication = computeMultiplication('1230', '200')
    const settings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, uniformMultiplicationBars: false, showCarrySteps: true }
    const source = createMultiplicationMacroSource(multiplication, settings)
    const scene = createMultiplicationGridScene(multiplication, settings)
    const shortcut = multiplication.trailingZeroShortcut
    if (!shortcut) throw new Error('1230 × 200 应启用末尾零快捷计算。')

    expect(multiplication).toMatchObject({
      multiplicandDigits: '1230',
      multiplierDigits: '200',
      operandsSwapped: false,
      productDigits: '246000',
    })
    expect(shortcut).toEqual({
      significantMultiplicandDigits: '123',
      multiplicandTrailingZeroCount: 1,
      significantMultiplierDigits: '2',
      multiplierTrailingZeroCount: 2,
      trailingZeroCount: 3,
    })
    expect(multiplication.partialProducts.map(({ value }) => value)).toEqual(['246'])
    expectHumanReproducible(source, scene)

    const findColumn = (styleToken: string, text: string, occurrence = 0): number => {
      const matchingElements = scene.elements.filter((element): element is typeof element & { content: GridTextContent } => (
        element.content.kind === 'text'
        && element.content.styleToken === styleToken
        && element.content.text === text
      ))
      const element = matchingElements[occurrence]
      if (!element || element.position.kind !== 'cell') throw new Error(`未找到 ${styleToken} 的数字 ${text}。`)
      return element.position.column
    }

    const baseOnesColumn = findColumn('multiplication.multiplicand', '3')
    expect(findColumn('multiplication.multiplier', '2')).toBe(baseOnesColumn)
    expect(findColumn('multiplication.multiplicand', '0')).toBe(baseOnesColumn + 1)
    expect(findColumn('multiplication.multiplier', '0')).toBe(baseOnesColumn + 1)
    expect(findColumn('multiplication.multiplier', '0', 1)).toBe(baseOnesColumn + 2)
    expect(findColumn('multiplication.product', '6')).toBe(baseOnesColumn)
    expect(findColumn('multiplication.product', '0')).toBe(baseOnesColumn + 1)
    expect(findColumn('multiplication.product', '0', 2)).toBe(baseOnesColumn + 3)
  })

  it('乘法竖式严格保留用户输入的上下行顺序', () => {
    const multiplication = computeMultiplication('24', '10')

    expect(multiplication).toMatchObject({
      multiplicandDigits: '24',
      multiplierDigits: '10',
      operandsSwapped: false,
      productDigits: '240',
    })
  })

  it('普通乘法也保留小数在上的用户输入顺序', () => {
    const multiplication = computeMultiplication('24', '97')

    expect(multiplication).toMatchObject({
      multiplicandDigits: '24',
      multiplierDigits: '97',
      operandsSwapped: false,
      productDigits: '2328',
    })
    expect(multiplication.partialProducts.map(({ value, shift }) => [value, shift])).toEqual([
      ['168', 0],
      ['216', 1],
    ])
  })

  it('加法、减法和乘法不直接构造 GridScene', () => {
    const addition = computeAddition('356', '278')
    const additionSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showCarrySteps: true }
    const additionSource = createAdditionMacroSource(addition, additionSettings)
    expect(additionSource).toContain('RB(')
    const additionScene = createAdditionGridScene(addition, additionSettings)
    expectAutoColorScene(additionSource, additionScene)
    expectHumanReproducible(additionSource, additionScene)
    expectCopiedMacroReproducible(additionSource, additionScene)

    const subtraction = computeSubtraction('502', '137')
    const subtractionSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showBorrowSteps: true }
    const subtractionSource = createSubtractionMacroSource(subtraction, subtractionSettings)
    expect(subtractionSource).toContain('MTD(')
    const subtractionScene = createSubtractionGridScene(subtraction, subtractionSettings)
    expectAutoColorScene(subtractionSource, subtractionScene)
    expectHumanReproducible(subtractionSource, subtractionScene)
    expectCopiedMacroReproducible(subtractionSource, subtractionScene)

    const multiplication = computeMultiplication('97', '89')
    const multiplicationSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, uniformMultiplicationBars: false, showCarrySteps: true }
    const multiplicationSource = createMultiplicationMacroSource(multiplication, multiplicationSettings)
    expect(multiplicationSource).toContain('LINE(')
    const multiplicationScene = createMultiplicationGridScene(multiplication, multiplicationSettings)
    expectAutoColorScene(multiplicationSource, multiplicationScene)
    expectHumanReproducible(multiplicationSource, multiplicationScene)
    expectCopiedMacroReproducible(multiplicationSource, multiplicationScene)
  })

  it('长除与短除连同播放快照都由公开宏命令复刻', () => {
    const division = computeDivision('25', '10230', { maxDecimalDigits: 4 })
    const divisionSettings = {
      cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false,
      bracketBend: 1, uniformSubtractionBars: false, showZeroQuotientSteps: false, visibleStepCount: 3,
    }
    const divisionSource = createDivisionMacroSource(division, divisionSettings)
    expect(divisionSource).toContain('BRACKET')
    const divisionScene = createDivisionGridScene(division, divisionSettings)
    expectAutoColorScene(divisionSource, divisionScene)
    expectHumanReproducible(divisionSource, divisionScene)
    expectCopiedMacroReproducible(divisionSource, divisionScene)

    const shortDivision = computeShortDivision({ mode: 'baseConversion', values: ['13'], targetBase: 2 })
    const shortDivisionSettings = { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showRemainders: true, visibleStepCount: 2 }
    const shortDivisionSource = createShortDivisionMacroSource(shortDivision, shortDivisionSettings)
    expect(shortDivisionSource).toContain('DIV')
    expect(shortDivisionSource).toContain('VALUE')
    const shortDivisionScene = createShortDivisionGridScene(shortDivision, shortDivisionSettings)
    expectAutoColorScene(shortDivisionSource, shortDivisionScene)
    expectHumanReproducible(shortDivisionSource, shortDivisionScene)
    expectCopiedMacroReproducible(shortDivisionSource, shortDivisionScene)
  })
})
