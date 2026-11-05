---
name: u1in-shushi
description: Use when an agent needs to install or use @u1in/shushi-core for vertical arithmetic calculation, teaching layouts, editable macro source, GridScene inspection, playback, DOM rendering, SVG rendering, or SSR SVG string output; implementation requests begin with an interactive requirements check.
---

# `u1in-shushi` Skill

这个 Skill 用于让 agent 使用 npm 包 `@u1in/shushi-core` 完成单项或组合竖式运算、教学步骤展示、可编辑宏源码、网格分析、DOM/SVG 渲染以及 SSR SVG 字符串输出任务。

## 0. 交互式启动流程（优先）

当用户通过 `$u1in-shushi` 请求新建或接入竖式时，先完成需求确认，再选择 API、读取实现资料或修改宿主代码。用户已经明确提供的信息不要重复询问；必要信息未齐全时，先提问并等待回答。

第一轮确认以下内容：

1. **计算式**：要计算的完整表达式或输入数据。表达式优先使用 `255 ÷ 5`、`|48`、`2|12`、`2|12 24` 或 `(124)2`；只有高级结构化请求才需明确短除法 `mode`。
2. **输出方式**：
   - 页面中的 DOM/CSS：需要页面、组件或 DOM 容器；
   - 浏览器 SVG 节点：需要页面或组件挂载位置；
   - SVG 字符串：用于 SSR、Node.js 或导出文件；
   - 仅返回计算结果、宏源码或 `GridScene`，不渲染。
3. **教学与交互**：是否保留可编辑宏源码，是否需要播放步骤、图元交互或完整结果。未指定时默认保留 `source` 和 `scene`，显示完整结果，不额外实现播放和交互。

识别运算类型后，向用户列出当前运算相关的配置并标注默认值；用户回复“默认”即可采用默认配置。不要要求用户重复填写不需要修改的选项：

- **通用网格**：`cellWidth=30`、`rowHeight=46`、`fontSizeRatio=1`、`showGuideGrid=false`、`visibleStepCount=完整结果`。
- **加法**：`showCarrySteps=true`。
- **减法**：`showBorrowSteps=true`。
- **乘法**：`showCarrySteps=true`、`uniformMultiplicationBars=false`；计算选项 `useTrailingZeroShortcut=true`、`preserveOperandOrder=false`。
- **长除法**：`resultMode=remainder`、`maxDecimalDigits=24`、`bracketBend=1`、`uniformSubtractionBars=false`、`showZeroQuotientSteps=false`。
- **短除法**：`showRemainders=true`。
- **组合竖式**：`showCarrySteps=true`、`showBorrowSteps=false`、`uniformMultiplicationBars=false`。

确认前不要选择宿主文件、决定渲染器或开始实现。数值竖式优先使用 `shushi(expression, option)`；只有需要结构化短除法请求、拆层调试、手写宏或高级几何时，才使用 `shushiCore` 或展开“计算器 → 布局器 → 宏编译器 → `GridScene` → 渲染器”链路。遵守宿主项目 `AGENTS.md`，并在完成后说明改动文件、使用的 API、输出方式和验证结果。

## 使用资料

这些资料与本文件一起分发。根据当前任务按需读取，不要在无关任务中加载全部资料：

- [安装说明](references/installation.md)：环境检查、安装、导入验证和安装故障。
- [完整 API 清单](references/api.md)：函数签名、参数意义、组合竖式与最简复制导出、AST 检查、网格和渲染 API。
- [公开出口补充清单](references/public-exports.md)：所有直接导出的辅助函数、完整结果类型、GridScene 类型、宏词表和主题常量。
- [实现工作流](references/workflows.md)：从用户需求选择计算器、布局器、宏处理和渲染组合。
- [故障排查](references/troubleshooting.md)：安装、导入、类型、渲染、计算和 AST 编辑问题。

需要精确实现常用 API 时读取 `references/api.md`；需要核对完整公开出口时同时读取 `references/public-exports.md`；需要安装时先读取 `references/installation.md`；需要编写功能时读取 `references/workflows.md`；遇到异常时读取 `references/troubleshooting.md`。

## 1. 安装与环境检查

安装任务只检查当前宿主是否能运行 Node.js 和包管理器，不要替宿主选择 shell、安装版本管理器、切换 Node 版本或修改 shell 配置。

```bash
node --version
npm --version
```

`@u1in/shushi-core` 不预设 Node.js `engines` 版本要求。若宿主已经有可用的 Node.js/npm，直接安装即可。安装包时使用当前发布版本：

```bash
npm install @u1in/shushi-core@latest
```

也可以使用宿主已经选择的 `pnpm`、`yarn` 或 `bun`，但不要在没有用户要求时更换包管理器或改写项目锁文件策略。

安装后只做与本包直接相关的检查：

```bash
npm ls @u1in/shushi-core --depth=0
```

纯数据 API 的最小导入验证：

```bash
node --input-type=module -e "import { computeAddition } from '@u1in/shushi-core'; console.log(computeAddition('12', '34').sumDigits)"
```

不要把宿主项目的 `typecheck`、全量测试、生产构建或无关锁文件 diff 当成包安装的收尾步骤。只有用户明确要求修改宿主项目时，才执行对应项目的验证命令。

## 2. 核心决策规则

1. 统一从 `@u1in/shushi-core` 导入公开 API，不依赖包内部路径或内部工作区。
2. 运算输入优先使用十进制字符串，避免大整数转换为 JavaScript `number` 后丢失精度。
3. 标准数值流程优先是：

   ```ts
   const result = shushi('356 + 278', {
     renderMode: 'div',
     el: document.querySelector('#result') ?? undefined,
   })
   ```

   `result` 包含 `computation`、`source`、`scene`、`rendered` 和 `inspection`。省略 `renderMode` 时返回 SSR 安全的 SVG 字符串；浏览器 DOM 使用 `div` 或 `svg`，服务端使用 `svg-string`。

4. 需要结构化 operation、短除法 mode、拆层调试或手写宏时，先使用 `shushiCore(request)`；进一步拆层时，标准流程是：

   ```text
   compute* → create*MacroSource → compileMacro → renderDomGrid/renderSvgGrid/renderSvgString
   ```

5. 计算器只负责运算过程和语义数据；布局器把计算结果转换成宏源码；宏编译器生成 `GridScene`；渲染器只消费 `GridScene`。
6. 用户给出或需要编辑宏源码时，使用 `parseMacro`、`formatMacro`、`completeMacro`、`minifyMacro`、`createMacroAstInspection` 和 `compileMacro`，不要重新实现运算；计算器宏的复制文本必须用 `minifyMacroForCopy`，不能自行裁剪字符串。
7. 浏览器渲染需要导入 `@u1in/shushi-core/style.css`；纯计算、宏处理、几何查询和文本提取不需要 CSS。
8. `renderDomGrid` 与 `renderSvgGrid` 需要浏览器 DOM；Node.js/SSR 场景使用纯数据 API、`compileMacro`、`renderSvgString` 或延迟到浏览器渲染。
9. `computeDivision` 的参数顺序是 `divisorValue, dividendValue`，即除数在前、被除数在后。
10. `createMacroAstInspection` 是不可变 API：`updateElementText` 返回新的检查结果，不修改旧对象；更新后必须用新结果的 `scene` 重新渲染。

## 3. 公开 API 速查

以下函数都从 `@u1in/shushi-core` 统一导入。完整字段、边界和返回结构见 [完整 API 清单](references/api.md)。

### 门户 API

```ts
type ShushiRenderMode = 'div' | 'svg' | 'svg-string'

shushi(expression: string, options?: ShushiExpressionOptions): AnyVerticalArithmeticResult
shushiCore(request: ShushiRequest<VerticalArithmeticRequest>): AnyVerticalArithmeticResult
```

数值输入优先调用 `shushi`。它解析加、减、乘组合以及独立的长除法、短除法和进制转换，再转交 `shushiCore`；`renderMode: 'div'` 返回并可挂载 `HTMLElement`，`'svg'` 返回并可挂载 `SVGSVGElement`，`'svg-string'` 返回可用于客户端和 SSR 的 SVG 字符串。省略 `renderMode` 时默认为 `'svg-string'`；`el` 仅可与客户端模式一起使用。返回的 `inspection` 可通过 `references` 定位图元，再调用 `updateElementText` 产生新的源码、场景和检查结果。

```ts
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const result = shushi('356 + 278', {
  renderMode: 'div',
  el: document.querySelector('#result') ?? undefined,
})

console.log(result.computation, result.source, result.rendered, result.inspection)
```

### 计算器

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
computeCompositeArithmetic(expression: unknown): CompositeArithmeticComputation
```

选项和输入形状：

```ts
interface MultiplicationOptions {
  useTrailingZeroShortcut?: boolean
  preserveOperandOrder?: boolean
}

interface DivisionOptions {
  resultMode?: 'decimal' | 'remainder'
  maxDecimalDigits?: number
}

interface ShortDivisionInput {
  mode: 'division' | 'factorization' | 'commonFactor' | 'baseConversion'
  values: unknown[]
  divisor?: unknown
  targetBase?: unknown
}
```

- `computeAddition` 至少接受两个非负整数字符串，也支持把数组作为单个参数传入。
- `computeSubtraction` 接受被减数和减数；负结果通过返回值表达，不要预先交换参数。
- `computeMultiplication` 返回部分积和逐位步骤；末尾零快捷过程可由 `useTrailingZeroShortcut` 控制。
- `computeDivision` 的 `remainder` 模式返回整数商和余数；`decimal` 模式使用 `maxDecimalDigits` 限制小数位。
- `computeShortDivision` 支持指定除数、质因数分解、公因数和 2–36 进制转换；不同模式对 `values` 数量有不同约束。
- `computeCompositeArithmetic` 按书写顺序串联 `+`、`-`、`×`；它不使用乘法优先级，且中间负数不能继续计算。

### 布局器与播放

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
createCompositeArithmeticMacroSource(
  computation: CompositeArithmeticComputation,
  settings?: Partial<CompositeArithmeticRenderSettings>,
): string
getMultiplicationStepCount(computation: MultiplicationComputation): number
getDivisionPlaybackStepCount(
  computation: DivisionComputation,
  showZeroQuotientSteps: boolean,
): number
getCompositeArithmeticStepCount(computation: CompositeArithmeticComputation): number
```

公共布局设置为：

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

运算专属设置包括：`showCarrySteps`、`showBorrowSteps`、`uniformMultiplicationBars`、`bracketBend`、`uniformSubtractionBars`、`showZeroQuotientSteps` 和 `showRemainders`。`CompositeArithmeticRenderSettings` 组合 `showCarrySteps`、`showBorrowSteps` 和 `uniformMultiplicationBars`。播放时使用库提供的步数函数填入 `visibleStepCount`，不要自行用数组长度推算。

### 宏处理和 AST 检查

```ts
parseMacro(source: string): MacroCall
compileMacro(source: string): GridScene
formatMacro(source: string): string
unformatMacro(source: string): string
completeMacro(source: string): string
minifyMacro(source: string, omitDefaults?: boolean): string
minifyMacroForCopy(source: string): string
minifyMacroForCopyAst(root: MacroCall): string
createMacroAstInspection(source: string): MacroAstInspection
```

`createMacroAstInspection` 同时返回 AST、编译后的场景和图元定位索引：

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

使用方式：

1. 通过 `inspection.scene.elements` 或渲染结果的 `data-grid-element-id` 得到图元 ID。
2. 通过 `inspection.references[elementId]` 得到对应 AST 节点、`nodePath`、可编辑的 `literalPath` 和当前 `text`。
3. 只有存在 `literalPath` 的图元适合文字编辑；线条、边框和纯符号可能没有可编辑字面量。
4. 调用 `updateElementText(elementId, nextText)` 得到新的完整检查结果。
5. 用新结果的 `scene` 重新渲染，并使用新结果的 `source` 保存编辑后的宏源码。

### 网格、几何和渲染

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

- `resolveGridMetrics` 把轨道和场景尺寸解析为可用于布局的几何数据。
- `getGridPositionRect` 和 `getGridElementRect` 只计算矩形，不创建 DOM。
- `getGridTextAnchor` 为 DOM/SVG 提供一致的文本锚点。
- `extractVisibleTextRows` 返回按视觉行拼接的非空文本。
- `renderDomGrid` 返回带线条层和内容层的 HTMLElement。
- `renderSvgGrid` 返回带 `viewBox` 和图元的 SVGSVGElement。
- `renderSvgString` 返回不依赖 DOM 的完整 SVG 字符串，适合 Node.js、SSR 和导出脚本。

## 4. 常用组合

### 数值运算到竖式渲染

```ts
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderDomGrid,
} from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const computation = computeAddition('356', '278')
const source = createAdditionMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showCarrySteps: true,
})
const scene = compileMacro(source)
const element = renderDomGrid(scene)
document.querySelector('#app')?.append(element)
```

替换运算类型时，只替换 `compute*` 和对应的 `create*MacroSource`；宏编译和渲染阶段保持不变。

### 组合运算、播放与复制

用户要求把多次加、减、乘放在同一个连续竖式时，不要将多个单项宏用字符串或页面坐标拼接。表达式按书写顺序计算，使用组合 API：

```ts
const computation = computeCompositeArithmetic('500 + 1 - 237 × 2')
const source = createCompositeArithmeticMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showCarrySteps: true,
  showBorrowSteps: true,
  uniformMultiplicationBars: false,
  visibleStepCount: getCompositeArithmeticStepCount(computation),
})
const scene = compileMacro(source)
const copyText = minifyMacroForCopy(source)
```

`visibleStepCount` 从 `0` 播放到 `getCompositeArithmeticStepCount(computation)`。后续步骤先引入运算符和第二操作数，再播放本步骤；上一结果会复用为下一步第一行。若后续是减法，借位点仍应显示在这条复用结果行。`copyText` 是宏编辑器的复制内容：它不含网页的 `ariaLabel`、`style`，并会把 `CELL(MM(1))`、`CELL(RB(1))` 分别压为 `1`、`RB(1)`；`[RB(1)]` 仍是可接受的显式单元格输入。

### DOM 和 SVG 使用同一份场景

```ts
const scene = compileMacro(source)
const dom = renderDomGrid(scene)
const svg = renderSvgGrid(scene)
```

不要为 DOM 和 SVG 分别实现运算规则或重新计算坐标。

### 教学播放

```ts
const computation = computeMultiplication('97', '89')
const visibleStepCount = getMultiplicationStepCount(computation)
const source = createMultiplicationMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  uniformMultiplicationBars: false,
  showCarrySteps: true,
  visibleStepCount: 0,
})
```

界面只需改变 `visibleStepCount` 并重新执行布局、编译和渲染；不要修改计算结果对象。

### 宏编辑器和图元交互

```ts
const inspection = createMacroAstInspection(source)
const stage = renderDomGrid(inspection.scene)
const node = stage.querySelector<HTMLElement>('[data-grid-element-id]')
const elementId = node?.dataset.gridElementId
const reference = elementId ? inspection.references[elementId] : undefined

if (reference?.literalPath) {
  const next = inspection.updateElementText(reference.elementId, '8')
  const nextStage = renderDomGrid(next.scene)
  console.log(next.source)
  void nextStage
}
```

## 5. 故障处理

- npm 404：先检查 `npm view @u1in/shushi-core dist-tags.latest`，确认 registry 和包名；不要擅自切换 registry。
- 找不到导出：确认从 `@u1in/shushi-core` 导入，且没有使用包内部路径；再次对照 API 清单。
- 浏览器没有样式：导入 `@u1in/shushi-core/style.css`，并确认构建工具允许 CSS 包导出。
- Node/SSR 报 `document is not defined`：不要调用 `renderDomGrid` 或 `renderSvgGrid`，把它们延迟到浏览器端；需要服务端 SVG 时使用 `renderSvgString`。
- 除法结果颠倒：确认调用顺序是 `computeDivision(divisor, dividend)`。
- 大数结果不准确：不要把输入先转换成 `number`，使用字符串。
- 播放末尾少步骤：使用 `getMultiplicationStepCount` 或 `getDivisionPlaybackStepCount`，不要按数组长度计算。
- 组合竖式少第二操作数、重复上一结果或缺少借位点：使用 `createCompositeArithmeticMacroSource` 和 `getCompositeArithmeticStepCount`，不要拼接单项宏或自行跳过减法第一行。
- 复制的计算器宏仍包含页面参数或不是最简：使用 `minifyMacroForCopy`；不要用正则删除 `KV(...)`，也不要把场景或 OCR 文本反向拼成宏。
- AST 图元没有 `literalPath`：该图元可能是线条、边框或纯符号，不能通过 `updateElementText` 修改文字。
- AST 更新后画面不变：使用新检查结果的 `scene` 重新渲染，不要复用旧 DOM 或旧场景。
- 安装任务完成后：只检查包是否在依赖树中、纯数据 API 是否能导入；不要默认执行宿主项目的全量测试、构建或配置修改。

## 6. 交付边界

完成任务时返回最小但可用的结果：需要代码时给出实际导入、调用和渲染代码；需要宏编辑时保留 `source`、`scene` 和 `references` 的关系；需要故障处理时说明具体失败点和下一步检查。不要把内部实现、宿主项目名称或无关工程命令暴露给只需要使用 npm 包的用户。
