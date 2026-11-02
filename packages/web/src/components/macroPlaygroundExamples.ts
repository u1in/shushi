import { formatMacro } from '@vertical-arithmetic/macro'

export interface MacroExample {
  label: string
  source: string
}

/** 与主页下方四则运算器的默认题目对应；GRID 默认启用自动配色，因此无需额外配置。 */
export const arithmeticExamples: MacroExample[] = [
  {
    label: '356 + 278 = 634',
    source: '3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;',
  },
  {
    label: '502 − 137 = 365',
    source: '[5,MTD],[0,MTD],2;−,1,3,7;LN;3,6,5;',
  },
  {
    label: '97 × 89 = 8633',
    source: '9,7;×,EP,[8,RB(6)],9;LN;8,7,3;[7,RB(1)],[7,RB(1)],[6,LT(5)],EP;LN;8,6,3,3;',
  },
  {
    label: '10230 ÷ 25 = 409.2',
    source: '4,0,[9,DOT],2;2,5,BK,1,0,2,3,[0,DOT],0;1,0,0,EP,EP,EP;LN;2,3,0,EP;2,2,5,EP;LN;5,0;5,0;LN;0;',
  },
  {
    label: '短除法 · 60 = 2 × 2 × 3 × 5',
    source: '2,DIV,VALUE(60);2,DIV,VALUE(30);3,DIV,VALUE(15);VALUE(5);',
  },
  {
    label: '最大公约数 · 60 与 84',
    source: '2,DIV,VALUE(60),VALUE(84);2,DIV,VALUE(30),VALUE(42);3,DIV,VALUE(15),VALUE(21);VALUE(5),VALUE(7);',
  },
]

/**
 * 首页示例在编写时保持紧凑，载入时再统一格式化。
 * 这样示例维护只需保留一份紧凑源码；格式化失败时退回原串，保证示例按钮始终可用。
 */
export const formatExampleSource = (source: string): string => {
  try {
    return formatMacro(source)
  } catch {
    return source
  }
}
