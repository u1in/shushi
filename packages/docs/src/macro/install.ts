import type { MacroDocPage } from './types'

/** 技术文档第一页：先分清包边界，再安装。 */
export const installPage: MacroDocPage = {
  slug: 'install',
  title: '安装',
  navLabel: '安装',
  kicker: 'GETTING STARTED · INSTALL',
  group: 'technical',
  summary: '安装统一入口即可使用宏编译、通用网格和渲染器；需要细粒度边界时再选择领域包。',
  sections: [
    {
      id: 'packages',
      title: '统一入口与领域包',
      blocks: [
        {
          type: 'paragraph',
          text: '从宏源码到画面通常只需要统一入口 `@vertical-arithmetic/core`。底层仍按职责拆分：`macro` 负责把源码编译成 `GridScene`，`grid` 提供场景类型与几何工具，`renderers` 只消费 `GridScene`。',
        },
        {
          type: 'table',
          columns: ['包', '职责', '主要导出'],
          rows: [
            ['`@vertical-arithmetic/core`', '统一导出运行时公共 API', '`compileMacro`、`parseMacro`、`renderDomGrid` 等'],
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
          text: '一般应用只安装统一入口；需要直接维护某个领域包时，再单独安装对应包。',
        },
        {
          type: 'code',
          title: 'npm',
          code: `npm i @vertical-arithmetic/core`,
        },
        {
          type: 'callout',
          tone: 'info',
          title: '按已发布包编写',
          text: '统一入口会把运行时领域包汇总为单个 ESM 文件和类型声明入口。npm scoped 包名必须包含 `/`，因此可发布包名是 `@vertical-arithmetic/core`，不是 `@vertical-arithmetic`。',
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
          code: `import { compileMacro } from '@vertical-arithmetic/core'

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
            { title: '宏编译 API', text: '查看 compileMacro、parseMacro、formatMacro、minifyMacro 的参数与返回值。', to: '/macro-api/compileMacro' },
            { title: '渲染 API', text: '查看两个渲染器创建的节点、返回值和基础样式。', to: '/macro-api/renderSvgGrid' },
          ],
        },
      ],
    },
  ],
}
