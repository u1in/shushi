# `@vertical-arithmetic/renderers`

通用网格渲染层。该包只消费 `@vertical-arithmetic/grid` 的 `GridScene`，将同一份场景数据绘制为 DOM/CSS 或 SVG，不包含任何除法、乘法或其他运算规则。

## 导出内容

- `renderDomGrid(lineLayer, contentLayer, scene)`：使用绝对定位的 DOM/CSS 图层绘制网格。
- `renderSvgGrid(svg, scene)`：使用 SVG 图元绘制同一网格。

两种渲染器共享轨道解析、单元格矩形和文字锚点计算，因此零尺寸轨道、局部对齐和辅助网格在两种模式下保持一致。样式通过 `styleToken` 和 `data-style-token` 交给应用主题处理。

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/vertical-arithmetic-project/issues) 附上渲染模式、浏览器、场景数据和截图或最小复现步骤。

作者：u1in <u1in@qq.com>
