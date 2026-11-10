import type { GridScene } from '@u1in/shushi-grid'
import { compileMacro } from '@u1in/shushi-macro'
import type { MacroCompileOptions } from '@u1in/shushi-macro'
import type { GridRenderSettings } from './types'

/**
 * 计算器自动排版也必须产出用户可输入的宏源码。
 * 此处只封装稳定的宏文本片段；每个运算模块仍负责把自己的计算过程翻译为这些片段。
 */
export const macroLiteral = (value: string): string => JSON.stringify(value)

export const macroOption = (key: string, value: string | number | boolean): string =>
  `KV(${key}, ${typeof value === 'string' ? macroLiteral(value) : String(value)})`

export const macroTextCell = (text: string, styleToken: string, annotations: string[] = []): string =>
  `CELL(MM(${macroLiteral(text)}, ${macroOption('style', styleToken)})${annotations.length ? `, ${annotations.join(', ')}` : ''})`

export const macroEmptyCell = (): string => 'EMPTY()'

export const macroAnnotationCell = (annotation: string): string => `CELL(${annotation})`

/** 只在完整的小数结果末尾仍为 0 时标记一个可省略的结果零。 */
export const shouldStrikeMinimalDecimalResult = (
  value: string,
  decimalPlaces: number,
  enabled: boolean | undefined,
  isComplete: boolean,
): boolean => enabled === true && isComplete && decimalPlaces > 0 && value.endsWith('0')

export const macroRightBottom = (text: string, styleToken: string): string =>
  `RB(${macroLiteral(text)}, ${macroOption('style', styleToken)})`

/** 乘法进位默认放在目标数字右上角。 */
export const macroRightTop = (text: string, styleToken: string): string =>
  `RT(${macroLiteral(text)}, ${macroOption('style', styleToken)})`

export const macroBorrowDot = (styleToken: string): string => `MTD(${macroOption('style', styleToken)})`

export const macroRow = (cells: string[], align: 'left' | 'right' = 'right'): string =>
  `ROW(${cells.join(', ')}${align === 'right' ? '' : `, ${macroOption('align', align)}`})`

export const macroLine = (
  styleToken: string,
  span: 'previous' | 'adjacent' | 'longest' | 'full' = 'adjacent',
): string => `LINE(${macroOption('span', span)}, ${macroOption('style', styleToken)})`

/** 只把可复现布局所需的场景参数写入宏源码，外观主题由重新编译时的调用方决定。 */
export const macroGrid = (columns: number, settings: GridRenderSettings, children: string[]): string => {
  const options = [
    macroOption('columns', columns),
    macroOption('unitWidth', settings.cellWidth),
    macroOption('unitHeight', settings.rowHeight),
    macroOption('fontSizeRatio', settings.fontSizeRatio),
    macroOption('paddingX', 20),
    macroOption('paddingY', 12),
    macroOption('showGrid', settings.showGuideGrid),
  ]
  return `GRID(${[...options, ...children].join(', ')})`
}

/** 自动竖式与人工输入刻意共用 parse + compile 的公共入口。 */
export const compileCalculatorMacro = (source: string, options?: MacroCompileOptions): GridScene =>
  compileMacro(source, options)
