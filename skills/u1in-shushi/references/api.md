---
title: Agent 功能说明
---

# `@u1in/shushi-core` Agent 功能说明

这是一份给代码 Agent 使用的功能参考。阅读后，Agent 可以根据用户需求选择计算、竖式过程生成、宏源码编辑、GridScene 分析或 DOM/SVG 渲染能力。

## 1. 核心工作流

`@u1in/shushi-core` 把“算出结果”和“画出竖式”拆成可组合的步骤：

```text
用户输入
  → 运算计算器（Computation）
  → 运算布局器（可编辑宏源码）
  → 宏编译器（GridScene）
  → DOM 或 SVG 渲染器
```

每一层职责不同：

| 层 | 主要 API | 输出 | 适合的任务 |
| --- | --- | --- | --- |
| 计算 | `computeAddition`、`computeDivision` 等 | 运算过程数据 | 得到答案、进位/借位/余数、逐步过程 |
| 布局 | `createAdditionMacroSource` 等 | 可编辑宏源码字符串 | 得到标准竖式、复制到宏编辑器、逐步播放 |
| 编译 | `compileMacro`、`parseMacro` | `GridScene` 或 AST | 将宏源码变成统一场景、检查源码 |
| 场景工具 | `resolveGridMetrics`、`extractVisibleTextRows` | 几何数据或视觉文本行 | 测量、OCR 对照、无 DOM 分析 |
| 渲染 | `renderDomGrid`、`renderSvgGrid`、`renderSvgString` | `HTMLElement`、`SVGSVGElement` 或 SVG 字符串 | 网页显示、SSR 输出或导出竖式 |

通常不要跳过计算器和布局器，直接在渲染器里拼接运算规则或像素坐标。需要自定义内容时，才直接编写宏源码并交给 `compileMacro`。

## API 技术签名与参数

以下签名均从 `@u1in/shushi-core` 统一导入。类型名称用于说明参数和返回值，不需要在 JavaScript 运行时导入。

### 计算器签名

```ts
computeAddition(...values: unknown[]): AdditionComputation
computeSubtraction(minuendValue: unknown, subtrahendValue: unknown): SubtractionComputation
computeMultiplication(
  multiplicandValue: unknown,
  multiplierValue: unknown,
  options?: MultiplicationOptions,
): MultiplicationComputation
computeDivision(
  divisorValue: unknown,
  dividendValue: unknown,
  options?: DivisionOptions,
): DivisionComputation
computeShortDivision(input: ShortDivisionInput): ShortDivisionComputation
```

| API | 参数 | 参数含义 | 返回值重点 |
| --- | --- | --- | --- |
| `computeAddition` | `values` | 两个或更多非负整数字符串；也可传入一个数组 | `addendDigits`、`sumDigits`、逐列 `steps` |
| `computeSubtraction` | `minuendValue`、`subtrahendValue` | 被减数、减数；都应是非负整数字符串 | `differenceDigits`、`resultText`、`isNegative`、借位步骤 |
| `computeMultiplication` | `multiplicandValue`、`multiplierValue` | 被乘数、乘数；都应是非负整数字符串 | `productDigits`、`partialProducts`、加法汇总步骤 |
| `computeDivision` | `divisorValue`、`dividendValue` | 除数、被除数；顺序是除数在前 | `quotientText`、`remainder`、试商步骤 |
| `computeShortDivision` | `input` | 包含 `mode`、`values` 和可选 `targetBase` 的对象 | 按模式返回质因数、公因数或进制转换过程 |

计算器共用以下输入约定：传入字符串可以避免长整数转换为 JavaScript `number` 后丢失精度；非法字符、负数和空值会抛出输入错误。计算结果只包含语义过程，不包含 DOM、CSS 或像素坐标。

#### 计算器选项类型

```ts
interface MultiplicationOptions {
  useTrailingZeroShortcut?: boolean
}

interface DivisionOptions {
  resultMode?: 'decimal' | 'remainder'
  maxDecimalDigits?: number
}

interface ShortDivisionInput {
  mode: 'factorization' | 'commonFactor' | 'baseConversion'
  values: unknown[]
  targetBase?: unknown
}
```

- `useTrailingZeroShortcut`：乘法是否把乘数末尾零拆出后再计算，默认开启；关闭后使用完整逐位过程。
- `resultMode`：除法使用有限小数模式或整数余数模式；默认是 `'remainder'`。
- `maxDecimalDigits`：有限小数模式最多尝试的小数位数，必须是正整数。
- `ShortDivisionInput.mode`：`factorization` 需要一个正整数，`commonFactor` 至少需要两个正整数，`baseConversion` 需要一个十进制整数和 2–36 的目标进制。

### 布局器签名

布局器把计算结果转换为可编辑的宏源码，而不是直接返回 DOM：

```ts
createAdditionMacroSource(
  computation: AdditionComputation,
  settings?: Partial<AdditionRenderSettings>,
): string

createSubtractionMacroSource(
  computation: SubtractionComputation,
  settings: SubtractionRenderSettings,
): string

createMultiplicationMacroSource(
  computation: MultiplicationComputation,
  settings: MultiplicationRenderSettings,
): string

createDivisionMacroSource(
  computation: DivisionComputation,
  settings: RenderSettings,
): string

createShortDivisionMacroSource(
  computation: ShortDivisionComputation,
  settings: ShortDivisionRenderSettings,
): string
```

所有布局设置都包含以下公共字段：

```ts
interface GridRenderSettings {
  cellWidth: number
  rowHeight: number
  fontSizeRatio: number
  showGuideGrid: boolean
  visibleStepCount?: number
  textHorizontalAlign?: 'left' | 'center' | 'right'
  textVerticalAlign?: 'top' | 'center' | 'bottom'
}
```

运算专属字段如下：

| 设置类型 | 专属参数 | 含义 |
| --- | --- | --- |
| `AdditionRenderSettings` | `showCarrySteps` | 是否显示进位注记 |
| `SubtractionRenderSettings` | `showBorrowSteps` | 是否显示借位注记 |
| `MultiplicationRenderSettings` | `uniformMultiplicationBars`、`showCarrySteps` | 部分积横线是否等宽；是否显示进位 |
| `RenderSettings` | `bracketBend`、`uniformSubtractionBars`、`showZeroQuotientSteps` | 除法弯折参数；减法横线是否等宽；是否显示试商为 0 的步骤 |
| `ShortDivisionRenderSettings` | `showRemainders` | 进制转换时是否显示每步余数 |

`cellWidth`、`rowHeight` 使用 CSS 像素；`fontSizeRatio` 是相对于单元格字号的比例；`visibleStepCount` 从 0 开始表示显示到哪一个教学步骤，省略时生成完整结果。除加法外，其他 `create*MacroSource` 需要传入完整的运算设置对象。

播放步数 API：

```ts
getMultiplicationStepCount(computation: MultiplicationComputation): number
getDivisionPlaybackStepCount(
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): number
```

步数应传给布局设置的 `visibleStepCount`；不要自行根据数组长度推算乘法或除法的播放步数，因为快捷计算、零商步骤和小数分隔符都会影响播放事件数量。

### 宏处理签名

```ts
parseMacro(source: string): MacroCall
compileMacro(source: string): GridScene
formatMacro(source: string): string
unformatMacro(source: string): string
completeMacro(source: string): string
minifyMacro(source: string, omitDefaults?: boolean): string
createMacroAstInspection(source: string): MacroAstInspection
```

| API | 参数含义 | 返回值和使用场景 |
| --- | --- | --- |
| `parseMacro` | 完整或带语法糖的宏源码 | 宏 AST；用于语法检查和编辑器处理 |
| `compileMacro` | 可编译的宏源码 | `GridScene`；这是进入渲染器的标准入口 |
| `formatMacro` | 宏源码 | 按层级格式化，并保留输入风格信息 |
| `unformatMacro` | 宏源码 | 压成单行，但不主动省略完整结构 |
| `completeMacro` | 宏源码 | 展开为显式 `GRID`、`ROW`、`CELL` 和完整宏名 |
| `minifyMacro` | 宏源码、是否省略默认值 | 生成最简合法宏源码；`omitDefaults` 默认是 `true` |
| `createMacroAstInspection` | 宏源码 | AST 节点、元素引用和可编辑定位信息 |

`formatMacro`、`completeMacro` 和 `minifyMacro` 都会先解析源码；源码非法时应把解析错误反馈给用户，不要猜测或静默修复运算含义。

#### `createMacroAstInspection` 返回结构

`createMacroAstInspection(source)` 不只是返回 AST。它会同时编译场景，并建立“渲染图元 → AST 节点 → 可编辑文字”的回溯索引：

```ts
type MacroNodePath = readonly number[]
type MacroSourceStyle = 'formatted' | 'minified'

interface MacroElementAstReference {
  elementId: string
  node: MacroNode
  nodePath: MacroNodePath
  literalPath?: MacroNodePath
  text?: string
}

interface MacroAstInspection {
  ast: MacroCall
  scene: GridScene
  sourceStyle: MacroSourceStyle
  source: string
  minifiedSource: string
  references: Readonly<Record<string, MacroElementAstReference>>
  updateElementText: (elementId: string, text: string) => MacroAstInspection
}
```

字段含义：

| 字段 | 含义 |
| --- | --- |
| `ast` | 宏源码的根 `MacroCall`；节点只有 `call`、`literal`、`symbol` 三种形态 |
| `scene` | 与该 AST 对应的 `GridScene`；可以直接交给 DOM、SVG 或 SVG 字符串渲染器 |
| `sourceStyle` | 输入源码被识别为 `formatted` 还是 `minified` |
| `source` | 按 `sourceStyle` 重新输出的源码，可作为编辑器当前文本 |
| `minifiedSource` | 始终压缩后的合法源码 |
| `references` | 以 `GridElement.id` 为键的图元回溯表 |
| `updateElementText` | 不可变地替换某个图元关联的文字，并返回新的检查结果 |

`MacroElementAstReference` 字段含义：

- `elementId`：对应 `GridScene.elements` 和渲染 DOM/SVG 节点的 ID。渲染器会把它写入 `data-grid-element-id`。
- `node`：生成该图元的宏 AST 节点；`call` 有 `name` 和 `arguments`，`literal` 有 `value`，`symbol` 有 `name`。
- `nodePath`：从根 AST 开始的参数下标路径。根节点是 `[]`，进入第一个参数是 `[0]`，进入该参数的第二个子参数是 `[0, 1]`。
- `literalPath`：该图元下第一个可编辑文字字面量的路径。没有文字的 `LINE`、圆角或纯符号图元可能没有此字段。
- `text`：当 `literalPath` 存在时，对应字面量的当前文字；没有可编辑文字时省略。

典型的“点击图元并修改文字”流程：

```ts
import { createMacroAstInspection, renderDomGrid } from '@u1in/shushi-core'

const source = '3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;'
const inspection = createMacroAstInspection(source)
const stage = renderDomGrid(inspection.scene)

// 外层交互组件从被点击的 DOM 节点取得 elementId。
const clickedNode = stage.querySelector<HTMLElement>('[data-grid-element-id]')
const elementId = clickedNode?.dataset.gridElementId
const reference = elementId ? inspection.references[elementId] : undefined

if (reference?.literalPath) {
  const nextInspection = inspection.updateElementText(reference.elementId, '8')
  const nextStage = renderDomGrid(nextInspection.scene)
  console.log(nextInspection.source)
  void nextStage
}
```

`updateElementText` 不会原地修改 `inspection`，而是返回包含新 `ast`、`scene`、`source` 和 `references` 的完整新对象，适合实现撤销/重做。传入不存在的 `elementId`，或传入没有 `literalPath` 的线条、边框和纯符号图元，会抛出错误。更新后必须使用新检查结果的 `scene` 重新渲染，不能继续使用旧场景。

### 场景、几何与渲染签名

```ts
resolveGridMetrics(scene: GridScene): GridMetrics
getGridPositionRect(position: GridPosition, metrics: GridMetrics): GridRect
getGridElementRect(element: GridElement, metrics: GridMetrics): GridRect
getGridTextAnchor(
  rect: GridRect,
  horizontalAlign: GridTextHorizontalAlign,
  verticalAlign: GridTextVerticalAlign,
): GridTextAnchor
extractVisibleTextRows(scene: GridScene): string[]
renderDomGrid(scene: GridScene): HTMLElement
renderSvgGrid(scene: GridScene): SVGSVGElement
renderSvgString(scene: GridScene): string
```

| API | 参数含义 | 返回值 |
| --- | --- | --- |
| `resolveGridMetrics` | 已编译的场景 | 包含 `width`、`height`、`columnOffsets` 和 `rowOffsets` 的解析尺寸 |
| `getGridPositionRect` | 网格单元、边、边中点或交点及已解析尺寸 | 包含 `left`、`top`、`width`、`height` 的 `GridRect`，不创建 DOM |
| `getGridElementRect` | 图元和已解析尺寸 | 图元声明位置对应的 `GridRect` |
| `getGridTextAnchor` | 几何矩形和水平/垂直对齐方式 | 包含 `x`、`y` 及对齐字段的三个渲染入口共用文本锚点 |
| `extractVisibleTextRows` | 已编译的场景 | 按视觉行拼接的非空文本数组 |
| `renderDomGrid` | 已编译的场景 | 带线条层和内容层的 `HTMLElement` |
| `renderSvgGrid` | 已编译的场景 | 带 `viewBox` 和图元的 `SVGSVGElement` |
| `renderSvgString` | 已编译的场景 | 不依赖 DOM 的完整 SVG 字符串 |

`GridScene` 的关键字段是：`columns`、`rows`（轨道）；`padding`、`unitWidth`、`unitHeight`（几何尺寸）；`fontSize`、默认文本样式和对齐方式；`elements`（文字、线条、圆角图元）；`showGuideGrid`；`ariaLabel`。渲染器只消费这些通用字段，不识别具体运算。

## 2. 五类运算能力

### 2.1 加法

```ts
const computation = computeAddition('356', '278')
const source = createAdditionMacroSource(computation)
```

- `computeAddition(...values)` 支持两个或更多非负整数字符串，也支持传入一个数组。
- 结果包含 `sumDigits` 和逐列 `steps`。
- 每个步骤包含本列加数、`carryIn`、总和、结果位和 `carryOut`。
- `createAdditionMacroSource` 默认生成完整结果并显示进位；可以用 `visibleStepCount` 和 `showCarrySteps` 控制教学过程。

### 2.2 减法

```ts
const computation = computeSubtraction('502', '137')
const source = createSubtractionMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showBorrowSteps: true,
})
```

- `computeSubtraction(minuend, subtrahend)` 接收两个非负整数字符串。
- 被减数小于减数时不会抛错；结果通过 `isNegative` 和 `resultText` 表示，布局器仍会生成可教学的借位过程。
- `steps` 包含 `borrowIn`、借位后的被减数位、结果位和 `borrowOut`。
- `showBorrowSteps: true` 时，宏源码会包含借位标记。

### 2.3 乘法

```ts
const computation = computeMultiplication('97', '89', {
  useTrailingZeroShortcut: true,
})
const source = createMultiplicationMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
})
```

- `computeMultiplication(multiplicand, multiplier, options)` 输出部分积、逐位乘法步骤和最终积。
- 输入应使用整数字符串，避免大整数转换为 JavaScript `number` 后丢失精度。
- `useTrailingZeroShortcut` 默认开启；关闭后使用完整逐位乘法过程。
- `getMultiplicationStepCount(computation)` 返回适合播放控件使用的总步数。

### 2.4 长除法

```ts
const computation = computeDivision('25', '10230', {
  resultMode: 'decimal',
  maxDecimalDigits: 24,
})
const source = createDivisionMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  bracketBend: 1,
  uniformSubtractionBars: false,
  showZeroQuotientSteps: false,
})
```

- 参数顺序是 `computeDivision(divisor, dividend)`，不要与常见的“被除数在前”函数顺序混淆。
- 除数不能为 0；两个输入都是非负整数字符串。
- `resultMode: 'remainder'` 返回整数商和余数；`resultMode: 'decimal'` 尝试生成有限小数，`maxDecimalDigits` 限制小数位数。
- `steps` 记录每次试商、部分被除数、乘积和余数。
- `getDivisionPlaybackStepCount(computation, showZeroQuotientSteps)` 返回播放步数。

### 2.5 短除法

```ts
const computation = computeShortDivision({
  mode: 'factorization',
  values: ['48'],
})
const source = createShortDivisionMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showRemainders: true,
})
```

`computeShortDivision` 通过 `mode` 选择三种用途：

| `mode` | 输入 | 输出重点 |
| --- | --- | --- |
| `'factorization'` | `values` 中的一个正整数 | 质因数、因式分解文本、约数个数和约数和 |
| `'commonFactor'` | `values` 中至少两个正整数 | 最大公约数 `gcd`、最小公倍数 `lcm` |
| `'baseConversion'` | 一个十进制整数和 `targetBase` | 2–36 进制转换、每步余数 |

短除法结果的 `steps`、`finalValues` 和模式专属字段可直接用于教学面板或结果摘要。

## 3. 最常用的完整组合

### 3.1 从数值生成并显示加法竖式

这是网页应用最常用的组合：计算 → 生成宏源码 → 编译场景 → DOM 渲染。

```ts
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderDomGrid,
} from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const computation = computeAddition('356', '278')
const source = createAdditionMacroSource(computation)
const scene = compileMacro(source)
const stage = renderDomGrid(scene)

document.querySelector('#result')?.append(stage)
```

这条链路同时得到三种可用结果：

- `computation`：答案和逐列过程；
- `source`：用户可以复制、修改的宏源码；
- `scene`/`stage`：可直接交给页面显示的统一场景和 DOM。

### 3.2 同一份场景切换 DOM 与 SVG

计算和编译只做一次，渲染器可以按宿主环境选择：

```ts
import { compileMacro, renderDomGrid, renderSvgGrid } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const scene = compileMacro(source)
const domStage = renderDomGrid(scene)
const svgStage = renderSvgGrid(scene)
```

- DOM 适合交互式页面、元素回查和播放控制。
- SVG 适合导出、截图、缩放和无 HTML 图层的展示。
- 三个渲染入口消费同一个 `GridScene`，不要为 DOM、SVG 节点和 SVG 字符串分别计算一套布局。
- `renderSvgGrid` 与 `renderSvgString` 还共享无 DOM SVG 渲染树；它们保证结构、坐标、属性和图元顺序一致，但不承诺浏览器重新序列化后的字符串与 SSR 输出逐字节相同。

### 3.3 教学播放或逐步显示

计算器保留完整过程，布局器通过 `visibleStepCount` 生成某一帧：

```ts
const computation = computeMultiplication('97', '89')
const totalSteps = getMultiplicationStepCount(computation)

const source = createMultiplicationMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
  visibleStepCount: Math.min(3, totalSteps),
})

const scene = compileMacro(source)
```

播放时只改变 `visibleStepCount` 并重新生成宏源码和场景，不要修改已经渲染出的 DOM 图元来模拟运算规则。

### 3.4 取得视觉文本行

```ts
const rows = extractVisibleTextRows(scene)
```

`extractVisibleTextRows` 不需要 DOM，会按照渲染锚点把非空文本拼成视觉行。它适合：

- 与 OCR 结果逐行比较；
- 给无障碍或纯文本面板提供内容；
- 检查进位、借位、商和余数是否出现在预期行。

### 3.5 手工宏源码的编辑和检查

当用户直接提供宏源码，而不是数值输入时，使用宏 API：

```ts
import {
  compileMacro,
  createMacroAstInspection,
  formatMacro,
  minifyMacro,
  parseMacro,
} from '@u1in/shushi-core'

const source = '3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;'
const ast = parseMacro(source)
const formatted = formatMacro(source)
const compact = minifyMacro(source)
const inspection = createMacroAstInspection(source)
const scene = compileMacro(source)
```

- `parseMacro`：把源码解析为 AST，适合语法校验和编辑器能力。
- `formatMacro`：补全并格式化源码。
- `minifyMacro`：压缩源码，适合保存或传输。
- `createMacroAstInspection`：取得 AST 节点与可定位元素的检查信息。
- `compileMacro`：把完整宏源码编译为 `GridScene`。

## 4. 网格和渲染工具

当用户需要测量、标注或分析已经编译的场景时，可以使用以下 API：

| API | 用途 |
| --- | --- |
| `resolveGridMetrics(scene)` | 解析行列轨道、总宽高和偏移量 |
| `getGridPositionRect(position, metrics)` | 取得一个网格位置的几何矩形 |
| `getGridElementRect(element, metrics)` | 取得图元的几何矩形 |
| `getGridTextAnchor(rect, horizontalAlign, verticalAlign)` | 计算文本锚点 |
| `extractVisibleTextRows(scene)` | 提取视觉文本行 |
| `GridScene` | 统一描述轨道、单元格、文字、线条和语义样式 token |

这些 API 只描述通用网格，不判断“这是加法还是除法”。运算语义应由对应的计算器和布局器负责。

## 5. Agent 任务选择规则

收到用户需求时，可以按以下规则选择 API：

| 用户需求 | 推荐组合 |
| --- | --- |
| 只要计算答案 | 对应的 `compute*` |
| 要展示标准竖式 | `compute*` → `create*MacroSource` → `compileMacro` → `renderDomGrid` 或 `renderSvgGrid` |
| 要用户可以继续编辑 | 返回 `create*MacroSource` 的源码，并允许再次 `compileMacro` |
| 要播放计算步骤 | `compute*` → `get*StepCount` → 带 `visibleStepCount` 的 `create*MacroSource` |
| 用户已经提供宏源码 | `parseMacro` / `formatMacro` / `createMacroAstInspection` → `compileMacro` |
| 要做 OCR、文本比对或无障碍摘要 | `compileMacro` → `extractVisibleTextRows` |
| 要导出或缩放图像 | 浏览器用 `compileMacro` → `renderSvgGrid`；服务端用 `compileMacro` → `renderSvgString` |
| 要在网页中交互显示 | `compileMacro` → `renderDomGrid`，并导入 `@u1in/shushi-core/style.css` |

## 6. 输入与边界规则

- 数值运算优先传入字符串，例如 `'12345678901234567890'`，避免 JavaScript `number` 的精度损失。
- 加法至少需要两个加数；减法、乘法和长除法各需要两个操作数。
- 长除法调用顺序是“除数在前、被除数在后”：`computeDivision(divisor, dividend)`。
- 除法的除数不能为 0；短除法的公因数模式至少需要两个正整数。
- 短除法的质因数分解和公因数模式输入不超过 `1,000,000,000`；进制转换支持任意长度的十进制字符串。
- 短除法进制转换的 `targetBase` 必须在 2 到 36 之间。
- `renderDomGrid` 和 `renderSvgGrid` 需要浏览器 DOM；`renderSvgString`、计算、布局、宏解析、编译和文本提取可以在 Node.js 或 SSR 中执行。
- 浏览器渲染入口应导入 `@u1in/shushi-core/style.css`，否则图元的定位、字体和线条默认样式可能不完整。
- 不要在渲染器中手工判断进位、借位、部分积、商或余数；这些信息必须来自计算结果和布局器生成的语义 token。

## 7. 最小可用判断

如果用户只给出两个数和一个运算，Agent 应优先使用对应的 `compute*`、`create*MacroSource`、`compileMacro` 和渲染器组合。如果用户给出的是宏源码，直接走宏解析与编译链路。除非用户只需要答案，否则应保留宏源码或 `GridScene`，这样后续可以继续编辑、播放、分析或切换渲染方式。


