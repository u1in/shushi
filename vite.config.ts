import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: resolve(projectRoot, 'index.html'),
        elementNamingMap: resolve(projectRoot, 'docs/vertical-division-elements.html'),
      },
    },
  },
})
