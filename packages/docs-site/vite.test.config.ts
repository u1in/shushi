import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/** 文档站测试需要解析宏文档展示组件中的 Vue 单文件组件。 */
export default defineConfig({
  plugins: [vue()],
})
