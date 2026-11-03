# `@u1in/shushi-core` 实现工作流

本文件说明如何把自然语言需求映射到包 API。函数签名和类型字段以同目录的 `api.md` 为准；不要在本文件复制另一份完整类型定义。

## 1. 先判断需求类型

| 用户需求 | 首选流程 |
| --- | --- |
| 只要计算结果或计算过程 | `compute*`，不引入渲染器 |
| 要显示标准竖式 | `compute* → create*MacroSource → compileMacro → render*` |
| 要逐步教学播放 | 先取得 `get*StepCount`，再把 `visibleStepCount` 传给布局器 |
| 要编辑宏文本 | `parseMacro` / `formatMacro` / `completeMacro` / `minifyMacro` |
| 要点击图元修改文字 | `createMacroAstInspection` + `references` + `updateElementText` |
| 要计算网格位置或尺寸 | `resolveGridMetrics` + `getGrid*Rect` / `getGridTextAnchor` |
| 要提取无障碍或测试文本 | `extractVisibleTextRows` |
| 要服务端生成数据或 SVG | 不调用 `renderDomGrid` / `renderSvgGrid`；使用纯数据 API、`compileMacro` 或 `renderSvgString` |

## 2. 标准数值竖式流程

1. 保留用户输入为字符串，先调用对应的 `compute*`。
2. 用计算结果调用对应的 `create*MacroSource`。
3. 对布局设置显式填写尺寸和教学选项，不要把运算专属判断写进渲染器。
4. 用 `compileMacro(source)` 得到 `GridScene`。
5. 浏览器中导入 `@u1in/shushi-core/style.css`，再调用 `renderDomGrid(scene)`；需要矢量输出时调用 `renderSvgGrid(scene)`。
6. 如果需要服务端 SVG 字符串，调用 `renderSvgString(scene)`；如果需要当前视觉文本，调用 `extractVisibleTextRows(scene)`，不要从 DOM 的偶然结构拼接文本。

```ts
const computation = computeSubtraction('502', '137')
const source = createSubtractionMacroSource(computation, {
  cellWidth: 30,
  rowHeight: 46,
  fontSizeRatio: 1,
  showGuideGrid: false,
  showBorrowSteps: true,
})
const scene = compileMacro(source)
const rows = extractVisibleTextRows(scene)
const svg = renderSvgGrid(scene)
```

## 3. 五类运算的选择

- 加法：`computeAddition(...values)`；多个加数直接作为字符串参数，布局器负责进位注记。
- 减法：`computeSubtraction(minuend, subtrahend)`；不要因为结果为负而交换输入，使用 `isNegative` 和 `resultText`。
- 乘法：`computeMultiplication(multiplicand, multiplier, options)`；需要完整逐位过程时关闭 `useTrailingZeroShortcut`。
- 长除法：`computeDivision(divisor, dividend, options)`；牢记除数在前。需要余数使用 `remainder`，需要有限小数使用 `decimal` 和 `maxDecimalDigits`。
- 短除法：`computeShortDivision({ mode, values, targetBase })`；先根据是质因数、公因数还是进制转换选择 `mode`，再检查该模式的输入数量和范围。

## 4. 教学播放

播放控件的状态应是布局设置的一部分，而不是计算器状态的修改：

```ts
const computation = computeDivision('25', '10230', {
  resultMode: 'remainder',
})
const total = getDivisionPlaybackStepCount(computation, false)

const makeScene = (visibleStepCount: number) => compileMacro(
  createDivisionMacroSource(computation, {
    cellWidth: 30,
    rowHeight: 46,
    fontSizeRatio: 1,
    showGuideGrid: false,
    bracketBend: 1,
    uniformSubtractionBars: false,
    showZeroQuotientSteps: false,
    visibleStepCount,
  }),
)

const firstScene = makeScene(0)
void total
void firstScene
```

乘法使用 `getMultiplicationStepCount(computation)`；除法使用 `getDivisionPlaybackStepCount(computation, showZeroQuotientSteps)`。不要用 `steps.length` 替代，因为快捷过程、零商步骤和小数步骤会改变可视播放事件。

## 5. 宏编辑器和 AST 图元交互

编辑器需要保存 `MacroAstInspection`，而不是只保存渲染出的 DOM：

```ts
let inspection = createMacroAstInspection(source)

const onElementTextEdit = (elementId: string, text: string) => {
  const reference = inspection.references[elementId]
  if (!reference?.literalPath) {
    throw new Error('该图元没有可编辑文字')
  }
  inspection = inspection.updateElementText(elementId, text)
  const nextElement = renderDomGrid(inspection.scene)
  return { source: inspection.source, element: nextElement }
}
```

DOM/SVG 渲染结果中的 `data-grid-element-id` 可以作为交互入口；`references[elementId]` 再把它映射回 AST 节点和文字字面量。`nodePath` 是从根 AST 开始的参数下标路径，根路径为 `[]`；`literalPath` 不存在时，图元没有可编辑文字。更新是不可变的，适合实现撤销/重做。

## 6. 选择宏源码变换

- `parseMacro`：需要 AST 或语法检查。
- `formatMacro`：给编辑器或展示区输出可读的缩进格式。
- `unformatMacro`：压成单行，但保留完整结构。
- `completeMacro`：将简写展开为显式的 `GRID`、`ROW`、`CELL` 和完整宏名，适合调试和教学。
- `minifyMacro`：生成最短合法源码，适合保存或传输；只有确认接收端支持省略默认值时才省略默认值。
- `compileMacro`：把合法宏源码转换为通用 `GridScene`，不是格式化 API。

任何宏变换失败都应向用户报告解析错误，不要静默替换运算含义或拼接未经校验的宏文本。

## 7. 服务端、浏览器与 CSS 边界

服务端可以执行计算器、宏解析/格式化/编译、几何计算、文本提取和 `renderSvgString`。`renderSvgGrid` 与 `renderSvgString` 共享无 DOM SVG 渲染树，因此同一份 `GridScene` 的结构、坐标和图元顺序一致；但不承诺浏览器重新序列化后的字符串与 SSR 输出逐字节相同。`renderDomGrid` 与 `renderSvgGrid` 依赖浏览器 DOM，必须放在浏览器生命周期或带 DOM 的测试环境中调用。

浏览器渲染时：

```ts
import '@u1in/shushi-core/style.css'
```

CSS 只影响渲染外观，不是计算器或宏数据 API 的前置条件。

## 8. 交付检查

交付代码前确认：

- 输入没有被不必要地转换成 `number`。
- 除法参数没有颠倒。
- 运算规则没有泄漏到 DOM/SVG 渲染器。
- 播放使用库提供的步数函数。
- AST 更新后使用新 `scene` 和新 `source`。
- 浏览器代码导入 CSS，服务端代码没有提前调用 `renderDomGrid`。
- 安装任务没有顺带修改 shell、Node 版本、registry 或执行无关的全量构建。
