/**
 * 网格宏文档包入口。
 * 内容数据、文档页面、可复用图例组件与样式都从这里对外暴露，
 * 主应用只负责挂载路由和提供站点外壳。
 */
export * from './content'

export { default as MacroDocsLayout } from './pages/MacroDocsLayout.vue'
export { default as MacroLanguageDocsPage } from './pages/MacroLanguageDocsPage.vue'
export { default as MacroApiDocsPage } from './pages/MacroApiDocsPage.vue'
export { default as MacroDocPage } from './pages/MacroDocPage.vue'
export { default as MacroDocBlocks } from './components/MacroDocBlocks.vue'
export { default as MacroExampleCard } from './components/MacroExampleCard.vue'
export { default as MacroCompare } from './components/MacroCompare.vue'
export { default as MacroSandbox } from './components/MacroSandbox.vue'
export { default as MacroCodeBlock } from './components/MacroCodeBlock.vue'
export { default as MacroGridPreview } from './components/MacroGridPreview.vue'
