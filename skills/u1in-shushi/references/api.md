# `@u1in/shushi-core` API 参考

## 1. 两个门户

### `shushi`

```typescript
type ShushiRenderMode = 'div' | 'svg' | 'svg-string'

type ShushiExpressionOptions<TMode extends ShushiRenderMode = 'svg-string'> = {
  renderMode?: TMode
  el?: TMode extends 'svg-string' ? never : Element
  calculation?: DivisionOptions & MultiplicationOptions
  settings?: ShushiExpressionSettings
  colorTheme?: AutoColorTheme
  fontFamily?: string
  embedFont?: boolean
  fontSubset?: 'arithmetic' | 'full'
}

shushi(
  expression: string,
  options?: ShushiExpressionOptions,
): AnyVerticalArithmeticResult
```

`shushi` 是普通用户输入的默认入口。它把表达式解析为结构化请求，再交给 `shushiCore` 完成计算、宏源码、场景和渲染。

### `shushiCore`

```typescript
type ShushiRequest<TRequest, TMode extends ShushiRenderMode = 'svg-string'> =
  TRequest & ShushiRenderOptions<TMode>

shushiCore(
  request: ShushiRequest<VerticalArithmeticRequest>,
): AnyVerticalArithmeticResult
```

它是结构化高级入口，不是表达式字符串的替代别名。

## 2. 表达式语法

| 语法                                    | 规则                                                   |
| --------------------------------------- | ------------------------------------------------------ |
| `12 + 3 - 4 × 2`                        | 连续表达式按书写顺序执行，不使用乘法优先级             |
| `12 + 3`、`12 - 3`、`12 × 3`            | 单项加、减、乘                                         |
| `1.2 + 3.04`、`8.7 - 0.89`、`1.2 × 3.4` | 小数加、减、乘法                                       |
| `12 * 3`、`12 x 3`                      | `×` 的 ASCII 写法                                      |
| `10230 ÷ 25`、`10230 / 25`              | 长除法，必须单独输入                                   |
| `34.5 ÷ 5`、`3.45 / 0.5`                | 小数长除法，除数右移；被除数不足位数补零后继续逐位计算 |
| `                                       | 48`                                                    | 分解质因数       |
| `                                       | 12 18`                                                 | 自动试除求公因数 |
| `(13)2`                                 | 十进制 13 转目标进制 2；目标进制为 2–36                |

加法、减法、乘法和长除法表达式可使用非负小数；短除法仍只接受非负整数。小数加减法播放会先按当前可见数位右对齐，再按最长小数位逐个右补零；最后一个零出现后小数点对齐，每补一个 `0` 占用一步；之后才展示结果数位。结果数位完成后单独显示小数点，绝对值小于 `1` 时再补前导 `0`。小数长除法先将除数右移为整数，并同步右移被除数；后者小数位不足时在右侧补 `0` 后再逐位试商。除法不能和 `+`、`-`、`×` 混排；不符合模式时让门户抛出错误，不要在调用方偷偷改写。

加、减、乘布局设置中的 `useMinimalDecimalResult` 默认是 `false`；开启后，完整小数结果末尾的一个 `0` 以 `STRIKE` 标记，`computation` 文本和播放步数保持不变。

每个 `compute*` 结果都带有 `calculationSteps`。补零、等值移动、小数点、逐位计算和结果恢复均在计算器执行时按顺序写入；每项只能引用原输入及此前步骤已经产生的数据。设置 `visibleStepCount` 时，布局只投影这个数组的前缀；组合计算则把所有单项步骤和后续操作数引入快照扁平返回。

## 3. 门户返回值

```typescript
interface VerticalArithmeticResult<TComputation, TRendered> {
  computation: TComputation
  source: string
  scene: GridScene
  rendered: TRendered
  inspection: MacroAstInspection
}
```

- `computation`：专项计算过程和结果；
- `source`：可编辑宏源码；
- `scene`：统一 `GridScene`；
- `rendered`：按 `renderMode` 生成的结果；
- `inspection`：宏 AST 与场景图元的定位关系。

## 4. 渲染选项

```typescript
type ShushiRenderOptions<TMode extends ShushiRenderMode = 'svg-string'> = {
  renderMode?: TMode
  el?: TMode extends 'svg-string' ? never : Element
  colorTheme?: AutoColorTheme
  fontFamily?: string
  embedFont?: boolean
  fontSubset?: 'arithmetic' | 'full'
}
```

| 模式         | `rendered`      | 环境               |
| ------------ | --------------- | ------------------ |
| `svg-string` | `string`        | Node.js、SSR、导出 |
| `div`        | `HTMLElement`   | 浏览器 DOM/CSS     |
| `svg`        | `SVGSVGElement` | 浏览器 SVG         |

浏览器入口导入：

```typescript
import '@u1in/shushi-core/renderer.css'
```

`el` 会把客户端渲染结果追加到指定元素；`svg-string` 禁止传入 `el`。

## 5. 结构化请求

```typescript
type VerticalArithmeticRequest =
  | { operation: 'addition'; values: readonly unknown[]; settings?: Partial<AdditionRenderSettings> }
  | { operation: 'subtraction'; operands: readonly [unknown, unknown]; settings?: Partial<SubtractionRenderSettings> }
  | {
      operation: 'multiplication'
      operands: readonly [unknown, unknown]
      calculation?: MultiplicationOptions
      settings?: Partial<MultiplicationRenderSettings>
    }
  | {
      operation: 'division'
      divisor: unknown
      dividend: unknown
      calculation?: DivisionOptions
      settings?: Partial<RenderSettings>
    }
  | {
      operation: 'shortDivision'
      mode: ShortDivisionMode
      values: unknown[]
      divisor?: unknown
      targetBase?: unknown
      settings?: Partial<ShortDivisionRenderSettings>
    }
  | { operation: 'composite'; expression: unknown; settings?: Partial<CompositeArithmeticRenderSettings> }
```

`settings.useMinimalDecimalResult` 可用于加法、减法、乘法和组合竖式；例如 `{ useMinimalDecimalResult: true }` 会把 `0.30` 的结果行末位 `0` 划掉，但不会把返回的 `sumText` 改成 `0.3`。

### 5.1 加法

```typescript
shushiCore({
  operation: 'addition',
  values: ['356', '278'],
})
```

### 5.2 减法

```typescript
shushiCore({
  operation: 'subtraction',
  operands: ['502', '137'],
})
```

### 5.3 乘法

```typescript
shushiCore({
  operation: 'multiplication',
  operands: ['97', '89'],
  calculation: {
    useTrailingZeroShortcut: true,
    preserveOperandOrder: false,
  },
})
```

### 5.4 长除法

```typescript
shushiCore({
  operation: 'division',
  divisor: '25',
  dividend: '10230',
  calculation: {
    maxDecimalDigits: 24,
  },
})
```

注意：底层函数和 `shushiCore` 的长除法参数顺序是除数在前、被除数在后；字符串表达式仍按用户看到的 `被除数 ÷ 除数` 书写。

`maxDecimalDigits` 只限制已有输入小数之后补出的零位：省略时默认最多补十位，传入非负整数时最多补该位数；传入 `0` 时只完成整数位试商并返回余数，未除尽时保留已计算的小数和当前余数。

### 5.5 短除法

```typescript
shushiCore({
  operation: 'shortDivision',
  mode: 'division',
  divisor: '2',
  values: ['12'],
})

shushiCore({
  operation: 'shortDivision',
  mode: 'factorization',
  values: ['48'],
})

shushiCore({
  operation: 'shortDivision',
  mode: 'commonFactor',
  values: ['12', '18'],
})

shushiCore({
  operation: 'shortDivision',
  mode: 'baseConversion',
  values: ['13'],
  targetBase: 2,
})
```

### 5.6 组合表达式

```typescript
shushiCore({
  operation: 'composite',
  expression: '125 + 75 - 20 × 3',
})
```

## 6. 计算器与布局

```typescript
computeAddition(...values)
computeSubtraction(minuendValue, subtrahendValue)
computeMultiplication(multiplicandValue, multiplierValue, options?)
computeDivision(divisorValue, dividendValue, options?)
computeShortDivision(input)
computeCompositeArithmetic(expression)
```

```typescript
createAdditionMacroSource(computation, settings?)
createSubtractionMacroSource(computation, settings)
createMultiplicationMacroSource(computation, settings)
createDivisionMacroSource(computation, settings)
createShortDivisionMacroSource(computation, settings)
createCompositeArithmeticMacroSource(computation, settings?)
getSubtractionStepCount(computation)
```

`compute*` 只返回过程数据；`create*MacroSource` 把过程填入宏源码；`compileMacro` 再把宏源码编译为 `GridScene`。不要跨层复制算法。

## 7. 宏和 AST

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

计算器生成的源码复制到宏编辑器时使用：

```typescript
const copiedSource = minifyMacroForCopy(result.source)
```

它会移除网页专属的 `ariaLabel`、`style` 等配置；不要用正则自行裁剪。

小数长除法把等值变换拆成逐帧源码：每帧同步右移除数和被除数，并用 `DOT` 表示当前小数点；旧小数点以 `STRIKEDOT` 保留、被略去的前导零以 `STRIKE` 保留，右移完成后才进入试商。它们都由 `compileMacro` 编译为通用场景图元。

AST 编辑是不可变的：

```typescript
const inspection = createMacroAstInspection(source)
const updated = inspection.updateElementText(elementId, '9')
const withoutStrike = inspection.removeElementStrike('grid-strike-id')
// 使用 updated.scene 和 updated.source，不要继续使用旧结果。
```

## 8. 渲染器和网格工具

```typescript
renderDomGrid(scene)
renderSvgGrid(scene)
renderSvgString(scene, { embedFont: true, fontSubset: 'arithmetic' })
resolveGridMetrics(scene)
getGridPositionRect(scene, position)
getGridElementRect(scene, elementId)
extractVisibleTextRows(scene)
```

渲染器只消费 `GridScene`；计算和宏编译不依赖 DOM。需要 SSR、Node.js 或独立导出时优先使用 `renderSvgString`，其输出已内联基础 SVG 视觉属性，可直接作为 `.svg` 文件或 Base64 `img` 使用。传入 `renderSvgString(scene, { embedFont: true })` 可把场景使用的内置字体以 Base64 `@font-face` 嵌入；默认关闭，开启后默认使用竖式字符子集，未知字符自动回退完整字体，也可传 `fontSubset: 'full'` 强制使用完整字体。自定义字体仍需由宿主提供。

## 9. 入口选择结论

```text
算式字符串 → shushi
结构化请求 → shushiCore
只要计算 → compute*
需要宏源码 → source / create*MacroSource
人工宏源码 → parseMacro / compileMacro
需要图元编辑 → createMacroAstInspection
浏览器显示 → renderMode:'div' 或 'svg'
服务端显示 → renderMode:'svg-string'
```
