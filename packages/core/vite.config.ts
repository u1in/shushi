import { defineConfig, type Plugin } from 'vite'
import { readFileSync } from 'node:fs'

/**
 * 核心包发布时只构建一个 JS 入口，但渲染器 CSS 也必须作为稳定的子路径产物发布。
 * 通过构建钩子复制唯一的渲染器样式源，避免 core 与 renderers 各自维护一份 CSS。
 */
const rendererStyleAsset: Plugin = {
  name: 'emit-renderer-style',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'style.css',
      source: readFileSync(new URL('../renderers/src/style.css', import.meta.url), 'utf8'),
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
