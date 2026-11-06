import type { MacroStyle } from './types'

/**
 * autoColor 的固定语义主题。
 *
 * 主题只按图元语义分配颜色，不再按 ROW 预生成 40 组色板。颜色在宏编译阶段
 * 写入 GridScene，因此 DOM、SVG 和 SVG 字符串始终共享同一份确定的视觉配置。
 */
export interface AutoColorTheme {
  /** 普通数字与未分类文字。 */
  text: string
  /** RB(text) 进位提示。 */
  carry: string
  /** MT/MTD 借位提示。 */
  borrow: string
  /** 所有运算符。 */
  operator: string
  /** DOT 与小数点。 */
  decimal: string
  /** 普通横线、边框和短除法分割线。 */
  rule: MacroStyle
  /** BRACKET 厂字弯与厂字横。 */
  bracketRule: MacroStyle
}

/** 内置默认主题，也作为首页颜色编辑器的初始值。 */
export const AUTO_COLOR_THEME_FALLBACK: AutoColorTheme = {
  // 用珊瑚红、薄荷绿、紫罗兰和橙色组成明亮但有层次的课堂色板，
  // 避开首页蓝色界面，同时让每种计算语义都能快速区分。
  text: '#d95070',
  carry: '#0b9b86',
  borrow: '#8957c8',
  operator: '#e27624',
  decimal: '#d74783',
  rule: { color: '#7c5366', thickness: 2 },
  bracketRule: { color: '#a84b6b', thickness: 2 },
}

/** 默认自动配色主题；颜色通过 JavaScript 配置固定写入 GridScene。 */
export const AUTO_COLOR_THEME: AutoColorTheme = {
  text: AUTO_COLOR_THEME_FALLBACK.text,
  carry: AUTO_COLOR_THEME_FALLBACK.carry,
  borrow: AUTO_COLOR_THEME_FALLBACK.borrow,
  operator: AUTO_COLOR_THEME_FALLBACK.operator,
  decimal: AUTO_COLOR_THEME_FALLBACK.decimal,
  rule: { ...AUTO_COLOR_THEME_FALLBACK.rule },
  bracketRule: { ...AUTO_COLOR_THEME_FALLBACK.bracketRule },
}

const OPERATOR_TEXTS = new Set(['+', '-', '−', '×', '*', '÷', '/'])

export const getAutoTextColor = (theme: AutoColorTheme): string => theme.text
export const getAutoCarryColor = (theme: AutoColorTheme): string => theme.carry
export const getAutoBorrowColor = (theme: AutoColorTheme): string => theme.borrow

export const getAutoOperatorColor = (theme: AutoColorTheme, text: string): string | undefined =>
  OPERATOR_TEXTS.has(text) ? theme.operator : undefined
