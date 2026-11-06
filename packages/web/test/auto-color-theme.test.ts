import { describe, expect, test } from 'vitest'
import {
  AUTO_COLOR_THEME,
  AUTO_COLOR_THEME_FALLBACK,
  compileMacro,
} from '@u1in/shushi-macro'

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

describe('autoColor 固定语义主题', () => {
  test('默认主题直接使用 JavaScript 颜色对象', () => {
    expect(AUTO_COLOR_THEME).toEqual(AUTO_COLOR_THEME_FALLBACK)
  })

  test('fallback 颜色在白底上保持屏幕可读对比度', () => {
    const colors = [
      AUTO_COLOR_THEME_FALLBACK.text,
      AUTO_COLOR_THEME_FALLBACK.carry,
      AUTO_COLOR_THEME_FALLBACK.borrow,
      AUTO_COLOR_THEME_FALLBACK.operator,
      AUTO_COLOR_THEME_FALLBACK.decimal,
      AUTO_COLOR_THEME_FALLBACK.rule.color!,
      AUTO_COLOR_THEME_FALLBACK.bracketRule.color!,
    ]

    colors.forEach((color) => expect(contrastOnWhite(color)).toBeGreaterThanOrEqual(3))
  })

  test('fallback 使用首页的蓝色主轴和低饱和语义色', () => {
    expect(AUTO_COLOR_THEME_FALLBACK).toEqual({
      text: '#d95070',
      carry: '#0b9b86',
      borrow: '#8957c8',
      operator: '#e27624',
      decimal: '#d74783',
      rule: { color: '#7c5366', thickness: 2 },
      bracketRule: { color: '#a84b6b', thickness: 2 },
    })
  })

  test('固定主题不再按行数限制 autoColor', () => {
    const rowCount = 80
    const source = Array.from({ length: rowCount }, (_, index) => `ROW(MM(${index % 10}))`).join(', ')
    expect(() => compileMacro(source)).not.toThrow()
  })
})
