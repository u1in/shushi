import type { MacroDocPage } from './types'

/** 技术文档第二页：先用门户 API 跑通数值竖式，再介绍宏编译和三种渲染输出。 */
export const quickStartPage: MacroDocPage = {
  slug: 'quickstart',
  title: '快速使用',
  navLabel: '快速使用',
  kicker: 'GETTING STARTED · QUICKSTART',
  group: 'technical',
  summary: '从一个统一入口生成竖式，再完成宏源码到 SVG 字符串、SVG/DOM，并提取可直接比对的可见文本行。',
  sections: [
    {
      id: 'vertical-arithmetic',
      title: '从数值创建竖式',
      blocks: [
        {
          type: 'paragraph',
          text: '数值输入通常使用 `createVerticalArithmetic`。它固定串联计算器、宏源码布局和宏编译器，但仍返回每一层的 computation、source 与 scene，因此既可直接渲染，也能继续编辑源码。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          language: 'typescript',
          code: `import { createVerticalArithmetic, renderSvgString } from '@u1in/shushi-core'

const { computation, source, scene } = createVerticalArithmetic({
  operation: 'addition',
  values: ['356', '278'],
})

console.log(computation.sumDigits) // '634'
console.log(source)
const svg = renderSvgString(scene)`,
        },
        {
          type: 'callout',
          tone: 'tip',
          title: '长除法不猜参数顺序',
          text: '长除法请求使用 `divisor` 与 `dividend` 两个具名字段；短除法使用 `operation: \'shortDivision\'`、`mode` 与 `values`，组合竖式使用 `operation: \'composite\'` 和 `expression`。',
        },
      ],
    },
    {
      id: 'compile',
      title: '编译宏',
      blocks: [
        {
          type: 'paragraph',
          text: '`compileMacro` 接收完整宏源码，返回与渲染器无关的 `GridScene`。它不会创建 DOM、SVG，也不会计算算术结果；示例里的 356、278、634 都是写在源码里的数字，因此本节的编译示例不需要导入 CSS。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro } from '@u1in/shushi-core'

const source = '3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;'
const scene = compileMacro(source)`,
        },
        {
          type: 'example',
          title: '这份宏源码渲染出来的画面',
          code: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;\nLN;\n6,3,4;',
          note: '同一份 `GridScene` 可以交给 SVG 字符串、SVG 或 DOM 渲染器；它们只负责画，不解释加法规则。',
        },
      ],
    },
    {
      id: 'ssr-svg',
      title: '在 SSR 中生成 SVG 字符串',
      blocks: [
        {
          type: 'paragraph',
          text: '`renderSvgString(scene)` 不创建 DOM，适合 Node.js、SSR 和构建脚本；它与浏览器版 `renderSvgGrid(scene)` 共用无 DOM SVG 渲染树，因此同一份 `GridScene` 的结构、坐标和图元顺序一致。返回值可以直接写入 HTTP 响应或 SVG 文件，但不承诺与浏览器重新序列化后的字符串逐字节相同。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro, renderSvgString } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const svg = renderSvgString(scene)

// 若 HTML 宿主要使用公共字体、颜色和线宽，请加载：
// import '@u1in/shushi-core/style.css'`,
        },
      ],
    },
    {
      id: 'svg',
      title: '渲染为 SVG',
      blocks: [
        {
          type: 'paragraph',
          text: '`renderSvgGrid(scene)` 直接创建并返回 SVG，不需要预先写 `<svg>` 容器。为保持字体、线条和语义 token 的默认表现，浏览器入口同时导入 `@u1in/shushi-core/style.css`。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro, renderSvgGrid } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const svg = renderSvgGrid(scene)

document.querySelector('#app')?.append(svg)`,
        },
      ],
    },
    {
      id: 'dom',
      title: '渲染为 DOM',
      blocks: [
        {
          type: 'paragraph',
          text: '`renderDomGrid(scene)` 直接创建舞台、线条层和内容层，并返回舞台；舞台已经带相对定位、场景宽高和 `--grid-font-size` 行内样式，但 DOM 图元的绝对定位、线条和字体仍由公共 CSS 提供。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro, renderDomGrid } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const stage = renderDomGrid(scene)

document.querySelector('#app')?.append(stage)`,
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
          code: `import { compileMacro, extractVisibleTextRows } from '@u1in/shushi-core'

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
            { title: '统一竖式门户 API', text: '一个调用完成计算、宏源码与 GridScene。', to: '/macro-api/createVerticalArithmetic' },
            { title: '宏编译 API', text: 'compileMacro、parseMacro、minifyMacro 与 createMacroAstInspection。', to: '/macro-api/compileMacro' },
            { title: '渲染 API', text: 'SVG 字符串、SVG 节点和 DOM 舞台的返回值与样式职责。', to: '/macro-api/renderSvgGrid' },
            { title: '网格和文本 API', text: 'GridScene、extractVisibleTextRows 与 resolveGridMetrics。', to: '/macro-api/GridScene' },
          ],
        },
      ],
    },
  ],
}
