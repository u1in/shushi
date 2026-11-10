# `@u1in/shushi-renderers`

通用网格渲染层。该包只消费 `@u1in/shushi-grid` 的 `GridScene`，将同一份场景数据绘制为 DOM/CSS 或 SVG，不包含任何除法、乘法或其他运算规则。

## 导出内容

- `renderDomGrid(scene)`：创建舞台与两个绝对定位图层，绘制后返回 `HTMLElement`。
- `renderSvgGrid(scene)`：创建 SVG、绘制场景并返回 `SVGSVGElement`，需要浏览器 DOM。
- `renderSvgString(scene)`：在 Node.js/SSR 中生成完整 SVG 字符串，不访问浏览器 API。
- `@u1in/shushi-renderers/style.css`：DOM/SVG 公共基础样式；统一入口的 `@u1in/shushi-core/renderer.css` 会额外内置默认 STIX Two Math。需要自定义字体时改用 `@u1in/shushi-core/renderer-without-font.css`，再导入自有或逐字体 CSS。

三个输出入口共享轨道解析、元素位置矩形和文字锚点计算，因此单元区域、交点、边、边中点、局部对齐和辅助网格保持一致。SVG DOM 与 SVG 字符串还共享同一棵无 DOM SVG 渲染树；每个 SVG 图元同时写入最终颜色、字号、字重、线宽、线帽和辅助网格属性，因此 SVG 作为 `.svg` 文件或 `<img src="data:image/svg+xml;base64,...">` 使用时不依赖外部 CSS。`styleToken` 和 `data-style-token` 仍会保留，供交互式 SVG DOM 查询和宿主主题识别使用。

`renderDomGrid(scene)` 返回的舞台已带相对定位、场景宽高和 `--grid-font-size`；`renderSvgGrid(scene)` 返回的 SVG 已带宽高、`viewBox` 和 `role="img"`；`renderSvgString(scene)` 输出同样的 SVG 结构。前两个函数不要求调用方预先在 HTML 中搭建容器；浏览器入口还应导入公共 CSS：

```ts
import { renderDomGrid } from '@u1in/shushi-renderers'
import '@u1in/shushi-renderers/style.css'
```

服务端渲染或脚本导出时使用字符串 API：

```ts
import { renderSvgString } from '@u1in/shushi-renderers'

const svg = renderSvgString(scene)
```

### SSR 与浏览器 SVG 的一致性

`renderSvgGrid` 和 `renderSvgString` 共享同一棵无 DOM SVG 渲染树：前者把节点描述物化为 `SVGSVGElement`，后者把同一份描述序列化为 XML 字符串。因此相同 `GridScene` 的坐标、图层、属性和图元顺序一致，不需要让浏览器版先解析 SSR 字符串。SVG 图元的最终视觉属性已内联到节点，导出文件不需要加载 `style.css`；如果宿主仍加载公共 CSS，内联属性会继续保证导出结果不被默认样式覆盖。这里不承诺浏览器重新序列化 DOM 后与 SSR 字符串逐字节相同，也不把字体二进制嵌入 SVG；需要完全一致的字体文件时，宿主仍需提供对应字体资源。

公共 CSS 只负责图元基础视觉，不包含宿主页面布局；应用可以通过 `--grid-text`、`--grid-rule`、`--grid-guide`、`--grid-bracket` 和 `--grid-font-family` 覆盖主题。

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/shushi/issues) 附上渲染模式、浏览器、场景数据和截图或最小复现步骤。

作者：u1in <u1in@qq.com>
