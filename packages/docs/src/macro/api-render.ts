import type { MacroDocPage } from './types'

/** 渲染 API 页面只描述节点创建，不把 DOM 判断混入宏编译或网格计算。 */
const renderPage = (page: MacroDocPage): MacroDocPage => ({ ...page, apiArea: 'render' })

export const renderSvgGridPage = renderPage({
  slug: 'renderSvgGrid', title: 'renderSvgGrid', navLabel: 'renderSvgGrid',
  kicker: 'API · RENDERERS', group: 'api',
  summary: '根据 GridScene 创建带尺寸、viewBox 和可访问性标签的 SVGSVGElement。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`renderSvgGrid`：GridScene 到 SVG 节点的渲染入口。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro, renderSvgGrid } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
// 函数会创建完整 SVG；调用方只需挂载返回节点。
const svg: SVGSVGElement = renderSvgGrid(scene)

document.querySelector('#app')?.append(svg)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它创建 SVG 根节点、线条层和内容层，并将 `GridScene` 中的文本、线条和圆角图元绘制到 SVG。它不识别加法、减法或除法语义。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type RenderSvgGrid = (scene: GridScene) => SVGSVGElement` },
        { type: 'table', columns: ['返回节点属性', '值 / 类型', '说明'], rows: [
          ['`class`', '`grid-svg`', 'SVG 根节点类名；可用于主题样式。'],
          ['`width` / `height`', '`number`', '由 `resolveGridMetrics(scene)` 计算的总尺寸。'],
          ['`viewBox`', '`string`', '从 `0 0` 延伸到场景总宽高，便于缩放和导出。'],
          ['`role` / `aria-label`', '`img` / `string`', '使用场景的可访问性标签。'],
          ['线条层 / 内容层', '`g.grid-line-layer` / `g.grid-content-layer`', '线条与文本分层，保持与 DOM 渲染器一致。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '只在浏览器环境调用', text: '函数依赖全局 `document`，SSR 中必须等客户端挂载后再调用。SVG 的字体、颜色和线宽仍由应用 CSS 或场景样式 token 提供。' }] },
  ],
})

export const renderDomGridPage = renderPage({
  slug: 'renderDomGrid', title: 'renderDomGrid', navLabel: 'renderDomGrid',
  kicker: 'API · RENDERERS', group: 'api',
  summary: '根据 GridScene 创建可直接挂载的 DOM/CSS 舞台 HTMLElement。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`renderDomGrid`：GridScene 到 DOM/CSS 舞台的渲染入口。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro, renderDomGrid } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
// 舞台和两层子节点会由渲染器自动创建。
const stage: HTMLElement = renderDomGrid(scene)

document.querySelector('#app')?.append(stage)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它创建相对定位的舞台、线条层和内容层，用绝对定位放置所有图元。DOM 渲染器适合需要 CSS 主题、事件包装或直接操作 HTML 节点的页面。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type RenderDomGrid = (scene: GridScene) => HTMLElement` },
        { type: 'table', columns: ['节点 / 属性', '值 / 类型', '说明'], rows: [
          ['舞台类名', '`grid-dom-stage`', '相对定位，内联写入场景总宽高和 `--grid-font-size`。'],
          ['线条层', '`div.grid-line-layer`', '承载 LINE、边框和厂字弯；`pointer-events: none`。'],
          ['内容层', '`div.grid-content-layer`', '承载文本图元，层级高于线条层。'],
          ['可访问性', '`role="img"` + `aria-label`', '复用场景的可访问性描述。'],
        ] },
        {
          type: 'code', title: '基础 CSS', language: 'css', code: `.grid-dom-stage .grid-text {
  position: absolute;
  white-space: nowrap;
  font-family: "Noto Serif SC", "Times New Roman", serif;
  font-size: var(--grid-font-size, 27px);
  font-weight: 700;
  line-height: 1;
}

/* 线条的几何位置由渲染器写入，颜色和主题可由 CSS 覆盖。 */
.grid-dom-stage .grid-edge {
  background: #000;
}`,
        },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '基础定位由内联样式提供', text: '函数依赖浏览器 `document`，SSR 必须延迟到客户端调用。不要在 CSS 中重新计算图元坐标；如果需要改变画面，应修改 `GridScene` 或共享样式 token。' }] },
  ],
})

/** 渲染分类的页面顺序同时决定侧栏顺序和技术文档页尾翻页顺序。 */
export const renderApiPages = [renderSvgGridPage, renderDomGridPage]
