import { describe, expect, test } from 'vitest'
import { AUTO_COLOR_THEME } from '@u1in/shushi-macro'

/** 把 sRGB 通道转换为 WCAG 相对亮度计算所需的线性值。 */
const linearize = (channel: number): number => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const readRgb = (color: string): [number, number, number] => [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)) as [number, number, number]

const contrastOnWhite = (color: string): number => {
  const [red, green, blue] = readRgb(color).map(linearize)
  return 1.05 / (0.2126 * red + 0.7152 * green + 0.0722 * blue + 0.05)
}

/** 以 OKLab 距离衡量两个色在感知上是否足够分开。 */
const toOklab = (color: string): [number, number, number] => {
  const [red, green, blue] = readRgb(color).map(linearize)
  const long = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
  const medium = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
  const short = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue
  const [l, m, s] = [long, medium, short].map((value) => Math.cbrt(value))
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

const deltaE = (first: string, second: string): number => {
  const [l1, a1, b1] = toOklab(first)
  const [l2, a2, b2] = toOklab(second)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

// 展开为 string[]，避免 as const 字面量联合类型限制 includes / 索引比较。
const rowText: string[] = [...AUTO_COLOR_THEME.rowText]
const carry: string[] = [...AUTO_COLOR_THEME.carry]
const borrow: string[] = [...AUTO_COLOR_THEME.borrow]

describe('autoColor 固定主题', () => {
  test('三组各 40 色且互不复用', () => {
    for (const palette of [rowText, carry, borrow]) {
      expect(palette).toHaveLength(40)
      expect(new Set(palette).size).toBe(40)
    }
    expect(rowText.filter((color) => carry.includes(color) || borrow.includes(color))).toEqual([])
    expect(carry.filter((color) => borrow.includes(color))).toEqual([])
  })

  test('正文与进位/借位色在白底上保持屏幕可读对比度', () => {
    for (const palette of [rowText, carry, borrow]) {
      expect(Math.min(...palette.map(contrastOnWhite))).toBeGreaterThanOrEqual(3)
    }
  })

  test('相邻正文行同时靠色相与明度拉开', () => {
    const adjacent = rowText.slice(0, -1).map((color, index) => deltaE(color, rowText[index + 1]))
    expect(Math.min(...adjacent)).toBeGreaterThanOrEqual(0.08)

    const lightness = rowText.map((color) => toOklab(color)[0])
    const lightnessSteps = lightness.slice(0, -1).map((value, index) => Math.abs(value - lightness[index + 1]))
    expect(Math.min(...lightnessSteps)).toBeGreaterThanOrEqual(0.035)
  })

  test('短竖式常用的前 10 行任意两色可区分', () => {
    const distances = rowText.slice(0, 10).flatMap((first, index) => rowText.slice(index + 1, 10).map((second) => deltaE(first, second)))
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(0.05)
  })

  test('运算符、小数点与线条使用可读的独占色', () => {
    const operatorColors = Object.values(AUTO_COLOR_THEME.operators)
    operatorColors.forEach((color) => {
      expect(contrastOnWhite(color)).toBeGreaterThanOrEqual(3)
      expect(rowText).not.toContain(color)
      expect(carry).not.toContain(color)
      expect(borrow).not.toContain(color)
    })
    expect(contrastOnWhite(AUTO_COLOR_THEME.decimal)).toBeGreaterThanOrEqual(3)
    expect(contrastOnWhite(AUTO_COLOR_THEME.rule.color)).toBeGreaterThanOrEqual(3)
    expect(contrastOnWhite(AUTO_COLOR_THEME.bracketRule.color)).toBeGreaterThanOrEqual(3)
  })
})
