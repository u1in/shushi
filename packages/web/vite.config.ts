import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages 将首页演示站挂在仓库根路径，文档站独立挂在 /doc/ 子路径。
  base: process.env.GITHUB_ACTIONS ? '/shushi/' : '/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    // 测试和开发直接读取统一入口源码，避免依赖先生成 dist；发布包仍使用 dist 导出。
    // CSS 子路径需先精确匹配，不能被 JS 入口别名替换为 index.ts/renderer.css。
    alias: [
      {
        find: /^@u1in\/shushi-core\/renderer\.css$/,
        replacement: fileURLToPath(new URL('../core/src/renderer.css', import.meta.url)),
      },
      {
        find: /^@u1in\/shushi-core\/renderer-without-font\.css$/,
        replacement: fileURLToPath(new URL('../core/src/renderer-without-font.css', import.meta.url)),
      },
      {
        find: '@u1in/shushi-core',
        replacement: fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      },
    ],
  },
})
