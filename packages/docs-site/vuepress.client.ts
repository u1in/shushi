import { defineClientConfig } from 'vuepress/client'
import MacroDocCatalog from './src/components/MacroDocCatalog.vue'
import GalleryDocPage from './src/components/GalleryDocPage.vue'
import DocsHomeExperience from './src/components/DocsHomeExperience.vue'
import '@u1in/shushi-core/style.css'
import '@u1in/shushi-macro-docs/style.css'
import './src/styles/index.css'

/** VuePress v2 不再自动注册 .vuepress/components，显式注册交互宏文档组件。 */
export default defineClientConfig({
  enhance({ app }) {
    app.component('MacroDocCatalog', MacroDocCatalog)
    app.component('GalleryDocPage', GalleryDocPage)
    app.component('DocsHomeExperience', DocsHomeExperience)
  },
})
