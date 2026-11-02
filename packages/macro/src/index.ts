export { compileMacroAst } from './compiler'
export { parseMacro } from './parser'
export { formatMacro, minifyMacro } from './formatter'
export { BASIC_MACRO_NAMES, BASIC_ZERO_ARGUMENT_MACROS, DEFAULT_LINE_STYLE } from './basic-macros'
export { AUTO_COLOR_MAX_ROWS, AUTO_COLOR_THEME } from './auto-color-theme'
export { SUGAR_MACRO_NAMES, SUGAR_ZERO_ARGUMENT_MACROS } from './sugar-macros'
export type { MacroCall, MacroLiteral, MacroNode, MacroStyle, MacroSymbol } from './types'

import { compileMacroAst } from './compiler'
import { parseMacro } from './parser'
import type { GridScene } from '@u1in/shushi-grid'

/** 供网页输入框与未来运算布局共用的一步式宏源码编译入口。 */
export const compileMacro = (source: string): GridScene => compileMacroAst(parseMacro(source))
