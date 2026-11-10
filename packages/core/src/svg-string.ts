import type { GridScene } from '@u1in/shushi-grid'
import { renderSvgString as renderBaseSvgString } from '@u1in/shushi-renderers'
import { createEmbeddedFontStyle } from './embedded-fonts'

export type RenderSvgStringOptions = {
  /** 将场景使用的内置字体以 Base64 @font-face 写入 SVG；默认关闭以保持原有输出体积。 */
  embedFont?: boolean
}

/** 把 SVG 字符串导出为可独立打开的文件；可选嵌入场景使用的内置字体。 */
export const renderSvgString = (scene: GridScene, options: RenderSvgStringOptions = {}): string => {
  const svg = renderBaseSvgString(scene)
  if (!options.embedFont) return svg
  const style = createEmbeddedFontStyle(scene)
  const openingTagEnd = svg.indexOf('>')
  return style && openingTagEnd >= 0 ? `${svg.slice(0, openingTagEnd + 1)}${style}${svg.slice(openingTagEnd + 1)}` : svg
}
