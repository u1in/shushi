export { compileMacroAst } from './compiler'
export type { MacroCompileOptions } from './compiler'
export { parseMacro } from './parser'
export {
  completeMacro,
  formatMacro,
  minifyMacro,
  minifyMacroAst,
  minifyMacroForCopy,
  minifyMacroForCopyAst,
  unformatMacro,
} from './formatter'
export { createMacroAstInspection } from './ast-inspector'
export type { MacroAstInspection, MacroElementAstReference, MacroNodePath, MacroSourceStyle } from './ast-inspector'
export { BASIC_MACRO_NAMES, BASIC_ZERO_ARGUMENT_MACROS, DEFAULT_LINE_STYLE } from './basic-macros'
export {
  AUTO_COLOR_THEME,
  AUTO_COLOR_THEME_FALLBACK,
  AUTO_COLOR_THEME_VARIABLES,
} from './auto-color-theme'
export type { AutoColorTheme } from './auto-color-theme'
export { SUGAR_MACRO_NAMES, SUGAR_ZERO_ARGUMENT_MACROS } from './sugar-macros'
export type { MacroCall, MacroLiteral, MacroNode, MacroStyle, MacroSymbol } from './types'

import { compileMacroAst } from './compiler'
import type { MacroCompileOptions } from './compiler'
import { parseMacro } from './parser'
import type { GridScene } from '@u1in/shushi-grid'

/** 供网页输入框与未来运算布局共用的一步式宏源码编译入口。 */
export const compileMacro = (source: string, options?: MacroCompileOptions): GridScene => compileMacroAst(parseMacro(source), options)
