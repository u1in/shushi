import type { MacroDocPage } from './types'

/** 技术文档第二页：用最短链路跑通编译、两种渲染和文本行提取。 */
export const quickStartPage: MacroDocPage = {
  slug: 'quickstart',
  title: '快速使用',
  navLabel: '快速使用',
  kicker: 'GETTING STARTED · QUICKSTART',
  group: 'technical',
  summary: '用三个包完成从宏源码到 SVG/DOM，并提取可直接比对的可见文本行。',
  sections: [
    {
      id: 'compile',
      title: '编译宏',
      blocks: [
        {
          type: 'paragraph',
          text: '`compileMacro` 接收完整宏源码，返回与渲染器无关的 `GridScene`。它不会创建 DOM、SVG，也不会计算算术结果；示例里的 356、278、634 都是写在源码里的数字。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'

const source = '3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;'
const scene = compileMacro(source)`,
        },
        {
          type: 'example',
          title: '这份宏源码渲染出来的画面',
          code: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;\nLN;\n6,3,4;',
          note: '同一份 `GridScene` 可以交给 SVG 或 DOM 渲染器；两个渲染器只负责画，不解释加法规则。',
        },
      ],
    },
    {
      id: 'svg',
      title: '渲染为 SVG',
      blocks: [
        {
          type: 'paragraph',
          text: '`renderSvgGrid(scene)` 直接创建并返回 SVG，不需要预先写 `<svg>` 容器。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'
import { renderSvgGrid } from '@vertical-arithmetic/renderers'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const svg = renderSvgGrid(scene)

document.querySelector('#app')?.append(svg)`,
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
      title: '渲染为 DOM/CSS',
      blocks: [
        {
          type: 'paragraph',
          text: '`renderDomGrid(scene)` 直接创建舞台、线条层和内容层，并返回舞台。舞台已经带相对定位、场景宽高和 `--grid-font-size` 行内样式。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'
import { renderDomGrid } from '@vertical-arithmetic/renderers'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const stage = renderDomGrid(scene)

document.querySelector('#app')?.append(stage)`,
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
      id: 'text-rows',
      title: '提取可见文本行',
      blocks: [
        {
          type: 'paragraph',
          text: '`extractVisibleTextRows` 只读取 `GridScene`，把实际可绘制的非空文本按视觉行拼接成字符串数组，适合与手写 OCR 的逐行识别结果比对。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'
import { extractVisibleTextRows } from '@vertical-arithmetic/grid'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const rows = extractVisibleTextRows(scene)

console.log(rows)
// ['356', '+278', '11', '634']`,
        },
        {
          type: 'callout',
          tone: 'info',
          title: '不需要 DOM',
          text: '文本行提取是纯数据操作。它按渲染器共用的文本锚点归组，因此 `RB` / `MT` 等局部注记会单独形成注记行。',
        },
      ],
    },
    {
      id: 'next',
      title: '继续阅读',
      blocks: [
        {
          type: 'cards',
          items: [
            { title: '宏编译 API', text: 'compileMacro、parseMacro、formatMacro 与 minifyMacro。', to: '/macro-api/compile-api' },
            { title: '渲染 API', text: '两个渲染器的返回值、DOM 结构与样式职责。', to: '/macro-api/render-api' },
            { title: '网格与文本行 API', text: 'extractVisibleTextRows 与 resolveGridMetrics。', to: '/macro-api/grid-api' },
          ],
        },
      ],
    },
  ],
}
