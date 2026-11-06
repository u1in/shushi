---
title: colorTheme 颜色主题
---

# `colorTheme` 颜色主题

`colorTheme` 用来统一设置竖式中的语义颜色，例如普通数字、进位、借位、运算符、小数点和线条。

主题在编译阶段写入 `GridScene`。因此 DOM、SVG 和 SVG 字符串渲染使用同一份颜色配置，不会受到外层容器 CSS 继承或覆盖的影响。渲染器仍需要导入公共样式来获得布局、字体和基础图元样式，但颜色主题始终通过 JavaScript 配置。

## 定义主题

```typescript
import type { AutoColorTheme } from '@u1in/shushi-core'

const colorTheme: AutoColorTheme = {
  text: '#243b64',
  carry: '#0f766e',
  borrow: '#8b5cf6',
  operator: '#be123c',
  decimal: '#c026d3',
  rule: { color: '#334155', thickness: 2 },
  bracketRule: { color: '#2563eb', thickness: 2 },
}
```

七个字段的作用如下：

- `text`：普通数字和未分类文字。
- `carry`：`RB` 生成的进位提示。
- `borrow`：`MT` / `MTD` 生成的借位提示。
- `operator`：加、减、乘、除运算符。
- `decimal`：`DOT` 和小数点。
- `rule`：普通横线、边框和短除法分割线。
- `bracketRule`：除法厂字弯和厂字横。

文字颜色可以使用任意 CSS 颜色值；`rule` 和 `bracketRule` 还可以分别设置线条颜色与 `thickness`。

## 在 API 中使用

### `shushi`

表达式入口适合直接处理用户输入的算式：

```typescript
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const result = shushi('10230 ÷ 25', {
  colorTheme,
  renderMode: 'svg-string',
})
```

### `shushiCore`

结构化入口适合需要明确指定运算类型和参数的场景：

```typescript
import { shushiCore } from '@u1in/shushi-core'

const result = shushiCore({
  operation: 'division',
  divisor: '25',
  dividend: '10230',
  colorTheme,
})
```

### `compileMacro`

宏源码入口适合直接编译可编辑的宏：

```typescript
import { compileMacro } from '@u1in/shushi-core'

const scene = compileMacro(
  'GRID(ROW(MM(3), MM(+), MM(5)), LINE, ROW(MM(8)))',
  { colorTheme },
)
```

`compileMacroAst` 和 `createMacroAstInspection` 也接受相同的编译选项。直接使用 `renderDomGrid`、`renderSvgGrid` 或 `renderSvgString` 时，传入已经包含主题的 `scene` 即可。

## 默认主题与精细控制

省略 `colorTheme` 时使用 `AUTO_COLOR_THEME` 内置主题。需要读取默认色值时，可以使用 `AUTO_COLOR_THEME_FALLBACK`：

```typescript
import {
  AUTO_COLOR_THEME,
  AUTO_COLOR_THEME_FALLBACK,
} from '@u1in/shushi-core'

console.log(AUTO_COLOR_THEME.text)
console.log(AUTO_COLOR_THEME_FALLBACK.rule)
```

`autoColor` 默认开启，会按语义为自动生成的文字和线条分配主题颜色。需要完全使用宏源码中的 `STYLE` 时，在 `GRID` 上关闭它：

```macro
GRID(KV(autoColor, false), ROW(STYLE(color, #243b64), MM(3)))
```

关闭 `autoColor` 只影响宏中的自动配色，不会改变计算结果、网格坐标或字体配置。

## 相关 API

- [`shushi`](./api/shushi.md)
- [`shushiCore`](./api/shushiCore.md)
- [`compileMacro`](./api/compileMacro.md)
- [`compileMacroAst`](./api/compileMacroAst.md)
- [`renderDomGrid`](./api/renderDomGrid.md)
- [`renderSvgGrid`](./api/renderSvgGrid.md)
- [`renderSvgString`](./api/renderSvgString.md)
