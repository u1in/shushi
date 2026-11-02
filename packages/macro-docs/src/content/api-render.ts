import type { MacroDocPage } from './types'

/** 渲染 API 专题：两个函数都直接创建并返回可挂载的节点。 */
export const renderApiPage: MacroDocPage = {
  slug: 'render-api',
  title: '渲染 API',
  navLabel: '渲染 API',
  kicker: 'REFERENCE · RENDERERS',
  group: 'api',
  summary: 'renderSvgGrid 与 renderDomGrid 都直接创建节点；调用方只需要挂载返回值。',
  sections: [
    {
      id: 'svg',
      title: 'renderSvgGrid',
      blocks: [
        {
          type: 'paragraph',
          text: '创建 SVG、绘制场景并返回 `SVGSVGElement`。不需要预先写 `<svg>` 容器，也不需要手动设置 `viewBox`。',
        },
        {
          type: 'code',
          title: '签名与使用',
          code: `import { renderSvgGrid } from '@vertical-arithmetic/renderers'

const svg: SVGSVGElement = renderSvgGrid(scene)
document.querySelector('#app')?.append(svg)`,
        },
        {
          type: 'table',
          columns: ['返回节点', '自动设置', '说明'],
          rows: [
            ['`SVGSVGElement`', '`class="grid-svg"`', '携带 `grid-svg` 类名，便于应用主题挂样式。'],
            ['', '`width` / `height` / `viewBox`', '使用 `resolveGridMetrics` 解析后的场景尺寸。'],
            ['', '`role="img"` / `aria-label`', '可访问性角色与场景描述。'],
            ['', '`xmlns`', '便于把 SVG 序列化或导出为独立文件。'],
          ],
        },
        {
          type: 'code',
          title: '基础 CSS',
          code: `.grid-svg {
  display: block;
  max-width: 100%;
}

.grid-svg .grid-text {
  font-family: "Noto Serif SC", "Times New Roman", serif;
  font-size: var(--grid-font-size, 27px);
  font-weight: 700;
}

.grid-svg .grid-edge,
.grid-svg .grid-corner {
  fill: none;
  stroke: #000;
}`,
        },
      ],
    },
    {
      id: 'dom',
      title: 'renderDomGrid',
      blocks: [
        {
          type: 'paragraph',
          text: '创建舞台、线条层和内容层，绘制后返回舞台 `HTMLElement`。舞台自带相对定位、宽高、字号变量与可访问性标签。',
        },
        {
          type: 'code',
          title: '签名与使用',
          code: `import { renderDomGrid } from '@vertical-arithmetic/renderers'

const stage: HTMLElement = renderDomGrid(scene)
document.querySelector('#app')?.append(stage)`,
        },
        {
          type: 'table',
          columns: ['节点', '类名', '职责'],
          rows: [
            ['舞台', '`grid-dom-stage`', '相对定位、场景宽高、`--grid-font-size`。'],
            ['线条层', '`grid-line-layer`', 'LINE、边框与厂字弯；`pointer-events: none`。'],
            ['内容层', '`grid-content-layer`', '文本图元；位于线条层之上。'],
          ],
        },
        {
          type: 'code',
          title: '最小 CSS',
          code: `.grid-dom-stage .grid-text {
  position: absolute;
  display: block;
  width: max-content;
  white-space: nowrap;
  font-family: "Noto Serif SC", "Times New Roman", serif;
  font-size: var(--grid-font-size, 27px);
  font-weight: 700;
  line-height: 1;
}

.grid-dom-stage .grid-edge,
.grid-dom-stage .grid-corner {
  position: absolute;
}

.grid-dom-stage .grid-edge {
  background: #000;
}

.grid-dom-stage .grid-edge--top,
.grid-dom-stage .grid-edge--bottom {
  transform: translateY(-1px);
}

.grid-dom-stage .grid-edge--left,
.grid-dom-stage .grid-edge--right {
  transform: translateX(-1px);
}

.grid-dom-stage .grid-corner {
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  border-bottom-right-radius: var(--grid-corner-radius);
}`,
        },
      ],
    },
    {
      id: 'styling',
      title: '样式职责',
      blocks: [
        {
          type: 'list',
          items: [
            '位置、尺寸、层级和基础定位由渲染器写入行内样式，调用方不需要搭图层结构。',
            '文本颜色、线条颜色和线宽可由宏的 `autoColor` 以行内样式写入。',
            '字体、字号兜底、`styleToken` 主题与 `data-style-token` 选择器由应用 CSS 提供。',
            '`renderSvgGrid` 与 `renderDomGrid` 都只消费 `GridScene`，不识别加法、减法或除法语义。',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          title: '浏览器 API',
          text: '两个函数都依赖 `document`。SSR 场景请只在客户端挂载后调用；宏编译与文本行提取不受影响。',
        },
      ],
    },
  ],
}
