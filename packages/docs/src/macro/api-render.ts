import type { MacroDocPage } from './types'

/** 渲染 API 页面只描述输出适配，不把 DOM 判断混入宏编译或网格计算。 */
const renderPage = (page: MacroDocPage): MacroDocPage => ({ ...page, apiTier: 'common' })

export const renderSvgGridPage = renderPage({
  slug: 'renderSvgGrid',
  title: 'renderSvgGrid',
  navLabel: 'renderSvgGrid',
  kicker: 'API · RENDERERS',
  group: 'api',
  summary: '根据 GridScene 创建带尺寸、viewBox 和可访问性标签的 SVGSVGElement。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`renderSvgGrid`：GridScene 到 SVG 节点的渲染入口。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { compileMacro, renderSvgGrid } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
// 函数会创建完整 SVG；调用方只需挂载返回节点。
const svg: SVGSVGElement = renderSvgGrid(scene)

document.querySelector('#app')?.append(svg)`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它创建 SVG 根节点、线条层和内容层，并将 `GridScene` 中的文本、线条和圆角图元绘制到 SVG。它不识别加法、减法或除法语义，也不接收颜色或字体选项；它与 `renderSvgString` 共享无 DOM SVG 渲染树，因此相同场景的几何、颜色和字体规则不会分叉。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type RenderSvgGrid = (scene: GridScene) => SVGSVGElement`,
        },
        {
          type: 'table',
          columns: ['返回节点属性', '值 / 类型', '说明'],
          rows: [
            ['`class`', '`grid-svg`', 'SVG 根节点类名；可用于主题样式。'],
            ['`width` / `height`', '`number`', '由 `resolveGridMetrics(scene)` 计算的总尺寸。'],
            ['`viewBox`', '`string`', '从 `0 0` 延伸到场景总宽高，便于缩放和导出。'],
            ['`role` / `aria-label`', '`img` / `string`', '使用场景的可访问性标签。'],
            [
              '线条层 / 内容层',
              '`g.grid-line-layer` / `g.grid-content-layer`',
              '线条与文本分层，保持与 DOM 渲染器一致。',
            ],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '只在浏览器环境调用',
          text: '函数依赖全局 `document`，SSR 中必须等客户端挂载后再调用。SVG 图元会内联颜色、字号、字重和线宽等基础视觉值；浏览器入口仍可导入 `@u1in/shushi-core/renderer.css` 获取默认 STIX 字体资源和宿主主题。改用其他字体时改导入 `renderer-without-font.css` 并补充字体 CSS。',
        },
      ],
    },
  ],
})

export const renderSvgStringPage = renderPage({
  slug: 'renderSvgString',
  title: 'renderSvgString',
  navLabel: 'renderSvgString',
  kicker: 'API · RENDERERS',
  group: 'api',
  summary: '在无 DOM 的 Node.js、SSR 或脚本环境中，根据 GridScene 生成 SVG 字符串。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`renderSvgString`：GridScene 到 SVG 字符串的 SSR 渲染入口。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { compileMacro, renderSvgString } from '@u1in/shushi-core'

// 编译只生成与渲染器无关的 GridScene，不需要浏览器环境。
const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')

// 返回完整的 SVG 字符串；embedFont 默认使用竖式字符子集打包字体。
const svg = renderSvgString(scene, { embedFont: true })
console.log(svg)`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它使用与 `renderSvgGrid` 相同的无 DOM SVG 渲染树、轨道尺寸、文本锚点和图元结构，通过字符串序列化生成 `<svg>`，不创建 DOM，也不读取全局 `document`。同一份 `GridScene` 会得到相同的几何、图层、属性和图元顺序；文本、属性和样式值会进行 XML 转义。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'table',
          columns: ['项目', '值 / 类型', '说明'],
          rows: [
            [
              '函数签名',
              '`(scene: GridScene, options?: RenderSvgStringOptions) => string`',
              '输入已编译的 GridScene，返回完整 SVG 字符串。',
            ],
            [
              '`options.embedFont`',
              '`boolean`，默认 `false`',
              '为 `true` 时把场景使用的内置字体以 Base64 `@font-face` 嵌入 SVG；默认优先使用竖式字符子集，场景出现未知字符时自动回退完整字体。自定义字体仍需由宿主提供。',
            ],
            [
              '`options.fontSubset`',
              '`"arithmetic" | "full"`，默认 `"arithmetic"`',
              '选择内置字体资源；`arithmetic` 只包含数字、运算符、小数点和借位点，未知字符会自动回退为 `full`。',
            ],
            ['根节点', '`<svg class="grid-svg">`', '包含 `width`、`height`、`viewBox`、`role="img"` 和 `aria-label`。'],
            [
              '图层',
              '`g.grid-line-layer` / `g.grid-content-layer`',
              '线条、圆角、辅助网格与文本分层，结构与 `renderSvgGrid` 一致。',
            ],
            ['安全处理', 'XML 转义', '文本、属性和 inline style 值不会直接注入 SVG 标记。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'tip',
          title: '不需要浏览器环境',
          text: '该函数可在 Node.js、SSR 和构建脚本中调用，不需要 jsdom，也不需要先导入 CSS。它与 `renderSvgGrid` 保证 SVG 语义结构一致，并将颜色、字号、字重、线宽、线帽、删除线和辅助网格等最终视觉属性写入各个 SVG 图元，因此返回字符串可以直接保存为 `.svg` 文件，或编码后放入 `<img src="data:image/svg+xml;base64,...">`。默认不嵌入字体二进制；需要独立渲染时传入 `{ embedFont: true }`，默认只打包竖式字符子集，未知字符会回退完整字体。自定义字体仍需由宿主提供。',
        },
      ],
    },
  ],
})

export const renderDomGridPage = renderPage({
  slug: 'renderDomGrid',
  title: 'renderDomGrid',
  navLabel: 'renderDomGrid',
  kicker: 'API · RENDERERS',
  group: 'api',
  summary: '根据 GridScene 创建可直接挂载的 DOM/CSS 舞台 HTMLElement。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`renderDomGrid`：GridScene 到 DOM/CSS 舞台的渲染入口。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { compileMacro, renderDomGrid } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
// 舞台和两层子节点会由渲染器自动创建。
const stage: HTMLElement = renderDomGrid(scene)

document.querySelector('#app')?.append(stage)`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它创建相对定位的舞台、线条层和内容层，用绝对定位放置所有图元。DOM 渲染器适合需要 CSS 主题、事件包装或直接操作 HTML 节点的页面。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type RenderDomGrid = (scene: GridScene) => HTMLElement`,
        },
        {
          type: 'table',
          columns: ['节点 / 属性', '值 / 类型', '说明'],
          rows: [
            [
              '舞台类名',
              '`grid-dom-stage`',
              '相对定位，内联写入场景总宽高、`--grid-font-size` 和可选的 `--grid-font-family`。',
            ],
            ['线条层', '`div.grid-line-layer`', '承载 LINE、边框和厂字弯；`pointer-events: none`。'],
            ['内容层', '`div.grid-content-layer`', '承载文本图元，层级高于线条层。'],
            ['可访问性', '`role="img"` + `aria-label`', '复用场景的可访问性描述。'],
          ],
        },
        {
          type: 'code',
          title: '自定义覆盖（可选）',
          language: 'css',
          code: `.grid-dom-stage .grid-text {
  font-family: "Noto Serif SC", "Times New Roman", serif;
}

/* 几何位置由渲染器写入；应用可以覆盖公共样式的主题变量。 */
.grid-dom-stage {
  --grid-text: #172033;
  --grid-rule: #4a5f78;
  --grid-guide: #a7bbdd;
}`,
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '先导入渲染器 CSS',
          text: '函数依赖浏览器 `document`，SSR 必须延迟到客户端调用。DOM 图元会内联基础定位和视觉值；导入 `@u1in/shushi-core/renderer.css` 可获得默认 STIX 字体和宿主主题。改用其他字体时使用 `renderer-without-font.css` 加字体 CSS，且不要在自定义 CSS 中重新计算图元坐标。',
        },
      ],
    },
  ],
})

/** 渲染分类的页面顺序同时决定 API 文档侧栏顺序和页尾翻页顺序。 */
export const renderApiPages = [renderSvgGridPage, renderSvgStringPage, renderDomGridPage]
