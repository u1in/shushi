import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    // 测试和开发直接读取统一入口源码，避免依赖先生成 dist；发布包仍使用 dist 导出。
    alias: {
      '@vertical-arithmetic/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
})
