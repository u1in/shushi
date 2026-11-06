/** 录入别名只在源码边界转换，后续 AST 与编译器始终使用完整的稳定宏名。 */
const INPUT_MACRO_ALIASES: Readonly<Record<string, string>> = {
  EMP: 'EMPTY',
  LN: 'LINE',
  BRKT: 'BRACKET',
  SQ: 'SQUARE',
  TRI: 'TRIANGLE',
  RND: 'ROUND',
}

const SHORTEST_MACRO_NAMES: Readonly<Record<string, string>> = {
  EMPTY: 'EMP',
  LINE: 'LN',
  BRACKET: 'BRKT',
  SQUARE: 'SQ',
  TRIANGLE: 'TRI',
  ROUND: 'RND',
}

/** 将用户输入的快捷别名归一化为内部宏名。 */
export const getCanonicalMacroName = (name: string): string => INPUT_MACRO_ALIASES[name] ?? name

/** 格式化和示例统一采用可读的最短合法宏名。 */
export const getShortestMacroName = (name: string): string => SHORTEST_MACRO_NAMES[name] ?? name
