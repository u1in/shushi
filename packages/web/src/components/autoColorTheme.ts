/** 首页颜色编辑器使用的纯颜色值；线宽保持宏自动配色的默认值。 */
export type AutoColorThemeColorValues = {
  text: string
  carry: string
  borrow: string
  operator: string
  decimal: string
  rule: string
  bracketRule: string
}

type FormatAutoColorThemeOptions = {
  indent?: string
  prefix?: string
  trailingComma?: boolean
}

const quoteString = (value: string): string => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

/** 将颜色方案格式化为可直接粘贴进 shushi API 的 JavaScript 对象。 */
export const formatAutoColorThemeObject = (
  theme: AutoColorThemeColorValues,
  { indent = '', prefix = '', trailingComma = false }: FormatAutoColorThemeOptions = {},
): string => {
  const comma = trailingComma ? ',' : ''
  return [
    `${indent}${prefix}{`,
    `${indent}  text: ${quoteString(theme.text)},`,
    `${indent}  carry: ${quoteString(theme.carry)},`,
    `${indent}  borrow: ${quoteString(theme.borrow)},`,
    `${indent}  operator: ${quoteString(theme.operator)},`,
    `${indent}  decimal: ${quoteString(theme.decimal)},`,
    `${indent}  rule: { color: ${quoteString(theme.rule)}, thickness: 2 },`,
    `${indent}  bracketRule: { color: ${quoteString(theme.bracketRule)}, thickness: 2 },`,
    `${indent}}${comma}`,
  ].join('\n')
}
