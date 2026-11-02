import type { MacroDocPage } from './types'

/** 技术文档第一页：先分清包边界，再安装。 */
export const installPage: MacroDocPage = {
  slug: 'install',
  title: '安装',
  navLabel: '安装',
  kicker: 'GETTING STARTED · INSTALL',
  group: 'technical',
  summary: '安装宏编译、通用网格和渲染器三个包，先分清它们各自的职责。',
  sections: [
    {
      id: 'packages',
      title: '三个包的分工',
      blocks: [
        {
          type: 'paragraph',
          text: '从宏源码到画面需要三个包。它们彼此解耦：`macro` 只负责把源码编译成 `GridScene`，`grid` 提供场景类型与几何工具，`renderers` 只消费 `GridScene`。',
        },
        {
          type: 'table',
          columns: ['包', '职责', '主要导出'],
          rows: [
            ['`@vertical-arithmetic/macro`', '解析、格式化与编译宏源码', '`compileMacro`、`parseMacro`、`formatMacro`、`minifyMacro`'],
            ['`@vertical-arithmetic/grid`', '`GridScene` 类型、几何与文本行提取', '`extractVisibleTextRows`、`resolveGridMetrics`'],
            ['`@vertical-arithmetic/renderers`', '把 `GridScene` 绘制为 SVG 或 DOM/CSS', '`renderSvgGrid`、`renderDomGrid`'],
          ],
        },
      ],
    },
    {
      id: 'command',
      title: '安装命令',
      blocks: [
        {
          type: 'paragraph',
          text: '一次性安装三个包。只做宏编译或文本行提取时，可以不安装 `renderers`。',
        },
        {
          type: 'code',
          title: 'npm',
          code: `npm i @vertical-arithmetic/macro @vertical-arithmetic/grid @vertical-arithmetic/renderers`,
        },
        {
          type: 'callout',
          tone: 'info',
          title: '按已发布包编写',
          text: '上面的命令按包已发布编写。当前仓库内这些包仍是 workspace 私有包，开发时应使用 `@vertical-arithmetic/*` 的 workspace 依赖；发布后再直接使用 npm 包名。',
        },
      ],
    },
    {
      id: 'verify',
      title: '安装后验证',
      blocks: [
        {
          type: 'paragraph',
          text: '先确认宏编译入口可用：编译一段加法竖式，并检查返回的 `GridScene` 结构。',
        },
        {
          type: 'code',
          title: 'TypeScript',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')

console.log(scene.columns.length)  // 列数
console.log(scene.rows.length)     // 行数
console.log(scene.elements.length) // 文本、线条等图元数量`,
        },
        {
          type: 'callout',
          tone: 'tip',
          title: '编译不需要浏览器',
          text: '`compileMacro`、`parseMacro`、`formatMacro`、`minifyMacro` 与 `extractVisibleTextRows` 都是纯数据操作。只有 `renderSvgGrid` 和 `renderDomGrid` 需要浏览器 DOM。',
        },
      ],
    },
    {
      id: 'next',
      title: '下一步',
      blocks: [
        {
          type: 'cards',
          items: [
            { title: '快速使用', text: '从编译到 SVG、DOM 和文本行提取，先跑通完整链路。', to: '/macro-api/quickstart' },
            { title: '宏编译 API', text: '查看 compile、parse、format、minify 的参数与返回值。', to: '/macro-api/compile-api' },
            { title: '渲染 API', text: '查看两个渲染器创建的节点、返回值和基础样式。', to: '/macro-api/render-api' },
          ],
        },
      ],
    },
  ],
}
