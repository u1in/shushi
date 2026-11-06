/** 首页演示中实际随构建产物提供的字体选项，值可直接传给公开 API。 */
export type RendererFontFamily = 'CMU Serif' | 'STIX Two Math' | 'Noto Sans Math'

export type RendererFontOption = {
  label: string
  value: RendererFontFamily
}

export const rendererFontOptions: RendererFontOption[] = [
  { label: 'STIX Two Math', value: 'STIX Two Math' },
  { label: 'Computer Modern', value: 'CMU Serif' },
  { label: 'Noto Sans Math', value: 'Noto Sans Math' },
]

export const DEFAULT_RENDERER_FONT: RendererFontFamily = 'STIX Two Math'

const extraRendererFontCssPath: Partial<Record<RendererFontFamily, string>> = {
  'CMU Serif': '@u1in/shushi-core/fonts/cmu-serif.css',
  'Noto Sans Math': '@u1in/shushi-core/fonts/noto-sans-math.css',
}

/** 默认字体由 renderer.css 内置；改用其他内置字体时避免同时打包 STIX。 */
export const getRendererStyleCssPath = (fontFamily: RendererFontFamily): string =>
  fontFamily === DEFAULT_RENDERER_FONT
    ? '@u1in/shushi-core/renderer.css'
    : '@u1in/shushi-core/renderer-without-font.css'

/** 只有非默认字体才需要额外导入字体资源。 */
export const getRendererFontCssPath = (fontFamily: RendererFontFamily): string | undefined =>
  extraRendererFontCssPath[fontFamily]

/** Font Loading API 的字体简写需要对包含空格的字体名称显式加引号。 */
export const getRendererFontFace = (fontFamily: RendererFontFamily): string => `400 27px "${fontFamily}"`
