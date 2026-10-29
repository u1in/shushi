# 四则运算竖式项目

四则运算竖式项目是一个基于 Vite、Vue、Vue Router 与 Tailwind CSS 的多包工作区，用于展示除法、乘法等四则运算的计算过程、竖式布局和行列网格渲染。

## 当前能力

- 除法：支持整数商、余数，以及在可有限展开时展示小数过程。
- 短除法：支持质因数分解与约数信息、最大公约数 / 最小公倍数，以及十进制转 2–36 进制。
- 乘法：支持逐位乘法、部分积、进位和最终求和过程。
- 行列网格：用与运算无关的 `GridScene` 描述轨道、单元格、文字、边线和对齐方式。
- 渲染器：同一场景可渲染为 DOM/CSS 或 SVG。
- Web 应用：提供计算器和各运算的竖式元素命名图谱页面。

## 工作区结构

| 包 | 职责 |
| --- | --- |
| `@vertical-arithmetic/grid` | 通用行列网格类型与轨道几何 |
| `@vertical-arithmetic/calculators` | 除法、乘法计算过程与结果类型 |
| `@vertical-arithmetic/layout` | 根据计算结果决定竖式结构并生成 `GridScene` |
| `@vertical-arithmetic/renderers` | DOM/CSS 与 SVG 渲染器 |
| `@vertical-arithmetic/web` | Vue 前端、路由、主题和交互页面 |

计算层不依赖 DOM 或 CSS；布局层负责运算专属的行列组织；渲染器只消费 `GridScene`。

## 开始使用

项目要求在 WSL 中使用 fnm 管理的 Node.js 环境：

```bash
source ~/.zshrc
npm install
npm run dev
```

常用校验命令：

```bash
npm run typecheck
npm run test
npm run build
```

## 文档

- [项目文档索引](./docs/项目文档索引.md)
- [前端应用与工作区说明](./packages/web/docs/前端应用与工作区说明.md)
- [网格架构与子包关系](./packages/grid/docs/网格架构.md)
- [除法计算规则](./packages/calculators/docs/除法计算规则.md)
- [乘法计算规则](./packages/calculators/docs/乘法计算规则.md)
- [短除法计算规则](./packages/calculators/docs/短除法计算规则.md)
- [除法竖式排版规则](./packages/layout/docs/除法竖式排版规则.md)
- [乘法竖式排版规则](./packages/layout/docs/乘法竖式排版规则.md)
- [短除法竖式排版规则](./packages/layout/docs/短除法竖式排版规则.md)

## Bug 反馈与贡献

请通过 [GitHub Issues](https://github.com/u1in/vertical-arithmetic-project/issues) 反馈 Bug 或提出功能建议。提交问题时请尽量附上复现步骤、输入数据、预期结果、实际结果，以及相关浏览器或 Node.js 版本。

涉及计算规则、布局规则、网格契约或渲染行为的改动，请同步更新所属中文规则文档和测试，并在提交前运行 `npm run typecheck`、`npm run test` 与 `npm run build`。

## 作者

u1in <u1in@qq.com>
