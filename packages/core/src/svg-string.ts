import type { GridScene } from '@u1in/shushi-grid'
import { renderSvgString as renderBaseSvgString } from '@u1in/shushi-renderers'
import { createEmbeddedFontStyle, type EmbeddedFontSubset } from './embedded-fonts'

export type SvgFontSubset = EmbeddedFontSubset

export type RenderSvgStringOptions = {
  /** 将场景使用的内置字体以 Base64 @font-face 写入 SVG；默认关闭以保持原有输出体积。 */
  embedFont?: boolean
  /** 内置字体默认使用竖式字符子集；出现未覆盖字符时自动回退完整字体。 */
  fontSubset?: SvgFontSubset
}

/** 把 SVG 字符串导出为可独立打开的文件；可选嵌入场景使用的内置字体。 */
export const renderSvgString = (scene: GridScene, options: RenderSvgStringOptions = {}): string => {
  const svg = renderBaseSvgString(scene)
  if (!options.embedFont) return svg
  const style = createEmbeddedFontStyle(scene, options.fontSubset)
  const openingTagEnd = svg.indexOf('>')
  return style && openingTagEnd >= 0 ? `${svg.slice(0, openingTagEnd + 1)}${style}${svg.slice(openingTagEnd + 1)}` : svg
}
