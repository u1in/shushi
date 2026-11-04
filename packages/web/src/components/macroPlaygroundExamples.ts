export interface MacroExample {
  label: string
  expression: string
}

/** 示例只保存用户可输入的算式；宏源码统一由输入框触发门户 API 生成。 */
export const arithmeticExamples: MacroExample[] = [
  { label: '356 + 278', expression: '356 + 278' },
  { label: '502 − 137', expression: '502 - 137' },
  { label: '97 × 89', expression: '97 × 89' },
  { label: '10230 ÷ 25', expression: '10230 ÷ 25' },
]
