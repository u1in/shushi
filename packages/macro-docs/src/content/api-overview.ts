import type { MacroDocPage } from './types'

/** API 参考的目录页：先给出全量函数表，再进入三个专题页。 */
export const apiOverviewPage: MacroDocPage = {
  slug: 'api-overview',
  title: 'API 总览',
  navLabel: 'API 总览',
  kicker: 'REFERENCE · OVERVIEW',
  group: 'api',
  summary: '按宏编译、渲染、网格与文本行三类，快速定位函数、参数和返回值。',
  sections: [
    {
      id: 'functions',
      title: '全部函数',
      blocks: [
        {
          type: 'table',
          columns: ['API', '包', '用途'],
          rows: [
            ['`compileMacro(source)`', '`macro`', '把完整宏源码编译为 `GridScene`。'],
            ['`parseMacro(source)`', '`macro`', '只解析源码，返回宏 AST 根节点。'],
            ['`formatMacro(source)`', '`macro`', '格式化源码，保留可读缩进。'],
            ['`minifyMacro(source)`', '`macro`', '把源码压缩为最短写法。'],
            ['`renderSvgGrid(scene)`', '`renderers`', '创建并返回 SVG 元素。'],
            ['`renderDomGrid(scene)`', '`renderers`', '创建并返回 DOM 舞台元素。'],
            ['`extractVisibleTextRows(scene)`', '`grid`', '按视觉行提取非空文本。'],
            ['`resolveGridMetrics(scene)`', '`grid`', '解析列偏移、行偏移与最终宽高。'],
          ],
        },
      ],
    },
    {
      id: 'topics',
      title: '按板块阅读',
      blocks: [
        {
          type: 'cards',
          items: [
            { title: '宏编译 API', text: '从源码到 GridScene：compileMacro、parseMacro、formatMacro、minifyMacro。', to: '/macro-api/compile-api' },
            { title: '渲染 API', text: 'SVG 与 DOM/CSS 两个渲染入口，以及返回节点的结构。', to: '/macro-api/render-api' },
            { title: '网格与文本行 API', text: 'GridScene 的尺寸解析与 OCR 友好的文本行提取。', to: '/macro-api/grid-api' },
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          title: '纯数据与浏览器 API',
          text: '`compileMacro`、`parseMacro`、`formatMacro`、`minifyMacro` 与 `extractVisibleTextRows` 都是纯数据操作；`renderSvgGrid` 与 `renderDomGrid` 需要浏览器 DOM。SSR 场景请只在客户端挂载后调用两个渲染函数。',
        },
      ],
    },
  ],
}
