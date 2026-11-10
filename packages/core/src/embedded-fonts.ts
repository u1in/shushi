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
  fullDataUrl: string
  arithmeticDataUrl: string
}

export type EmbeddedFontSubset = 'arithmetic' | 'full'

/**
 * 自动竖式实际会输出的最小字符集。
 * `−` 是减法竖式使用的数学负号，`·` 是借位提示。短除法的中文 `余` 不在内置数学字体中，
 * 因此会触发完整字体回退，并继续由宿主系统字体处理该字符。
 */
const ARITHMETIC_SUBSET_CHARACTERS = new Set([' ', '.', '+', '-', '−', '×', '÷', '·', ...'0123456789'])

const EMBEDDED_FONT_FACES: EmbeddedFontFace[] = [
  {
    family: 'STIX Two Math',
    fullDataUrl: getFontAsset('stix-two-math-latin-400-normal.woff2'),
    arithmeticDataUrl: getFontAsset('stix-two-math-arithmetic-400-normal.woff2'),
  },
  {
    family: 'CMU Serif',
    fullDataUrl: getFontAsset('cmu-serif-500-roman.woff2'),
    arithmeticDataUrl: getFontAsset('cmu-serif-arithmetic-500-roman.woff2'),
  },
  {
    family: 'Noto Sans Math',
    fullDataUrl: getFontAsset('noto-sans-math-latin-400-normal.woff2'),
    arithmeticDataUrl: getFontAsset('noto-sans-math-arithmetic-400-normal.woff2'),
  },
]

const escapeCssString = (value: string): string => JSON.stringify(value)

const getSceneFontFamilies = (scene: GridScene): Set<string> => {
  const families = new Set<string>(getFontFamilyList(scene.fontFamily ?? 'STIX Two Math'))
  scene.elements.forEach((element) => {
    if (element.content.kind === 'text' && element.content.fontFamily) {
      getFontFamilyList(element.content.fontFamily).forEach((family) => families.add(family))
    }
  })
  return families
}

const getFontFamilyList = (value: string): string[] =>
  value
    .split(',')
    .map((family) => family.trim().replace(/^(['"])(.*)\1$/, '$2'))
    .filter((family) => family.length > 0)

const getSceneTextCharacters = (scene: GridScene): Set<string> => {
  const characters = new Set<string>()
  scene.elements.forEach((element) => {
    if (element.content.kind === 'text')
      Array.from(element.content.text).forEach((character) => characters.add(character))
  })
  return characters
}

const canUseArithmeticSubset = (scene: GridScene): boolean =>
  [...getSceneTextCharacters(scene)].every((character) => ARITHMETIC_SUBSET_CHARACTERS.has(character))

/** 只选择场景实际使用的内置字体，并优先使用自动竖式字符子集。 */
export const createEmbeddedFontStyle = (
  scene: GridScene,
  requestedSubset: EmbeddedFontSubset = 'arithmetic',
): string => {
  const families = getSceneFontFamilies(scene)
  const subset = requestedSubset === 'arithmetic' && canUseArithmeticSubset(scene) ? 'arithmetic' : 'full'
  const faces = EMBEDDED_FONT_FACES.filter(({ family }) => families.has(family))
    .map(
      ({ family, fullDataUrl, arithmeticDataUrl }) =>
        `@font-face{font-family:${escapeCssString(family)};font-style:normal;font-weight:400;src:url(${subset === 'arithmetic' ? arithmeticDataUrl : fullDataUrl}) format('woff2');}`,
    )
    .join('')
  return faces ? `<style>${faces}</style>` : ''
}
