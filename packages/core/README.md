# @u1in/shushi-core

@u1in/shushi面向 npm 使用者的统一入口。计算器、竖式布局、宏编译、网格工具和 DOM/SVG 渲染器都可以从这里导入：

```ts
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderDomGrid,
} from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'
```

底层领域包仍保留独立入口，便于按需使用或维护内部边界；一般应用只需要安装并使用本包即可。浏览器调用 `renderDomGrid` 或 `renderSvgGrid` 时应导入 `@u1in/shushi-core/style.css`，它提供网格图元的定位、字体、线条、辅助网格和内置语义 token 默认样式。`renderDomGrid` 需要在浏览器 DOM 环境中调用，计算、布局和宏编译 API 可以在 Node.js 或 SSR 中使用；纯数据 API 不需要导入 CSS。
