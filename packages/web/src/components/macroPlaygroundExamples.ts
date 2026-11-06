export interface MacroExample {
  label: string
  expression: string
}

/** 宏调试区首屏展示完整长除法宏信息，便于直接观察除数、商、部分积和余数。 */
export const DEFAULT_MACRO_EXPRESSION = '10230 ÷ 25'

/** 示例只保存用户可输入的算式；宏源码统一由输入框触发门户 API 生成。 */
export const arithmeticExamples: MacroExample[] = [
  { label: '356 + 278', expression: '356 + 278' },
  { label: '502 − 137', expression: '502 - 137' },
  { label: '97 × 89', expression: '97 × 89' },
  { label: '10230 ÷ 25', expression: '10230 ÷ 25' },
]
