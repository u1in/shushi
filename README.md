# 四则运算竖式项目

四则运算竖式项目是一个基于 Vite、Vue、Vue Router 与 Tailwind CSS 的多包工作区，用于展示除法、乘法等四则运算的计算过程、竖式布局和行列网格渲染。

## 当前能力

- 除法：支持整数商、余数，以及在可有限展开时展示小数过程。
- 短除法：支持质因数分解与约数信息、最大公约数 / 最小公倍数，以及十进制转 2–36 进制。
- 乘法：支持逐位乘法、部分积、进位和最终求和过程。
- 行列网格：用与运算无关的 `GridScene` 描述轨道、单元格、文字、边线和对齐方式。
- 渲染器：同一场景可渲染为 DOM/CSS 或 SVG。
- Web 应用：提供计算器和各运算的竖式元素命名图谱页面。

面向 npm 使用者的公共能力统一从 `@vertical-arithmetic/core` 导入：

```ts
import {
  compileMacro,
  computeAddition,
  createAdditionMacroSource,
  renderDomGrid,
} from '@vertical-arithmetic/core'
```

`@vertical-arithmetic/calculators`、`@vertical-arithmetic/layout` 等领域包仍保留，供需要细粒度依赖边界的场景使用。注意：npm scoped 包名必须包含 `/`，因此 `@vertical-arithmetic` 不能作为可发布包名；项目源码测试中使用的 `@vertical-arithmetic` 仅是指向统一入口的本地 TypeScript 别名。

## 工作区结构

| 包 | 职责 |
| --- | --- |
| `@vertical-arithmetic/grid` | 通用行列网格类型与轨道几何 |
| `@vertical-arithmetic/calculators` | 除法、乘法计算过程与结果类型 |
| `@vertical-arithmetic/layout` | 根据计算结果决定竖式结构并生成 `GridScene` |
| `@vertical-arithmetic/renderers` | DOM/CSS 与 SVG 渲染器 |
| `@vertical-arithmetic/macro` | 网格宏语言解析、编译与 `GridScene` 生成 |
| `@vertical-arithmetic/macro-docs` | 宏文档 Vue 展示组件、图例与样式 |
| `@vertical-arithmetic/docs` | 框架无关的宏说明、技术文档与图例文档源 |
| `@vertical-arithmetic/docs-site` | VuePress 文档发布适配层与交互组件注册 |
| `@vertical-arithmetic/web` | Vue 前端、路由、主题和交互页面 |
| `@vertical-arithmetic/core` | 面向 npm 使用者的计算、布局、宏编译、网格和渲染统一入口 |

计算层不依赖 DOM 或 CSS；布局层负责运算专属的行列组织；渲染器只消费 `GridScene`。框架无关文档统一由 `packages/docs` 维护，`packages/docs-site` 只负责 VuePress 发布；`macro-docs` 提供宏文档的可运行内容组件，主应用仍挂载 `/macro-rules` 与 `/macro-api` 兼容入口。

## 开始使用

项目要求在 WSL 中使用 fnm 管理的 Node.js 环境：

```bash
source ~/.zshrc
npm install
npm start          # 启动主应用，等同于 npm run dev
```

启动后访问 `/macro-rules` 查看宏语言参考，访问 `/macro-api` 查看安装与 API 技术文档。

常用校验命令：

```bash
npm run typecheck
npm run test
npm run build
```

## 文档

- [集中式文档源](./packages/docs/README.md)
- [VuePress 文档站适配层](./packages/docs-site/package.json)
- [在线文档开发](./packages/docs/README.md#目录约定)：执行 `npm run docs:dev`

## Bug 反馈与贡献

请通过 [GitHub Issues](https://github.com/u1in/vertical-arithmetic-project/issues) 反馈 Bug 或提出功能建议。提交问题时请尽量附上复现步骤、输入数据、预期结果、实际结果，以及相关浏览器或 Node.js 版本。

涉及计算规则、布局规则、网格契约或渲染行为的改动，请同步更新所属中文规则文档和测试，并在提交前运行 `npm run typecheck`、`npm run test` 与 `npm run build`。

## 作者

u1in <u1in@qq.com>
