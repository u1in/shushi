import type { MacroDocPage } from './types'

/** 网格与文本行 API 专题：尺寸解析与 OCR 对照。 */
export const gridApiPage: MacroDocPage = {
  slug: 'grid-api',
  title: '网格与文本行 API',
  navLabel: '网格与文本行 API',
  kicker: 'REFERENCE · GRID',
  group: 'api',
  summary: '解析 GridScene 的尺寸，并把实际可见文本按视觉行提取为字符串。',
  sections: [
    {
      id: 'visible-text-rows',
      title: 'extractVisibleTextRows',
      blocks: [
        {
          type: 'paragraph',
          text: '只读取 `GridScene`，把实际可绘制的非空文本按视觉行拼接成字符串数组。它不识别运算语义，适合把渲染结果与手写 OCR 的逐行识别结果做比对。',
        },
        {
          type: 'code',
          title: '使用',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'
import { extractVisibleTextRows } from '@vertical-arithmetic/grid'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
const rows: string[] = extractVisibleTextRows(scene)

console.log(rows)
// ['356', '+278', '11', '634']`,
        },
        {
          type: 'table',
          columns: ['行为', '说明'],
          rows: [
            ['普通格内数字', '按所在视觉行合并。'],
            ['左右边中点文本', '例如小数点；与同一视觉行合并。'],
            ['`RB` / `MT` 等局部注记', '按渲染器共用的文本锚点落到独立注记行。'],
            ['空文本', '不输出；没有文本的行整体省略。'],
            ['完全重合的文本', '保持 `GridScene.elements` 的声明顺序。'],
          ],
        },
      ],
    },
    {
      id: 'metrics',
      title: 'resolveGridMetrics',
      blocks: [
        {
          type: 'paragraph',
          text: '把列、行和留白解析为像素尺寸。两个渲染器内部都会调用它；调用方需要自己布局容器、计算缩放或导出尺寸时也可以直接使用。',
        },
        {
          type: 'code',
          title: '使用',
          code: `import { resolveGridMetrics } from '@vertical-arithmetic/grid'

const metrics = resolveGridMetrics(scene)

console.log(metrics.width)          // 场景总宽
console.log(metrics.height)         // 场景总高
console.log(metrics.columnOffsets)  // 每列起点的 x 坐标
console.log(metrics.rowOffsets)     // 每行起点的 y 坐标`,
        },
        {
          type: 'table',
          columns: ['字段', '类型', '说明'],
          rows: [
            ['`width`', '`number`', '包含左右留白的总宽度。'],
            ['`height`', '`number`', '包含上下留白的总高度。'],
            ['`columnOffsets`', '`number[]`', '每个列边界相对场景左上角的 x 坐标。'],
            ['`rowOffsets`', '`number[]`', '每个行边界相对场景左上角的 y 坐标。'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: '轨道尺寸必须为正',
          text: '任何列轨道或行轨道只要不是正有限数，`resolveGridMetrics` 就会抛错。网格不创建零宽列或零高行，结构图元使用 `edge`、`intersection` 等位置表达。',
        },
      ],
    },
    {
      id: 'scene',
      title: 'GridScene 类型',
      blocks: [
        {
          type: 'paragraph',
          text: '`GridScene` 是编译器的输出，也是两个渲染器和文本行提取的唯一输入。它只描述画面，不包含 DOM 节点、CSS 类名或 SVG 路径。',
        },
        {
          type: 'list',
          items: [
            '`columns` / `rows`：列轨道与行轨道，尺寸使用正有限数。',
            '`elements`：文本、线条、圆角等图元；位置使用 `cell`、`edge`、`intersection`、`edgeMidpoint`。',
            '`textHorizontalAlign` / `textVerticalAlign`：场景默认文本对齐，元素可以局部覆盖。',
            '`defaultTextStyleToken` / `fontSize` / `padding`：渲染器共享的默认样式与布局参数。',
          ],
        },
      ],
    },
  ],
}
