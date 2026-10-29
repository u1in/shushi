import type { MacroNode, MacroStyle } from './types'
import { getMacroCall, getPositiveNumber, splitMacroOptions } from './macro-ast'

/**
 * 基础宏只定义网格结构、配置及跨渲染器线条样式；不承担位置快捷写法。
 * 它们是未来高层借位、进位等语法糖最终需要降级到的稳定底座。
 */
export const BASIC_MACRO_NAMES = ['GRID', 'ROW', 'CELL', 'EMPTY', 'LINE', 'STYLE', 'KV'] as const

/** 基础宏中可省略空括号的命令。 */
export const BASIC_ZERO_ARGUMENT_MACROS = new Set(['LINE', 'EMPTY', 'STYLE'])

/** 默认线段只有统一粗细；颜色交给渲染器黑色基线或 GRID(autoColor) 主题。 */
export const DEFAULT_LINE_STYLE: Required<Pick<MacroStyle, 'thickness'>> = { thickness: 2 }

/** 读取 STYLE/CSS 的受限、跨渲染器样式声明。 */
export const readLineStyle = (node: MacroNode): MacroStyle => {
  const call = getMacroCall(node, undefined, BASIC_ZERO_ARGUMENT_MACROS)
  if (!call || (call.name !== 'STYLE' && call.name !== 'CSS')) {
    throw new Error('LINE 的样式必须使用 STYLE(...)。')
  }
  const { content, options } = splitMacroOptions(call.arguments, BASIC_ZERO_ARGUMENT_MACROS)
  if (content.length > 0) throw new Error('STYLE 内只能使用 KV 配置。')
  const style: MacroStyle = {}
  options.forEach((value, key) => {
    if (key === 'color') {
      style.color = value
      return
    }
    if (key === 'thickness') {
      style.thickness = getPositiveNumber(value, '线条 thickness', 1)
      return
    }
    throw new Error(`STYLE 不支持 ${key}，当前仅支持 color 与 thickness。`)
  })
  return style
}

/** LINE 与边框宏共享默认粗细；语义 token 存在时仍可交给业务主题接管颜色。 */
export const resolveLineStyle = (styleNode: MacroNode | undefined, styleToken: string | undefined): MacroStyle => {
  if (!styleNode && styleToken) return {}
  return { ...DEFAULT_LINE_STYLE, ...(styleNode ? readLineStyle(styleNode) : {}) }
}
