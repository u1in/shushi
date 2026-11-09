---
title: Agent 能力说明
---

# `@u1in/shushi-core` Agent 能力说明

## 0. 运行环境与构建兼容性

`@u1in/shushi-core` 的 Node.js 运行时最低版本为 `16.6`。npm 发布的 JavaScript 产物使用 ES2019 语法级别，可被仍使用旧版 Webpack 解析器的宿主直接解析；这只降低语法目标，不会为旧浏览器补充 `ResizeObserver`、DOM 或其他运行时 API。浏览器 DOM/SVG 渲染按现代浏览器支持，Node.js 或 SSR 应使用无 DOM 的 `svg-string` 模式。

## 1. 先选对入口

当前公开 API 只有两层门户：

| 用户需求                   | 首选入口                                                    | 说明                                                         |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 用户给出一段算式或竖式输入 | `shushi(expression, options?)`                              | 自动识别运算并完成计算、布局、宏编译和渲染                   |
| 程序已经有结构化请求       | `shushiCore(request)`                                       | 明确指定 `operation`、短除法 `mode`、计算选项和布局 settings |
| 只想取计算过程             | `compute*`                                                  | 不生成宏源码，不接触 DOM                                     |
| 需要编辑或复制宏源码       | `source`、`parseMacro`、`formatMacro`、`minifyMacroForCopy` | 宏仍由统一编译器生成和检查                                   |
| 需要测量或分析网格         | `scene`、`resolveGridMetrics`、`extractVisibleTextRows`     | 直接消费统一 `GridScene`                                     |

不要从页面、DOM、SVG 或答案字符串重新实现计算和布局。所有数值门户最终都经过同一条链路：

```text
shushi(expression) ─┐
                    ├→ calculators → layout → macro → GridScene → renderer
shushiCore(request) ┘
人工宏源码 ───────────────→ macro → GridScene → renderer
```

## 2. 表达式入口 `shushi`

### 签名

```typescript
type ShushiRenderMode = 'div' | 'svg' | 'svg-string'

type AutoColorTheme = {
  text: string
  carry: string
  borrow: string
  operator: string
  decimal: string
  strike: string
  rule: { color?: string; thickness?: number }
  bracketRule: { color?: string; thickness?: number }
}

type ShushiExpressionOptions<TMode extends ShushiRenderMode = 'svg-string'> = {
  renderMode?: TMode
  el?: TMode extends 'svg-string' ? never : Element
  calculation?: DivisionOptions & MultiplicationOptions
  settings?: ShushiExpressionSettings
  colorTheme?: AutoColorTheme
  fontFamily?: string
}

shushi(
  expression: string,
  options?: ShushiExpressionOptions,
): AnyVerticalArithmeticResult
```

默认 `renderMode` 是 `svg-string`。返回值始终包含：

```typescript
type AnyVerticalArithmeticResult = {
  computation: /* 与 operation 对应的计算过程 */
  source: string
  scene: GridScene
  rendered: string | HTMLElement | SVGSVGElement
  inspection: MacroAstInspection
}
```

### 输入语法

| 输入                            | 含义                                    |
| ------------------------------- | --------------------------------------- |
| `125 + 75 - 20 × 3`             | 按书写顺序执行的连续表达式              |
| `356 + 278`                     | 加法竖式                                |
| `1.2 + 3.04`                    | 小数加法竖式，按小数点对齐              |
| `502 - 137`                     | 减法竖式                                |
| `97 × 89`、`97 * 89`、`97 x 89` | 乘法竖式                                |
| `1.2 × 3.4`                     | 小数乘法竖式                            |
| `10230 ÷ 25`、`10230 / 25`      | 长除法                                  |
| `34.5 ÷ 5`、`3.45 / 0.5`        | 小数长除法，自动进行等值右移            |
| `                               | 48`                                     | 分解质因数         |
| `                               | 12 18`                                  | 自动试除并求公因数 |
| `(13)2`                         | 十进制 13 转为二进制；目标进制支持 2–36 |

加法、乘法和长除法可使用非负小数；减法和短除法始终只接受整数。连续表达式不使用乘法优先级，而是从左向右执行。长除法不能与加减乘混写，会先把除数右移为整数并同步处理被除数；未除尽时默认最多补零展开十位商小数。短除法语法中的空格用于分隔多个右侧数字。

### 常用示例

```typescript
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const result = shushi('125 + 75 - 20 × 3', {
  renderMode: 'div',
  el: document.querySelector('#result') ?? undefined,
  settings: {
    cellWidth: 32,
    rowHeight: 46,
    showGuideGrid: false,
  },
})

console.log(result.computation, result.source, result.scene, result.inspection)
```

## 3. 结构化入口 `shushiCore`

### 签名和请求形状

```typescript
type ShushiRequest<TRequest, TMode extends ShushiRenderMode = 'svg-string'> =
  TRequest & ShushiRenderOptions<TMode>

type VerticalArithmeticRequest =
  | { operation: 'addition'; values: readonly unknown[]; settings?: Partial<AdditionRenderSettings> }
  | { operation: 'subtraction'; operands: readonly [unknown, unknown]; settings?: Partial<SubtractionRenderSettings> }
  | { operation: 'multiplication'; operands: readonly [unknown, unknown]; calculation?: MultiplicationOptions; settings?: Partial<MultiplicationRenderSettings> }
  | { operation: 'division'; divisor: unknown; dividend: unknown; calculation?: DivisionOptions; settings?: Partial<RenderSettings> }
  | { operation: 'shortDivision'; mode: ShortDivisionMode; values: unknown[]; divisor?: unknown; targetBase?: unknown; settings?: Partial<ShortDivisionRenderSettings> }
  | { operation: 'composite'; expression: unknown; settings?: Partial<CompositeArithmeticRenderSettings> }

shushiCore(request: ShushiRequest<VerticalArithmeticRequest>): AnyVerticalArithmeticResult
```

长除法的结构化参数顺序固定为 `divisor` 在前、`dividend` 在后；表达式入口则遵循用户书写方向，例如 `10230 / 25` 表示被除数 10230、除数 25。

`calculation.maxDecimalDigits` 是长除法补零展开控制项：已有输入小数位会先完整计算；省略时后续默认最多补零十位，传入正整数时覆盖这个上限。若仍未除尽则保留截断小数、过程和当前余数。

### 结构化示例

```typescript
import { shushiCore } from '@u1in/shushi-core'

const division = shushiCore({
  operation: 'division',
  divisor: '25',
  dividend: '10230',
  calculation: { maxDecimalDigits: 24 },
})

const factorization = shushiCore({
  operation: 'shortDivision',
  mode: 'factorization',
  values: ['48'],
})

const baseConversion = shushiCore({
  operation: 'shortDivision',
  mode: 'baseConversion',
  values: ['13'],
  targetBase: 2,
})
```

`shortDivision` 的模式为：`division`、`factorization`、`commonFactor`、`baseConversion`。指定除数的 `division` 需要 `divisor`；进制转换需要 `targetBase`；其他请求不要填无意义的字段。

## 4. 渲染与统一场景

门户先生成 `source`，再编译为 `scene`，最后根据 `renderMode` 渲染：

| `renderMode` | 结果         | 适用场景               |
| ------------ | ------------ | ---------------------- |
| `svg-string` | SVG 字符串   | SSR、Node.js、导出文件 |
| `div`        | DOM 元素     | 浏览器 CSS/DOM 交互    |
| `svg`        | SVG DOM 元素 | 浏览器 SVG 交互        |

`div` 和 `svg` 需要浏览器 DOM，且浏览器入口导入 `@u1in/shushi-core/renderer.css` 即可获得默认 STIX 字体；改用其他字体时改导入 `renderer-without-font.css` 并补充对应字体 CSS。所有渲染器都只消费同一个 `GridScene`，不要在渲染器中计算进位、借位、部分积、商或余数。

### 品牌图标

`@u1in/shushi-core/logo.svg` 与 `@u1in/shushi-core/logo-dark.svg` 随包发布，分别是浅色背景和深色背景版本；两者固定使用 Shushi 品牌色，适合直接作为 `<img>` 的 `src`，不提供颜色覆盖。

## 5. 计算器和布局 API

当用户只需要过程数据或要精确控制分层步骤时，使用这些 API：

```typescript
computeAddition(...values)
computeSubtraction(minuendValue, subtrahendValue)
computeMultiplication(multiplicandValue, multiplierValue, options?)
computeDivision(divisorValue, dividendValue, options?)
computeShortDivision(input)
computeCompositeArithmetic(expression)
```

布局器把计算结果变成可编辑宏源码：

```typescript
createAdditionMacroSource(computation, settings?)
createSubtractionMacroSource(computation, settings)
createMultiplicationMacroSource(computation, settings)
createDivisionMacroSource(computation, settings)
createShortDivisionMacroSource(computation, settings)
createCompositeArithmeticMacroSource(computation, settings?)
```

逐步播放时使用对应的 `get*StepCount`，每次改变 `visibleStepCount` 都重新生成宏源码并编译，不要直接修改 `GridScene` 的坐标。

## 6. 宏源码和 AST

```typescript
parseMacro(source)
formatMacro(source)
unformatMacro(source)
completeMacro(source)
minifyMacro(source)
minifyMacroForCopy(source)
compileMacro(source, { colorTheme?, fontFamily? })
createMacroAstInspection(source)
```

- `formatMacro` 只整理空白和缩进，不计算运算结果。
- `completeMacro` 输出显式的 `GRID`、`ROW`、`CELL` 和完整宏名。
- `minifyMacro` 输出最简合法宏；计算器生成的宏复制到编辑器时使用 `minifyMacroForCopy`，它会移除页面专属 `ariaLabel` 和 `style`。
- `createMacroAstInspection` 返回 `scene`、`references`、`source`、`minifiedSource` 和不可变的 `updateElementText`、`removeElementStrike`；`references` 会为带删除线的同格图元记录 `strikeKind`，后者直接删除 `STRIKE`，并把 `STRIKEDOT` 回退为 `DOT`。
- 小数除法的 `source` 会用 `STRIKE` 标记被消去的数字、用 `STRIKEDOT` 表示带删除线的小数点；编辑这类源码时保留这两个图元，不要改为 CSS 文字删除线或手工坐标。

典型 AST 编辑流程：

```typescript
const inspection = createMacroAstInspection(source)
const element = inspection.scene.elements[0]
const updated = inspection.updateElementText(element.id, '9')

// 使用 updated.scene 重新渲染，不要继续使用旧 inspection。
console.log(updated.source, updated.scene)
```

## 7. Agent 任务选择表

| 任务                         | 实现路径                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| 根据用户算式直接显示竖式     | `shushi(expression, { renderMode, el })`                               |
| 精确指定运算类型或短除法模式 | `shushiCore(request)`                                                  |
| 只要计算结果和过程           | 对应的 `compute*`                                                      |
| 需要保存、编辑或复制宏       | 门户返回的 `source`；复制时 `minifyMacroForCopy`                       |
| 需要切换 DOM、SVG、SSR       | 同一 `scene` 配合对应 `renderMode` 或 `render*`                        |
| 用户已经提供宏源码           | `parseMacro` / `createMacroAstInspection` / `compileMacro`             |
| 需要文本提取或几何测量       | `extractVisibleTextRows` / `resolveGridMetrics` / `getGridElementRect` |

## 8. 边界规则

- 运算输入优先使用十进制字符串，避免大整数转换为 JavaScript `number` 后丢失精度。
- 加法、乘法和长除法入口接受非负十进制数；长除法的除数必须大于 `0`。减法和短除法仍只接受非负整数。非法字符、空值和不符合模式的短除法会抛出错误。
- `computeDivision` 的参数顺序是 `divisorValue, dividendValue`；不要按表达式书写顺序调用底层函数。
- 纯计算、宏解析、编译、几何查询和文本提取不依赖 DOM；DOM/SVG 渲染依赖浏览器。
- 公开类型和字段以 `packages/core/src/vertical-arithmetic.ts` 及统一入口导出为准；不要根据旧示例猜测已经删除的 API。
