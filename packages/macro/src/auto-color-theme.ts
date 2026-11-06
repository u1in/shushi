import type { MacroStyle } from './types'

/**
 * autoColor 的固定语义主题。
 *
 * 主题只按图元语义分配颜色，不再按 ROW 预生成 40 组色板；颜色值既可以是
 * 普通 CSS 颜色，也可以是带 fallback 的 CSS 变量引用，因此 DOM、SVG 和 SSR
 * 仍然共享同一份 GridScene，同时允许宿主通过 CSS 即时切换主题。
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

/** 首页和外部宿主可以直接覆盖的 CSS 自定义属性名。 */
export const AUTO_COLOR_THEME_VARIABLES = {
  text: '--shushi-auto-text',
  carry: '--shushi-auto-carry',
  borrow: '--shushi-auto-borrow',
  operator: '--shushi-auto-operator',
  decimal: '--shushi-auto-decimal',
  rule: '--shushi-auto-rule',
  bracketRule: '--shushi-auto-bracket-rule',
} as const

/** 不依赖 CSS 变量时使用的默认 fallback；也作为首页颜色编辑器的初始值。 */
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

const cssVariable = (name: string, fallback: string): string => `var(${name}, ${fallback})`

/** 默认主题使用 CSS 变量，并保留与首页浅色主题一致的 fallback。 */
export const AUTO_COLOR_THEME: AutoColorTheme = {
  text: cssVariable(AUTO_COLOR_THEME_VARIABLES.text, AUTO_COLOR_THEME_FALLBACK.text),
  carry: cssVariable(AUTO_COLOR_THEME_VARIABLES.carry, AUTO_COLOR_THEME_FALLBACK.carry),
  borrow: cssVariable(AUTO_COLOR_THEME_VARIABLES.borrow, AUTO_COLOR_THEME_FALLBACK.borrow),
  operator: cssVariable(AUTO_COLOR_THEME_VARIABLES.operator, AUTO_COLOR_THEME_FALLBACK.operator),
  decimal: cssVariable(AUTO_COLOR_THEME_VARIABLES.decimal, AUTO_COLOR_THEME_FALLBACK.decimal),
  rule: {
    color: cssVariable(AUTO_COLOR_THEME_VARIABLES.rule, AUTO_COLOR_THEME_FALLBACK.rule.color!),
    thickness: AUTO_COLOR_THEME_FALLBACK.rule.thickness,
  },
  bracketRule: {
    color: cssVariable(AUTO_COLOR_THEME_VARIABLES.bracketRule, AUTO_COLOR_THEME_FALLBACK.bracketRule.color!),
    thickness: AUTO_COLOR_THEME_FALLBACK.bracketRule.thickness,
  },
}

const OPERATOR_TEXTS = new Set(['+', '-', '−', '×', '*', '÷', '/'])

export const getAutoTextColor = (theme: AutoColorTheme): string => theme.text
export const getAutoCarryColor = (theme: AutoColorTheme): string => theme.carry
export const getAutoBorrowColor = (theme: AutoColorTheme): string => theme.borrow

export const getAutoOperatorColor = (theme: AutoColorTheme, text: string): string | undefined => (
  OPERATOR_TEXTS.has(text) ? theme.operator : undefined
)
