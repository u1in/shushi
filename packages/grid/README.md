# `@u1in/shushi-grid`

通用竖式行列网格模型与几何工具。该包不包含除法、乘法等具体运算规则，也不依赖 DOM、CSS 或 SVG，负责为布局引擎和渲染器提供稳定的网格数据结构。

## 导出内容

- `GridScene`、`GridElement`、`GridPosition`、`GridTrack` 等网格场景类型。
- `GridTextContent`、对齐类型和样式 token 字段。
- `resolveGridMetrics`、`getGridPositionRect`、`getGridElementRect` 与 `getGridTextAnchor`。

## 设计约束

网格以正尺寸轨道和预定义位置描述结构，而不是直接输出 DOM 或像素坐标。元素可定位在单元区域、行列交点、单元格边或边中点，因此进位、辅助文字和横线无需依赖零尺寸轨道；文字元素可以覆盖自身对齐方式，未设置时继承场景配置。

详见[网格架构与子包关系](../docs/technical/grid/网格架构.md)。

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/shushi/issues) 反馈问题，并说明场景数据、复现步骤和期望行为。

作者：u1in <u1in@qq.com>
