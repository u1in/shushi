import { defineConfig, type Plugin } from 'vite'
import { readdirSync, readFileSync } from 'node:fs'

const rendererStyle = readFileSync(new URL('../renderers/src/style.css', import.meta.url), 'utf8')
const stixTwoMathStyle = readFileSync(new URL('../fonts/src/fonts/stix-two-math.css', import.meta.url), 'utf8')
  // 字体 CSS 原本位于 fonts/ 目录；拼入 dist/renderer.css 后需保留正确的发布相对路径。
  .replaceAll("url('./", "url('./fonts/")
const fontStyleNames = ['cmu-serif', 'stix-two-math', 'noto-sans-math'] as const
const sharedFontImports = fontStyleNames
  .map(name => `@import './fonts/${name}.css';`)
  .join('\n')
const sharedFontDirectory = new URL('../fonts/src/fonts/', import.meta.url)
const logoSvg = readFileSync(new URL('./assets/shushi-logo.svg', import.meta.url), 'utf8')
const logoDarkSvg = readFileSync(new URL('./assets/shushi-logo-dark.svg', import.meta.url), 'utf8')

/**
 * 核心包发布时只构建一个 JS 入口，但渲染器 CSS 也必须作为稳定的子路径产物发布。
 * 通过构建钩子复制唯一的渲染器样式源，避免 core 与 renderers 各自维护一份 CSS。
 */
const rendererStyleAsset: Plugin = {
  name: 'emit-renderer-style',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'renderer.css',
      // 默认入口自带 STIX Two Math，普通用户只需导入一个 CSS 文件。
      source: `${stixTwoMathStyle}\n\n${rendererStyle}`,
    })
    this.emitFile({
      type: 'asset',
      fileName: 'renderer-without-font.css',
      // 自定义字体时使用此入口，避免默认字体进入最终产物。
      source: rendererStyle,
    })
    this.emitFile({
      type: 'asset',
      fileName: 'fonts.css',
      source: sharedFontImports,
    })
    this.emitFile({
      type: 'asset',
      fileName: 'logo.svg',
      source: logoSvg,
    })
    this.emitFile({
      type: 'asset',
      fileName: 'logo-dark.svg',
      source: logoDarkSvg,
    })

    readdirSync(sharedFontDirectory, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .forEach((entry) => {
        this.emitFile({
          type: 'asset',
          fileName: `fonts/${entry.name}`,
          source: readFileSync(new URL(entry.name, sharedFontDirectory)),
        })
      })
  },
}

export default defineConfig({
  plugins: [rendererStyleAsset],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
  },
})
