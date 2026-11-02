import type { MacroDocPage } from './types'

interface LayoutApiSpec {
  slug: string
  summary: string
  example: string
  purpose: string
  signature: string
  parameters: string[][]
  caution: string
}

/** 布局 API 页面统一说明“计算结果 → 宏源码或 GridScene”的公开转换边界。 */
const createLayoutApiPage = ({ slug, summary, example, purpose, signature, parameters, caution }: LayoutApiSpec): MacroDocPage => ({
  slug,
  title: slug,
  navLabel: slug,
  kicker: 'API · LAYOUT',
  group: 'api',
  apiArea: 'layout',
  summary,
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: `\`${slug}\`：${summary}` }] },
    { id: 'example', title: '例子', blocks: [{ type: 'code', title: 'TypeScript 示例', language: 'typescript', code: example }] },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: purpose }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: signature },
        { type: 'table', columns: ['参数 / 返回值', '类型', '说明'], rows: parameters },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '布局层边界', text: caution }] },
  ],
})

const additionExample = `import { computeAddition, createAdditionMacroSource } from '@vertical-arithmetic/core'

const computation = computeAddition('356', '278')
// 布局器把计算过程写成可复制、可编辑的宏源码。
const source = createAdditionMacroSource(computation, { showCarrySteps: true })

console.log(source)`

const subtractionExample = `import { computeSubtraction, createSubtractionMacroSource } from '@vertical-arithmetic/core'

const computation = computeSubtraction('356', '278')
const settings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showBorrowSteps: true,
}
// 借位过程由计算结果和设置共同决定。
const source = createSubtractionMacroSource(computation, settings)

console.log(source)`

const divisionExample = `import { computeDivision, createDivisionMacroSource } from '@vertical-arithmetic/core'

const computation = computeDivision('25', '10230', { resultMode: 'decimal' })
const settings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  bracketBend: 0.5,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
}
// 除法布局器会把厂字弯、商和过程横线写入宏源码。
const source = createDivisionMacroSource(computation, settings)

console.log(source)`

const multiplicationExample = `import { computeMultiplication, createMultiplicationMacroSource } from '@vertical-arithmetic/core'

const computation = computeMultiplication('97', '89')
const settings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
}
// 部分积和最终求和都会被写入同一份宏源码。
const source = createMultiplicationMacroSource(computation, settings)

console.log(source)`

const shortDivisionExample = `import { computeShortDivision, createShortDivisionMacroSource } from '@vertical-arithmetic/core'

const computation = computeShortDivision({ mode: 'factorization', values: ['360'] })
const settings = {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showRemainders: false,
}
// 短除法布局使用 DIV/VALUE 公共宏，不直接创建像素坐标。
const source = createShortDivisionMacroSource(computation, settings)

console.log(source)`

export const createAdditionMacroSourcePage = createLayoutApiPage({
  slug: 'createAdditionMacroSource',
  summary: '把 AdditionComputation 编排为可编辑的加法宏源码。',
  example: additionExample,
  purpose: '它负责加数、运算符、进位提示、横线和结果行的网格排版，不重新计算加法。返回的字符串可以交给 `compileMacro`，也可以直接复制到宏编辑器。',
  signature: `type CreateAdditionMacroSource = (
  computation: AdditionComputation,
  settings?: Partial<AdditionRenderSettings>,
) => string`,
  parameters: [
    ['`computation`', '`AdditionComputation`', '加法计算器输出的逐列过程和结果。'],
    ['`settings`', '`Partial<AdditionRenderSettings>`', '可选的列宽、行高、字号、辅助网格、可见步骤和进位显示配置。'],
    ['返回值', '`string`', '包含 GRID、ROW、CELL、RB 和 LINE 等公开宏命令的源码。'],
  ],
  caution: '不要把它当作计算器使用；输入计算结果必须先由 `computeAddition` 生成。返回源码的语义依赖 `@vertical-arithmetic/macro` 的公开宏契约。',
})

export const createAdditionGridScenePage = createLayoutApiPage({
  slug: 'createAdditionGridScene',
  summary: '兼容性地把 AdditionComputation 转换为 GridScene。',
  example: `import { computeAddition, createAdditionGridScene } from '@vertical-arithmetic/core'

const computation = computeAddition('356', '278')
// 该入口内部先生成宏源码，再走统一宏编译链路。
const scene = createAdditionGridScene(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showCarrySteps: true,
})

console.log(scene.ariaLabel)`,
  purpose: '它是旧调用方使用的便捷入口，内部等价于 `compileCalculatorMacro(createAdditionMacroSource(...))`。新代码如果需要保存或编辑源码，应优先调用 `createAdditionMacroSource`。',
  signature: `type CreateAdditionGridScene = (
  computation: AdditionComputation,
  settings?: Partial<AdditionRenderSettings>,
) => GridScene`,
  parameters: [
    ['`computation`', '`AdditionComputation`', '加法计算器输出。'],
    ['`settings`', '`Partial<AdditionRenderSettings>`', '与加法宏源码布局入口相同的可选设置。'],
    ['返回值', '`GridScene`', '可交给 DOM/CSS 或 SVG 渲染器的场景。'],
  ],
  caution: '该 API 已标记为兼容入口；不要在它外部直接拼装 GridScene。需要追踪或编辑中间源码时使用 `createAdditionMacroSource`。',
})

export const createSubtractionMacroSourcePage = createLayoutApiPage({
  slug: 'createSubtractionMacroSource',
  summary: '把 SubtractionComputation 编排为可编辑的减法宏源码。',
  example: subtractionExample,
  purpose: '它把被减数、减数、借位点、负号、差和横线写成宏源码，不在布局层重新执行借位算法。',
  signature: `type CreateSubtractionMacroSource = (
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
) => string`,
  parameters: [
    ['`computation`', '`SubtractionComputation`', '减法计算器输出的借位过程和差。'],
    ['`settings`', '`SubtractionRenderSettings`', '必填的网格尺寸、可见步骤和借位显示配置。'],
    ['返回值', '`string`', '包含 MTD 借位点、LINE 横线和数字单元格的宏源码。'],
  ],
  caution: '减法设置对象不是可选参数；缺少 `showBorrowSteps` 等必填字段会破坏布局契约。借位语义必须来自计算器结果。',
})

export const createSubtractionGridScenePage = createLayoutApiPage({
  slug: 'createSubtractionGridScene',
  summary: '兼容性地把 SubtractionComputation 转换为 GridScene。',
  example: `import { computeSubtraction, createSubtractionGridScene } from '@vertical-arithmetic/core'

const computation = computeSubtraction('356', '278')
const scene = createSubtractionGridScene(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showBorrowSteps: true,
})

console.log(scene.elements.length)`,
  purpose: '它先调用 `createSubtractionMacroSource`，再通过统一宏编译入口生成 `GridScene`，用于兼容直接需要场景的旧调用方。',
  signature: `type CreateSubtractionGridScene = (
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
) => GridScene`,
  parameters: [
    ['`computation`', '`SubtractionComputation`', '减法计算器输出。'],
    ['`settings`', '`SubtractionRenderSettings`', '与减法宏源码入口相同的必填设置。'],
    ['返回值', '`GridScene`', '可交给渲染器的网格场景。'],
  ],
  caution: '该入口已标记为兼容 API；需要查看人类可编辑的中间结果时使用 `createSubtractionMacroSource`。',
})

export const getDivisionPlaybackStepCountPage = createLayoutApiPage({
  slug: 'getDivisionPlaybackStepCount',
  summary: '计算长除法在当前零商显示策略下的播放事件数量。',
  example: `import { computeDivision, getDivisionPlaybackStepCount } from '@vertical-arithmetic/core'

const computation = computeDivision('25', '10230')
// 播放控件用同一事件数量限制 visibleStepCount。
const count = getDivisionPlaybackStepCount(computation, false)

console.log(count)`,
  purpose: '它把整数步骤、小数分隔符和可选零商步骤折算成布局播放帧数，保证进度控件与 `createDivisionMacroSource` 使用相同的事件序列。',
  signature: `type GetDivisionPlaybackStepCount = (
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
) => number`,
  parameters: [
    ['`computation`', '`DivisionComputation`', '除法计算器输出的逐轮试商过程。'],
    ['`showZeroQuotientSteps`', '`boolean`', '是否把商位为 0 的过程也作为可见播放事件。'],
    ['返回值', '`number`', '当前显示策略下的播放事件总数。'],
  ],
  caution: '该值是播放事件数量，不等于 `computation.steps.length`；小数分隔符和零商策略可能改变最终数量。',
})

export const createDivisionMacroSourcePage = createLayoutApiPage({
  slug: 'createDivisionMacroSource',
  summary: '把 DivisionComputation 编排为可编辑的长除法宏源码。',
  example: divisionExample,
  purpose: '它把商、除数、被除数、厂字弯、部分积、减法线和余数按播放快照写成宏源码，不在布局层重新试商。',
  signature: `type CreateDivisionMacroSource = (
  computation: DivisionComputation,
  settings: RenderSettings,
) => string`,
  parameters: [
    ['`computation`', '`DivisionComputation`', '除法计算器输出的商位、部分积和余数过程。'],
    ['`settings`', '`RenderSettings`', '包含网格尺寸、厂字弯、横线统一方式和零商显示策略。'],
    ['返回值', '`string`', '包含 BRACKET、DOT、LINE 和过程数字的长除法宏源码。'],
  ],
  caution: '设置中的 `showZeroQuotientSteps` 必须与播放控件使用的策略一致，否则源码帧数与进度数量会错位。',
})

export const createDivisionGridScenePage = createLayoutApiPage({
  slug: 'createDivisionGridScene',
  summary: '兼容性地把 DivisionComputation 转换为 GridScene。',
  example: `import { computeDivision, createDivisionGridScene } from '@vertical-arithmetic/core'

const computation = computeDivision('25', '10230')
const scene = createDivisionGridScene(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  bracketBend: 0.5,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
})

console.log(scene.ariaLabel)`,
  purpose: '它先生成长除法宏源码，再通过统一编译入口返回场景，供已有直接消费 `GridScene` 的调用方使用。',
  signature: `type CreateDivisionGridScene = (
  computation: DivisionComputation,
  settings: RenderSettings,
) => GridScene`,
  parameters: [
    ['`computation`', '`DivisionComputation`', '除法计算器输出。'],
    ['`settings`', '`RenderSettings`', '与长除法源码入口相同的必填设置。'],
    ['返回值', '`GridScene`', '可交给渲染器的长除法场景。'],
  ],
  caution: '该入口已标记为兼容 API；需要保存或调试宏过程时应使用 `createDivisionMacroSource`。',
})

export const getMultiplicationStepCountPage = createLayoutApiPage({
  slug: 'getMultiplicationStepCount',
  summary: '计算逐位乘法和列加法合计的教学播放步数。',
  example: `import { computeMultiplication, getMultiplicationStepCount } from '@vertical-arithmetic/core'

const computation = computeMultiplication('97', '89')
// 播放控件用此数量控制部分积和最终求和的进度。
const count = getMultiplicationStepCount(computation)

console.log(count)`,
  purpose: '它根据部分积的逐位步骤和多位乘数的列加法步骤计算总帧数，保证播放控件与乘法宏源码的可见步骤一致。',
  signature: `type GetMultiplicationStepCount = (computation: MultiplicationComputation) => number`,
  parameters: [
    ['`computation`', '`MultiplicationComputation`', '乘法计算器输出的部分积与列加法过程。'],
    ['返回值', '`number`', '乘法布局播放所需的总步骤数。'],
  ],
  caution: '单个有效乘数位和末尾零快捷计算会影响步骤数量；不要直接用部分积数组长度替代此 API。',
})

export const createMultiplicationMacroSourcePage = createLayoutApiPage({
  slug: 'createMultiplicationMacroSource',
  summary: '把 MultiplicationComputation 编排为可编辑的乘法宏源码。',
  example: multiplicationExample,
  purpose: '它把被乘数、乘数、部分积、进位、求和横线和最终积写成宏源码，并保留末尾零快捷计算的可见过程。',
  signature: `type CreateMultiplicationMacroSource = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
) => string`,
  parameters: [
    ['`computation`', '`MultiplicationComputation`', '乘法计算器输出的逐位步骤、部分积和最终积。'],
    ['`settings`', '`MultiplicationRenderSettings`', '包含辅助网格、进位、横线和可见步骤设置。'],
    ['返回值', '`string`', '包含 ×、RB、部分积和 LINE 的乘法宏源码。'],
  ],
  caution: '布局器只读取计算结果，不重新执行乘法；`showCarrySteps` 和 `visibleStepCount` 应与播放控件保持一致。',
})

export const createMultiplicationGridScenePage = createLayoutApiPage({
  slug: 'createMultiplicationGridScene',
  summary: '兼容性地把 MultiplicationComputation 转换为 GridScene。',
  example: `import { computeMultiplication, createMultiplicationGridScene } from '@vertical-arithmetic/core'

const computation = computeMultiplication('97', '89')
const scene = createMultiplicationGridScene(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
})

console.log(scene.columns.length)`,
  purpose: '它先生成乘法宏源码，再通过统一编译入口生成场景，兼容旧版直接获取 `GridScene` 的调用方式。',
  signature: `type CreateMultiplicationGridScene = (
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
) => GridScene`,
  parameters: [
    ['`computation`', '`MultiplicationComputation`', '乘法计算器输出。'],
    ['`settings`', '`MultiplicationRenderSettings`', '与乘法源码入口相同的必填设置。'],
    ['返回值', '`GridScene`', '可交给渲染器的乘法场景。'],
  ],
  caution: '该入口已标记为兼容 API；需要用户可编辑的中间源码时使用 `createMultiplicationMacroSource`。',
})

export const createShortDivisionMacroSourcePage = createLayoutApiPage({
  slug: 'createShortDivisionMacroSource',
  summary: '把 ShortDivisionComputation 编排为可编辑的短除法宏源码。',
  example: shortDivisionExample,
  purpose: '它使用公开的 `DIV`、`VALUE`、`ROW` 和 `GRID` 宏表达质因数、公因数或进制转换过程，不直接创建半格像素坐标。',
  signature: `type CreateShortDivisionMacroSource = (
  computation: ShortDivisionComputation,
  settings: ShortDivisionRenderSettings,
) => string`,
  parameters: [
    ['`computation`', '`ShortDivisionComputation`', '短除法计算器输出；由 `mode` 区分三种教学用途。'],
    ['`settings`', '`ShortDivisionRenderSettings`', '包含网格尺寸、可见步骤和余数显示配置。'],
    ['返回值', '`string`', '包含 DIV/VALUE 结构和最终结果组的短除法宏源码。'],
  ],
  caution: '短除法的 `mode` 必须与计算结果契约匹配；布局器不会重新计算质因数、公因数或进制余数。',
})

export const createShortDivisionGridScenePage = createLayoutApiPage({
  slug: 'createShortDivisionGridScene',
  summary: '兼容性地把 ShortDivisionComputation 转换为 GridScene。',
  example: `import { computeShortDivision, createShortDivisionGridScene } from '@vertical-arithmetic/core'

const computation = computeShortDivision({ mode: 'factorization', values: ['360'] })
const scene = createShortDivisionGridScene(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showRemainders: false,
})

console.log(scene.rows.length)`,
  purpose: '它先调用 `createShortDivisionMacroSource`，再通过统一宏编译入口返回场景，供现有渲染链路使用。',
  signature: `type CreateShortDivisionGridScene = (
  computation: ShortDivisionComputation,
  settings: ShortDivisionRenderSettings,
) => GridScene`,
  parameters: [
    ['`computation`', '`ShortDivisionComputation`', '短除法计算器输出。'],
    ['`settings`', '`ShortDivisionRenderSettings`', '与短除法源码入口相同的必填设置。'],
    ['返回值', '`GridScene`', '可交给渲染器的短除法场景。'],
  ],
  caution: '该入口已标记为兼容 API；短除法源码需要调试或编辑时应使用 `createShortDivisionMacroSource`。',
})

export const compileCalculatorMacroPage = createLayoutApiPage({
  slug: 'compileCalculatorMacro',
  summary: '把计算器布局生成的宏源码编译为 GridScene。',
  example: `import { compileCalculatorMacro, createAdditionMacroSource, computeAddition } from '@vertical-arithmetic/core'

const computation = computeAddition('356', '278')
const source = createAdditionMacroSource(computation)
// 计算器和人工输入最终都经过同一个宏编译入口。
const scene = compileCalculatorMacro(source)

console.log(scene.ariaLabel)`,
  purpose: '它是布局层对 `compileMacro` 的统一封装，明确表达“计算器宏源码 → GridScene”的数据流边界。',
  signature: `type CompileCalculatorMacro = (source: string) => GridScene`,
  parameters: [
    ['`source`', '`string`', '由任一运算布局器生成的完整宏源码。'],
    ['返回值', '`GridScene`', '统一宏编译器生成的场景。'],
  ],
  caution: '它不会校验或修正计算结果；源码必须由计算器结果和布局器生成，错误宏源码会沿用 `compileMacro` 的语法错误。',
})

/** 布局公共 API 的页面顺序也用于 API 目录和页尾翻页。 */
export const layoutApiPages = [
  createAdditionMacroSourcePage,
  createAdditionGridScenePage,
  createSubtractionMacroSourcePage,
  createSubtractionGridScenePage,
  getDivisionPlaybackStepCountPage,
  createDivisionMacroSourcePage,
  createDivisionGridScenePage,
  getMultiplicationStepCountPage,
  createMultiplicationMacroSourcePage,
  createMultiplicationGridScenePage,
  createShortDivisionMacroSourcePage,
  createShortDivisionGridScenePage,
  compileCalculatorMacroPage,
]
