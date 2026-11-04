import type { MacroDocPage } from './types'

/** 网格与文本 API 页面共用的固定阅读顺序。 */
const gridPage = (page: MacroDocPage): MacroDocPage => ({ ...page, apiTier: 'common' })

/** 几何计算属于渲染器和调试工具的扩展接口，普通调用方不需要直接拆解。 */
const advancedGridPage = (page: MacroDocPage): MacroDocPage => ({ ...page, apiTier: 'advanced' })

export const gridScenePage = gridPage({
  slug: 'GridScene', title: 'GridScene', navLabel: 'GridScene',
  kicker: 'API · GRID AND TEXT', group: 'api',
  summary: '渲染器、文本提取和几何工具共同消费的与运算无关场景契约。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`GridScene`：描述竖式画面结构的核心数据类型，不包含 DOM、CSS 或 SVG 节点。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro } from '@u1in/shushi-core'
import type { GridScene } from '@u1in/shushi-core'

// 编译结果就是三个渲染入口共用的场景契约。
const scene: GridScene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')

console.log(scene.columns.length, scene.rows.length)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '计算层和布局层只需输出 `GridScene`，DOM/CSS、SVG、OCR 文本行提取和几何工具都从同一份数据读取。这个边界让运算语义不会泄漏到渲染器。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        {
          type: 'code', title: '类型签名', language: 'typescript', code: `interface GridScene {
  columns: GridTrack[]
  rows: GridTrack[]
  padding: { top: number; right: number; bottom: number; left: number }
  unitWidth: number
  unitHeight: number
  fontSize: number
  defaultTextStyleToken?: string
  textHorizontalAlign: 'left' | 'center' | 'right'
  textVerticalAlign: 'top' | 'center' | 'bottom'
  elements: GridElement[]
  showGuideGrid: boolean
  ariaLabel: string
}`,
        },
        { type: 'table', columns: ['属性', '类型', '说明'], rows: [
          ['`columns` / `rows`', '`GridTrack[]`', '正有限尺寸的列轨道和行轨道，尺寸以 `unitWidth` / `unitHeight` 为单位。'],
          ['`padding`', '四个 `number`', '场景四边留白，参与最终总宽高计算。'],
          ['`elements`', '`GridElement[]`', '文本、线条和圆角图元；位置由 `cell`、`edge`、`intersection` 或 `edgeMidpoint` 表达。'],
          ['对齐与样式', '枚举 / token', '文本默认对齐和默认样式；单个文本图元可以覆盖对齐或样式。'],
          ['`ariaLabel`', '`string`', '渲染器写入 DOM/SVG 的可访问性描述。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '不要在场景中放 DOM 或像素坐标', text: '`GridScene` 只表达语义图元和轨道几何。不要把运算专属判断、CSS 类名或最终像素坐标写入场景；零尺寸结构锚点应使用 `edge`、`intersection` 等位置表达。' }] },
  ],
})

export const resolveGridMetricsPage = advancedGridPage({
  slug: 'resolveGridMetrics', title: 'resolveGridMetrics', navLabel: 'resolveGridMetrics',
  kicker: 'API · GRID AND TEXT', group: 'api',
  summary: '把 GridScene 的轨道和留白解析为三个渲染入口共用的像素尺寸。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`resolveGridMetrics`：网格轨道到实际尺寸的几何解析函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro, resolveGridMetrics } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
// 渲染器会使用同一份尺寸；调用方也可以提前布局外层容器。
const metrics = resolveGridMetrics(scene)

console.log(metrics.width, metrics.height)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它累加列轨道、行轨道和四边留白，生成场景总宽高及每条列/行边界的偏移。DOM 渲染器、SVG 渲染器和文本行提取都依赖同一几何结果。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type ResolveGridMetrics = (scene: GridScene) => GridMetrics

interface GridMetrics {
  width: number
  height: number
  columnOffsets: number[]
  rowOffsets: number[]
}` },
        { type: 'table', columns: ['属性', '类型', '说明'], rows: [
          ['`width` / `height`', '`number`', '包含四边留白的场景总宽高。'],
          ['`columnOffsets`', '`number[]`', '从左到右的列边界 x 坐标。长度为列轨道数加一。'],
          ['`rowOffsets`', '`number[]`', '从上到下的行边界 y 坐标。长度为行轨道数加一。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '轨道尺寸必须为正有限数', text: '任何列轨道或行轨道的 `size` 不是正有限数都会抛出 Error。不要通过创建零宽/零高轨道表达边界点，应使用 `GridPosition` 的边界或交点类型。' }] },
  ],
})

export const getGridPositionRectPage = advancedGridPage({
  slug: 'getGridPositionRect', title: 'getGridPositionRect', navLabel: 'getGridPositionRect',
  kicker: 'API · GRID AND TEXT', group: 'api',
  summary: '把单元格、交点、边或边中点位置解析为网格矩形。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`getGridPositionRect`：网格位置到几何矩形的解析函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro, getGridPositionRect, resolveGridMetrics } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;')
const metrics = resolveGridMetrics(scene)
// cell 使用零起始的列、行索引；返回值包含左上角和尺寸。
const rect = getGridPositionRect({ kind: 'cell', column: 0, row: 0 }, metrics)

console.log(rect.left, rect.top, rect.width, rect.height)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它统一处理四类 `GridPosition`：完整单元格区域、列行交点、单元格边和边中点。渲染器与命名图谱都可以用它获得同一份几何结果。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type GetGridPositionRect = (position: GridPosition, metrics: GridMetrics) => GridRect` },
        { type: 'table', columns: ['参数 / 返回值', '类型', '说明'], rows: [
          ['`position`', '`GridPosition`', '声明图元锚点的单元格、交点、边或边中点位置。'],
          ['`metrics`', '`GridMetrics`', '由 `resolveGridMetrics(scene)` 计算出的轨道偏移。'],
          ['返回值', '`GridRect`', '包含 `left`、`top`、`width`、`height` 的矩形；交点和边中点的宽高为 0。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '位置索引必须落在轨道范围内', text: '列、行、跨度和边界线必须是有效整数，且不能超出 `metrics` 的轨道范围；无效位置会抛出网格区域错误。不要用零尺寸轨道模拟交点。'}] },
  ],
})

export const getGridElementRectPage = advancedGridPage({
  slug: 'getGridElementRect', title: 'getGridElementRect', navLabel: 'getGridElementRect',
  kicker: 'API · GRID AND TEXT', group: 'api',
  summary: '根据 GridElement 自带的位置声明解析其几何矩形。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`getGridElementRect`：图元到几何矩形的便捷解析函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro, getGridElementRect, resolveGridMetrics } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;')
const metrics = resolveGridMetrics(scene)
const firstElement = scene.elements[0]
// 函数会读取 firstElement.position，不需要调用方重复拆解位置联合类型。
const rect = getGridElementRect(firstElement, metrics)

console.log(rect)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它是 `getGridPositionRect(element.position, metrics)` 的图元级封装，适合渲染器、命名图谱和调试工具直接根据元素声明取得区域。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type GetGridElementRect = (element: GridElement, metrics: GridMetrics) => GridRect` },
        { type: 'table', columns: ['参数 / 返回值', '类型', '说明'], rows: [
          ['`element`', '`GridElement`', '包含 `id`、`position`、`content` 和可选样式 token 的图元。'],
          ['`metrics`', '`GridMetrics`', '与该场景对应的轨道偏移和总尺寸。'],
          ['返回值', '`GridRect`', '图元位置对应的矩形或边界点矩形。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'info', title: '不读取图元内容语义', text: '`getGridElementRect` 只读取 `element.position`，不会判断文本、线条或圆角的运算含义。元素位置与 `metrics` 必须来自同一份 `GridScene`。'}] },
  ],
})

export const getGridTextAnchorPage = advancedGridPage({
  slug: 'getGridTextAnchor', title: 'getGridTextAnchor', navLabel: 'getGridTextAnchor',
  kicker: 'API · GRID AND TEXT', group: 'api',
  summary: '根据矩形和文本对齐方式计算渲染器共用的文本锚点。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`getGridTextAnchor`：文本矩形和对齐方式到锚点坐标的解析函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { getGridTextAnchor } from '@u1in/shushi-core'

const rect = { left: 20, top: 12, width: 30, height: 46 }
// 居中对齐会把锚点放在矩形中心。
const anchor = getGridTextAnchor(rect, 'center', 'center')

console.log(anchor.x, anchor.y) // 35, 35`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它将 `left`、`right`、`center` 与 `top`、`bottom`、`center` 转换为文本绘制锚点。DOM/CSS、SVG 和视觉文本行提取共用这套规则，保证文字位置一致。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type GetGridTextAnchor = (
  rect: GridRect,
  horizontalAlign: GridTextHorizontalAlign,
  verticalAlign: GridTextVerticalAlign,
) => GridTextAnchor` },
        { type: 'table', columns: ['参数 / 返回值', '类型', '说明'], rows: [
          ['`rect`', '`GridRect`', '文本所属的单元格、边或交点矩形。'],
          ['`horizontalAlign`', '`GridTextHorizontalAlign`', '取 `left`、`center` 或 `right`。'],
          ['`verticalAlign`', '`GridTextVerticalAlign`', '取 `top`、`center` 或 `bottom`。'],
          ['返回值', '`GridTextAnchor`', '包含 `x`、`y` 和最终采用的两个对齐值。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'info', title: '只计算锚点，不测量文字', text: '函数不会读取字体、文字宽度或 DOM 布局；文本的自然尺寸和溢出方向由渲染器及对齐值共同决定。'}] },
  ],
})

export const extractVisibleTextRowsPage = gridPage({
  slug: 'extractVisibleTextRows', title: 'extractVisibleTextRows', navLabel: 'extractVisibleTextRows',
  kicker: 'API · GRID AND TEXT', group: 'api',
  summary: '将 GridScene 中实际可见的非空文本按视觉行提取为字符串数组。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`extractVisibleTextRows`：面向 OCR 对照和测试的视觉文本行提取函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro, extractVisibleTextRows } from '@u1in/shushi-core'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')
// 返回值按渲染锚点的 y 坐标分行，再按 x 坐标排序。
const rows: string[] = extractVisibleTextRows(scene)

        console.log(rows) // ['356', '+278', '11', '634']`,
      }, {
        type: 'callout',
        tone: 'info',
        title: '纯数据 API 不需要 CSS',
        text: '`extractVisibleTextRows` 只读取 `GridScene` 并返回字符串数组，不创建 DOM 或 SVG；`renderSvgString` 同样不需要浏览器 DOM。只有调用 `renderDomGrid` / `renderSvgGrid` 生成浏览器节点时，才需要额外导入 `@u1in/shushi-core/style.css`。',
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它只读取 `GridScene`，不识别加法进位、减法借位或除法商位等运算语义。共享锚点规则会让正文、边中点注记和小数点按最终视觉位置归并，适合与 OCR 结果或快照测试比较。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type ExtractVisibleTextRows = (scene: GridScene) => string[]` },
        { type: 'table', columns: ['行为', '说明'], rows: [
          ['普通文本', '按渲染锚点的视觉行归组，并从左到右拼接。'],
          ['边中点或交点文本', '使用与渲染器相同的锚点参与排序，可形成独立注记行。'],
          ['空文本', '不输出；没有文本的视觉行整体省略。'],
          ['同一锚点', '保持 `GridScene.elements` 的声明顺序，匹配渲染器绘制顺序。'],
          ['返回值', '`string[]`', '每个数组项是一条视觉行，不包含额外的 DOM 或样式信息。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'info', title: '结果是视觉行，不是运算行', text: '不要用返回数组推断商、进位或借位的业务含义；如果需要运算过程，应读取计算器结果契约。传入无效轨道时，函数会与渲染器一样先抛出几何校验错误。' }] },
  ],
})

/** 网格与文本分类的页面顺序同时决定 API 文档侧栏顺序和页尾翻页顺序。 */
export const gridApiPages = [
  gridScenePage,
  resolveGridMetricsPage,
  getGridPositionRectPage,
  getGridElementRectPage,
  getGridTextAnchorPage,
  extractVisibleTextRowsPage,
]
