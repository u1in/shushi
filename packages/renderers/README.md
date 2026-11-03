# `@u1in/shushi-renderers`

通用网格渲染层。该包只消费 `@u1in/shushi-grid` 的 `GridScene`，将同一份场景数据绘制为 DOM/CSS 或 SVG，不包含任何除法、乘法或其他运算规则。

## 导出内容

- `renderDomGrid(scene)`：创建舞台与两个绝对定位图层，绘制后返回 `HTMLElement`。
- `renderSvgGrid(scene)`：创建 SVG、绘制场景并返回 `SVGSVGElement`。
- `@u1in/shushi-renderers/style.css`：DOM/SVG 公共基础样式；统一入口用户应优先导入 `@u1in/shushi-core/style.css`。

两种渲染器共享轨道解析、元素位置矩形和文字锚点计算，因此单元区域、交点、边、边中点、局部对齐和辅助网格在两种模式下保持一致。样式通过 `styleToken` 和 `data-style-token` 交给应用主题处理。

`renderDomGrid(scene)` 返回的舞台已带相对定位、场景宽高和 `--grid-font-size`；`renderSvgGrid(scene)` 返回的 SVG 已带宽高、`viewBox` 和 `role="img"`。两个函数都不要求调用方预先在 HTML 中搭建容器；浏览器入口还应导入公共 CSS：

```ts
import { renderDomGrid } from '@u1in/shushi-renderers'
import '@u1in/shushi-renderers/style.css'
```

公共 CSS 只负责图元基础视觉，不包含宿主页面布局；应用可以通过 `--grid-text`、`--grid-rule`、`--grid-guide`、`--grid-bracket` 和 `--grid-font-family` 覆盖主题。

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/shushi/issues) 附上渲染模式、浏览器、场景数据和截图或最小复现步骤。

作者：u1in <u1in@qq.com>
