import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/** 文档包测试需要解析其公开入口导出的 Vue 页面组件。 */
export default defineConfig({
  plugins: [vue()],
})
