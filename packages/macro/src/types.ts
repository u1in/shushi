/** 宏语言的语法树只描述源码结构，不包含任何渲染器或运算规则。 */
export interface MacroCall {
  kind: 'call'
  name: string
  arguments: MacroNode[]
}

export interface MacroLiteral {
  kind: 'literal'
  value: string
}

/** 无括号的保留常量，例如 DOT 与 previous。 */
export interface MacroSymbol {
  kind: 'symbol'
  name: string
}

export type MacroNode = MacroCall | MacroLiteral | MacroSymbol

export interface MacroStyle {
  color?: string
  thickness?: number
}
