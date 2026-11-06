# 公开导出与选择速查

本文件只做 API 选择索引。完整类型以 `@u1in/shushi-core` 的当前导出和 `packages/core/src/vertical-arithmetic.ts` 为准；不要把本文件当成第二份类型定义。

## 1. 普通入口

```typescript
shushi(expression: string, options?: ShushiExpressionOptions)
shushiCore(request: ShushiRequest<VerticalArithmeticRequest>)
```

优先级固定为：

```text
用户算式字符串 → shushi
已有结构化字段 → shushiCore
需要拆层控制   → compute* / create*MacroSource / compileMacro / render*
```

## 2. 计算器导出

```typescript
computeAddition
computeSubtraction
computeMultiplication
computeDivision
computeShortDivision
computeCompositeArithmetic
getMultiplicationStepCount
getDivisionPlaybackStepCount
getCompositeArithmeticStepCount
```

这些 API 只负责计算和过程数据，不返回 DOM、SVG 或像素坐标。

## 3. 布局和宏源码导出

```typescript
createAdditionMacroSource
createSubtractionMacroSource
createMultiplicationMacroSource
createDivisionMacroSource
createShortDivisionMacroSource
createCompositeArithmeticMacroSource
createAdditionGridScene
createSubtractionGridScene
createMultiplicationGridScene
createDivisionGridScene
createShortDivisionGridScene
createCompositeArithmeticGridScene
compileCalculatorMacro
```

优先使用 `create*MacroSource` 获得可编辑源码。`create*GridScene` 是兼容入口，也必须经过统一宏编译链路；不在页面或渲染器中重建布局。

## 4. 宏处理导出

```typescript
parseMacro
formatMacro
completeMacro
unformatMacro
minifyMacro
minifyMacroAst
minifyMacroForCopy
minifyMacroForCopyAst
compileMacro
compileMacroAst
createMacroAstInspection
```

使用边界：

| 需求 | API |
| --- | --- |
| 解析并检查源码 | `parseMacro`、`compileMacro` |
| 只整理空白 | `formatMacro`、`unformatMacro` |
| 展开完整结构 | `completeMacro` |
| 输出最简宏 | `minifyMacro`、`minifyMacroAst` |
| 复制计算器宏 | `minifyMacroForCopy`、`minifyMacroForCopyAst` |
| 点击图元并修改文字 | `createMacroAstInspection` |

## 5. 场景、几何和文本

```typescript
resolveGridMetrics
getGridPositionRect
getGridElementRect
extractVisibleTextRows
```

这些 API 读取 `GridScene`，不重新解释加法、减法、乘法或除法语义。

## 6. 渲染器

```typescript
renderDomGrid(scene)
renderSvgGrid(scene)
renderSvgString(scene)
```

| 环境 | 选择 |
| --- | --- |
| 浏览器 DOM/CSS | `renderDomGrid` 或门户 `renderMode: 'div'` |
| 浏览器 SVG | `renderSvgGrid` 或门户 `renderMode: 'svg'` |
| Node.js/SSR/导出 | `renderSvgString` 或门户默认 `svg-string` |

浏览器入口导入 `@u1in/shushi-core/renderer.css`，默认 STIX Two Math 已包含其中；自定义字体时使用 `@u1in/shushi-core/renderer-without-font.css` 再导入自己的或对应字体 CSS。纯计算、宏处理和 `renderSvgString` 不需要 DOM。

## 7. 类型和常量

```typescript
ShushiRenderMode
ShushiRendered
ShushiRenderOptions
ShushiRequest
ShushiExpressionSettings
ShushiExpressionOptions
AutoColorTheme
VerticalArithmeticRequest
AnyVerticalArithmeticResult
AdditionVerticalArithmeticResult
SubtractionVerticalArithmeticResult
MultiplicationVerticalArithmeticResult
DivisionVerticalArithmeticResult
ShortDivisionVerticalArithmeticResult
CompositeVerticalArithmeticResult
```

其他计算、布局、网格、宏和渲染类型也从统一入口导出。需要精确字段时直接查看 TypeScript 类型，不要凭旧文档补字段。

## 8. 不再使用的做法

- 不把底层 `compute*` 作为普通用户算式的默认入口；
- 不为 `shushi` 和 `shushiCore` 维护两套计算或渲染实现；
- 不从宏字符串中手工删除 `KV`；
- 不在渲染器中判断进位、借位、部分积、商或余数；
- 不引用工作区内部路径代替 `@u1in/shushi-core`。
