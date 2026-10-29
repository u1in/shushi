# `@vertical-arithmetic/layout`

运算专属的竖式布局引擎。该包联合 `@vertical-arithmetic/calculators` 的计算结果和 `@vertical-arithmetic/grid` 的通用网格模型，决定轨道、行列、运算线、符号、补零和进位标记的位置，并生成可供渲染器消费的 `GridScene`。

## 导出内容

- `createAdditionGridScene`：创建加法竖式网格场景。
- `createSubtractionGridScene`：创建减法竖式网格场景。
- `createDivisionGridScene`：创建除法竖式网格场景。
- `createMultiplicationGridScene`：创建乘法竖式网格场景。
- `createShortDivisionGridScene`：创建短除法网格场景。
- `GridRenderSettings` 和各运算的布局设置类型。

布局引擎解释具体运算的过程字段，但不创建 DOM、CSS 或 SVG。渲染器不应判断商、部分积、进位等运算规则；需要改变视觉结构时，应先在这里调整编排逻辑，再由渲染器统一绘制。

## 规则文档

- [加法竖式排版规则](./docs/加法竖式排版规则.md)
- [减法竖式排版规则](./docs/减法竖式排版规则.md)
- [除法竖式排版规则](./docs/除法竖式排版规则.md)
- [乘法竖式排版规则](./docs/乘法竖式排版规则.md)
- [短除法竖式排版规则](./docs/短除法竖式排版规则.md)

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/vertical-arithmetic-project/issues) 附上计算结果、布局设置和生成的场景关键信息。

作者：u1in <u1in@qq.com>
