import type { GridScene } from '@u1in/shushi-grid'

type ImportMetaWithGlob = ImportMeta & {
  glob<T = unknown>(
    pattern: string | string[],
    options?: { eager?: boolean; import?: string; query?: string },
  ): Record<string, T>
}

const fontAssets = (import.meta as ImportMetaWithGlob).glob<string>('../../fonts/src/fonts/*.woff2', {
  eager: true,
  import: 'default',
  query: '?inline',
})

const getFontAsset = (fileName: string): string => {
  const asset = fontAssets[`../../fonts/src/fonts/${fileName}`]
  if (!asset) throw new Error(`缺少内置字体资源: ${fileName}`)
  return asset
}

type EmbeddedFontFace = {
  family: string
  weight: number
  dataUrl: string
}

const EMBEDDED_FONT_FACES: EmbeddedFontFace[] = [
  { family: 'STIX Two Math', weight: 400, dataUrl: getFontAsset('stix-two-math-latin-400-normal.woff2') },
  { family: 'CMU Serif', weight: 500, dataUrl: getFontAsset('cmu-serif-500-roman.woff2') },
  { family: 'CMU Serif', weight: 700, dataUrl: getFontAsset('cmu-serif-700-roman.woff2') },
  { family: 'Noto Sans Math', weight: 400, dataUrl: getFontAsset('noto-sans-math-latin-400-normal.woff2') },
]

const escapeCssString = (value: string): string => JSON.stringify(value)

const getSceneFontFamilies = (scene: GridScene): Set<string> => {
  const families = new Set<string>([scene.fontFamily ?? 'STIX Two Math'])
  scene.elements.forEach((element) => {
    if (element.content.kind === 'text' && element.content.fontFamily) families.add(element.content.fontFamily)
  })
  return families
}

/** 只选择场景实际使用的内置字体，避免把无关字体打进导出 SVG。 */
export const createEmbeddedFontStyle = (scene: GridScene): string => {
  const families = getSceneFontFamilies(scene)
  const faces = EMBEDDED_FONT_FACES.filter(({ family }) => families.has(family))
    .map(
      ({ family, weight, dataUrl }) =>
        `@font-face{font-family:${escapeCssString(family)};font-style:normal;font-weight:${weight};src:url(${dataUrl}) format('woff2');}`,
    )
    .join('')
  return faces ? `<style>${faces}</style>` : ''
}
