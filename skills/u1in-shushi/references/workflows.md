# 竖式实现工作流

## 1. 需求确认

只确认会改变实现的必要信息：

1. 用户提供的是算式字符串、结构化字段还是宏源码；
2. 目标环境是浏览器 DOM、浏览器 SVG、Node.js/SSR 还是仅数据；
3. 是否需要保存/编辑宏源码、播放步骤、AST 图元交互或文本提取。

信息已经明确时不要重复提问。未指定渲染模式时，默认返回 `svg-string`，不擅自创建 DOM。

## 2. 入口决策

```text
算式字符串
  └─ shushi(expression, options?)

结构化 operation / 短除 mode / 高级 settings
  └─ shushiCore(request)

只要计算过程
  └─ compute*

需要可编辑宏
  └─ compute* → create*MacroSource → compileMacro

人工宏源码
  └─ parseMacro / createMacroAstInspection → compileMacro
```

## 3. 直接显示表达式

```typescript
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const result = shushi('125 + 75 - 20 × 3', {
  fontFamily: 'STIX Two Math',
  renderMode: 'div',
  el: document.querySelector('#result') ?? undefined,
})
```

`fontFamily` 与 `colorTheme` 都会在宏编译阶段进入 `GridScene`；渲染器只读取场景。默认 STIX Two Math 已包含在 `renderer.css`；改用其他字体时使用 `renderer-without-font.css` 并导入对应字体 CSS，避免把默认字体一并打进产物。

保留 `result.source` 可供复制或编辑，使用 `result.scene` 做文本、几何或二次渲染分析。

## 4. 结构化控制

```typescript
import { shushiCore } from '@u1in/shushi-core'

const result = shushiCore({
  operation: 'division',
  divisor: '25',
  dividend: '10230',
  calculation: { resultMode: 'remainder' },
})
```

结构化请求必须遵守判别联合的字段边界。长除法始终是 `divisor` 在前、`dividend` 在后；用户书写方向只在 `shushi('10230 / 25')` 中处理。

## 5. 只计算或逐层控制

```typescript
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderSvgString,
} from '@u1in/shushi-core'

const computation = computeAddition('356', '278')
const source = createAdditionMacroSource(computation)
const scene = compileMacro(source)
const svg = renderSvgString(scene)
```

只有在需要单独读取过程、改写布局 settings、保存宏源码或切换渲染器时才展开这条链路。

## 6. 组合竖式与播放

```typescript
import {
  compileMacro,
  computeCompositeArithmetic,
  createCompositeArithmeticMacroSource,
  getCompositeArithmeticStepCount,
} from '@u1in/shushi-core'

const computation = computeCompositeArithmetic('500 + 1 - 237 × 2')
const stepCount = getCompositeArithmeticStepCount(computation)
const source = createCompositeArithmeticMacroSource(computation, {
  visibleStepCount: stepCount,
})
const scene = compileMacro(source)
```

改变 `visibleStepCount` 时重新生成源码并编译。不要把多个单项布局器的宏字符串手工拼接成组合竖式。

## 7. 宏编辑和 AST 交互

```typescript
import { createMacroAstInspection } from '@u1in/shushi-core'

const inspection = createMacroAstInspection(source)
const updated = inspection.updateElementText(elementId, '9')
```

把 `updated.source` 写回编辑器，把 `updated.scene` 交给渲染器。`updateElementText` 返回新对象，不修改旧结果；不能继续使用旧 `scene`。

## 8. 同一场景切换渲染器

```typescript
import { renderDomGrid, renderSvgGrid, renderSvgString } from '@u1in/shushi-core'

const dom = renderDomGrid(scene)
const svg = renderSvgGrid(scene)
const text = renderSvgString(scene)
```

三个渲染器必须消费同一份 `scene`。浏览器 DOM/SVG 需要 CSS；SSR 使用 `renderSvgString`。

## 9. 交付检查

- 是否使用了正确的门户入口；
- 是否按源码参数顺序调用长除法；
- 是否保留并复用了 `source` 和 `scene`；
- 是否避免了渲染器中的运算专属分支；
- 是否根据目标环境选择 `div`、`svg` 或 `svg-string`；
- 是否运行了与宿主改动风险相称的验证命令。
