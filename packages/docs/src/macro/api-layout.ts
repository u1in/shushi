import type { MacroDocPage } from './types'

interface LayoutApiSpec {
  slug: string
  summary: string
  example: string
  purpose: string
  signature: string
  parameters: string[][]
  caution: string
  apiTier?: 'common' | 'advanced'
}

/** 布局 API 页面统一说明“计算结果 → 宏源码或 GridScene”的公开转换边界。 */
const createLayoutApiPage = ({ slug, summary, example, purpose, signature, parameters, caution, apiTier = 'advanced' }: LayoutApiSpec): MacroDocPage => ({
  slug,
  title: slug,
  navLabel: slug,
  kicker: 'API · LAYOUT',
  group: 'api',
  apiTier,
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

const additionExample = `import { computeAddition, createAdditionMacroSource } from '@u1in/shushi-core'

const computation = computeAddition('356', '278')
// 布局器把计算过程写成可复制、可编辑的宏源码。
const source = createAdditionMacroSource(computation, { showCarrySteps: true })

console.log(source)`

const subtractionExample = `import { computeSubtraction, createSubtractionMacroSource } from '@u1in/shushi-core'

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

const divisionExample = `import { computeDivision, createDivisionMacroSource } from '@u1in/shushi-core'

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

const multiplicationExample = `import { computeMultiplication, createMultiplicationMacroSource } from '@u1in/shushi-core'

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

const shortDivisionExample = `import { computeShortDivision, createShortDivisionMacroSource } from '@u1in/shushi-core'

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
  caution: '不要把它当作计算器使用；输入计算结果必须先由 `computeAddition` 生成。返回源码的语义依赖 `@u1in/shushi-macro` 的公开宏契约。',
})

export const createAdditionGridScenePage = createLayoutApiPage({
  slug: 'createAdditionGridScene',
  summary: '兼容性地把 AdditionComputation 转换为 GridScene。',
  example: `import { computeAddition, createAdditionGridScene } from '@u1in/shushi-core'

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
  example: `import { computeSubtraction, createSubtractionGridScene } from '@u1in/shushi-core'

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
  example: `import { computeDivision, getDivisionPlaybackStepCount } from '@u1in/shushi-core'

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
  example: `import { computeDivision, createDivisionGridScene } from '@u1in/shushi-core'

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
  example: `import { computeMultiplication, getMultiplicationStepCount } from '@u1in/shushi-core'

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
  example: `import { computeMultiplication, createMultiplicationGridScene } from '@u1in/shushi-core'

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
  example: `import { computeShortDivision, createShortDivisionGridScene } from '@u1in/shushi-core'

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
  example: `import { compileCalculatorMacro, createAdditionMacroSource, computeAddition } from '@u1in/shushi-core'

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

export const createCompositeArithmeticMacroSourcePage = createLayoutApiPage({
  slug: 'createCompositeArithmeticMacroSource',
  summary: '把组合计算的所有步骤连续编排为单份可编辑宏源码。',
  example: `import {
  computeCompositeArithmetic,
  createCompositeArithmeticMacroSource,
  compileCalculatorMacro,
} from '@u1in/shushi-core'

const computation = computeCompositeArithmetic('125 + 75 - 20 × 3')
const source = createCompositeArithmeticMacroSource(computation, { visibleStepCount: 4 })
const scene = compileCalculatorMacro(source)`,
  purpose: '它把全局播放游标映射为各单项规则的局部帧，再将已到达步骤的行连续写入同一个完整 `GRID(...)` 源码。第二步及后续步骤先有一个独立事件引入运算符和第二操作数，下一帧才开始逐位过程；它们会复用紧邻上方的前一步结果，不重复写出首行操作数。组合宏不写入网页专属 ariaLabel 或页面 style KV，默认设置下可压缩为不含 KV 的顶层分号行；渲染器只接收一个普通 `GridScene`。',
  signature: `type CreateCompositeArithmeticMacroSource = (
  computation: CompositeArithmeticComputation,
  settings?: Partial<CompositeArithmeticRenderSettings>,
) => string`,
  parameters: [
    ['`computation`', '`CompositeArithmeticComputation`', '组合计算器输出的各单项过程。'],
    ['`settings.visibleStepCount`', '`number | undefined`', '组合播放的全局可见事件数；未设置时全部完成。'],
    ['`settings.showBorrowSteps`', '`boolean`', '是否显示减法借位点；默认 `false`，传入 `true` 后显示。'],
    ['返回值', '`string`', '包含全部已到达步骤的唯一 GRID 宏源码。'],
  ],
  caution: '返回值是一个连续竖式而非多个场景；布局只合并单项宏的行和横线，不在渲染器中重新解释组合步骤。',
})

export const getCompositeArithmeticStepCountPage = createLayoutApiPage({
  slug: 'getCompositeArithmeticStepCount',
  summary: '返回组合表达式所有单项规则串接后的全局播放步数。',
  example: `import { computeCompositeArithmetic, getCompositeArithmeticStepCount } from '@u1in/shushi-core'

const computation = computeCompositeArithmetic('12 + 8 - 5 × 4')
const stepCount = getCompositeArithmeticStepCount(computation)

console.log(stepCount)`,
  purpose: '它将加法/减法列步骤与乘法逐位、列加法步骤相加，并为第二步及后续步骤各加入一个“引入第二操作数”事件，使播放器的全局游标和组合宏源码的局部游标使用同一规则。',
  signature: `type GetCompositeArithmeticStepCount = (
  computation: CompositeArithmeticComputation,
) => number`,
  parameters: [
    ['`computation`', '`CompositeArithmeticComputation`', '组合计算器输出。'],
    ['返回值', '`number`', '组合播放事件总数。'],
  ],
  caution: '该数不是表达式运算符个数；多位单项竖式会贡献多个教学步骤，且除第一步外的每一段还会额外贡献一次第二操作数引入事件。',
})

export const shushiPage = createLayoutApiPage({
  slug: 'shushi',
  apiTier: 'common',
  summary: '解析一行算式，再生成计算过程、可编辑宏源码、场景与渲染结果。',
  example: `import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const host = document.querySelector('#result')
const { computation, source, rendered, inspection } = shushi('10230 ÷ 25', {
  calculation: { resultMode: 'decimal' },
  renderMode: 'div',
  el: host ?? undefined,
})

console.log(computation.quotientText) // '409.2'
console.log(rendered) // HTMLElement；已自动挂载到 host
const updated = inspection.updateElementText('grid-element-id', '9')
console.log(updated.source) // AST 不可变更新后的宏源码`,
  purpose: '这是 `@u1in/shushi-core` 面向大多数应用的表达式入口。它先把字符串解析为结构化 `shushiCore` 请求，再由后者委托既有计算器、布局器和统一宏编译链路。返回值保留 computation、source、scene、按模式生成的 rendered 和可注入的 inspection。renderMode 默认为 `svg-string`，可选 `div`、`svg` 或 `svg-string`；客户端模式传入 el 时会自动挂载。',
  signature: `type ShushiRenderMode = 'div' | 'svg' | 'svg-string'

type ShushiRenderOptions<TMode extends ShushiRenderMode = 'svg-string'> = {
  renderMode?: TMode
  el?: TMode extends 'svg-string' ? never : Element
  colorTheme?: AutoColorTheme
  fontFamily?: string
}

type Shushi = {
  <TMode extends ShushiRenderMode = 'svg-string'>(
    expression: string,
    options?: ShushiExpressionOptions<TMode>,
  ): AnyVerticalArithmeticResult<TMode>
}

type VerticalArithmeticResult<T, TRendered> = {
  computation: T
  source: string
  scene: GridScene
  rendered: TRendered
  inspection: MacroAstInspection
}`,
  parameters: [
    ['`expression`', '`string`', '加、减、乘支持 `+`、`-`、`×`、`*` 与 `x` 的任意组合；按书写顺序执行。'],
    ['`expression` 的除法形式', '`被除数 ÷ 除数` / `被除数 / 除数`', '长除法必须单独出现，不能和加减乘组合。'],
    ['`expression` 的短除法形式', '`|待分解数` / `|数1 数2`', '单个右值时分解质因数；多个右值时自动试除并求公因数。一次指定除法仅通过 `computeShortDivision` 或 `shushiCore` 的结构化 mode 使用。'],
    ['`expression` 的进制转换形式', '`(十进制数)目标进制`', '例如 `(124)2` 得到二进制短除过程；目标进制范围为 2–36。'],
    ['`options.calculation`', '`DivisionOptions & MultiplicationOptions`', '长除法小数模式或乘法快捷计算等计算层选项。'],
    ['`options.settings`', '`ShushiExpressionSettings`', '覆盖默认尺寸、教学标记、辅助网格和播放游标等布局配置。'],
    ['`options.colorTheme`', '`AutoColorTheme`', '覆盖 autoColor 的固定语义颜色；主题在编译阶段写入 GridScene，不依赖 CSS 继承或覆盖。'],
    ['`options.fontFamily`', '`string`', '在宏编译阶段写入场景默认字体；省略时为 renderer.css 内置的 STIX Two Math，改用其他字体时使用 renderer-without-font.css 加对应字体 CSS。'],
    ['`options.renderMode`', '`ShushiRenderMode`', '选择 `div`、`svg` 或 `svg-string`；省略时默认为 `svg-string`。'],
    ['`options.el`', '`Element`', '仅客户端 `div` / `svg` 模式可用；渲染结果会 append 到该元素下。'],
    ['`rendered`', '`HTMLElement | SVGSVGElement | string`', '按渲染模式返回 DOM 舞台、SVG 根节点或 SVG 字符串。'],
    ['`inspection`', '`MacroAstInspection`', '返回 AST、图元引用和 `updateElementText`，用于注入编辑或继续分析。'],
  ],
  caution: '解析器不执行通常的乘法优先级，而是按文本从左到右生成组合竖式；`÷`、`/` 不能与加减乘混用。`div` 和 `svg` 需要客户端 DOM，服务端调用会抛出错误；`svg-string` 不能传 el。浏览器 DOM 模式导入 `@u1in/shushi-core/renderer.css` 即可使用默认 STIX 字体；改用其他字体时使用 `renderer-without-font.css` 加对应字体 CSS。',
})

export const shushiCorePage = createLayoutApiPage({
  slug: 'shushiCore',
  apiTier: 'advanced',
  summary: '以结构化请求精确选择运算、计算选项和布局选项的高级入口。',
  example: `import { shushiCore } from '@u1in/shushi-core'

const { computation, scene } = shushiCore({
  operation: 'division',
  divisor: '25',
  dividend: '10230',
  calculation: { resultMode: 'decimal' },
})

console.log(computation.quotientText) // '409.2'
console.log(scene.ariaLabel)`,
  purpose: '它是 shushi 的结构化下层入口，也是需要质因数分解、完整短除法 mode、精确请求类型或运行时动态构造请求时的高级 API。它直接执行“计算 → 宏源码 → GridScene → 渲染”，但不解析表达式。',
  signature: `type ShushiCore = {
  <TMode extends ShushiRenderMode = 'svg-string'>(
    request: ShushiRequest<VerticalArithmeticRequest, TMode>,
  ): AnyVerticalArithmeticResult<TMode>
}`,
  parameters: [
    ['`request.operation`', "`'addition' | 'subtraction' | 'multiplication' | 'division' | 'shortDivision' | 'composite'`", '判别运算类型，并决定输入字段和 computation 返回类型。'],
    ['`request` 计算字段', '`values`、`operands`、`divisor`、`dividend`、`expression`', '按 operation 提供；长除法仍保持除数在前、被除数在后的字段顺序。'],
    ['`request.settings` / `calculation`', '`Partial<…RenderSettings>` / 专项计算选项', '精确控制教学标记、尺寸、播放与算法选项。'],
    ['返回值', '`VerticalArithmeticResult`', '含计算过程、可编辑源码、场景、渲染结果与 AST 检查器。'],
  ],
  caution: '普通数值算式优先使用 shushi；shushiCore 不会解析 `244 + 133 × 24` 这类文本。短除法 mode 仍支持 factorization、commonFactor、baseConversion 与 division。',
})

/** 布局公共 API 的页面顺序也用于 API 目录和页尾翻页。 */
export const layoutApiPages = [
  shushiPage,
  shushiCorePage,
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
  createCompositeArithmeticMacroSourcePage,
  getCompositeArithmeticStepCountPage,
]
