# `@vertical-arithmetic/grid`

通用竖式行列网格模型与几何工具。该包不包含除法、乘法等具体运算规则，也不依赖 DOM、CSS 或 SVG，负责为布局引擎和渲染器提供稳定的网格数据结构。

## 导出内容

- `GridScene`、`GridCell`、`GridTrack` 等网格场景类型。
- `GridTextContent`、对齐类型和样式 token 字段。
- `resolveGridMetrics`、`getGridCellRect`、`getGridTextAnchor` 与 `getDistinctOffsets`。

## 设计约束

网格以轨道和单元格描述结构，而不是直接输出 DOM 或像素坐标。轨道尺寸允许为 `0`，用于放置进位、辅助文字和其他不占据可见空间的锚点；文字单元格可以覆盖自身对齐方式，未设置时继承场景配置。

详见[网格架构与子包关系](./docs/网格架构.md)。

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/vertical-arithmetic-project/issues) 反馈问题，并说明场景数据、复现步骤和期望行为。

作者：u1in <u1in@qq.com>
