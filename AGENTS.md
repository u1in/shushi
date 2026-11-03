# AGENTS.md

## 项目说明

这是一个基于 Vite、Vue、Vue Router 与 Tailwind CSS 的静态网站项目，项目名称为“**@u1in/shushi**”（根工作区包名：`@u1in/shushi`）。它旨在承载加法、减法、乘法、除法和短除法等多种运算的计算器与竖式展示，后续可继续扩展更多运算。

通用架构、网格场景与渲染职责见：

- [`packages/docs/README.md`](./packages/docs/README.md)
- [`packages/docs/technical/grid/网格架构.md`](./packages/docs/technical/grid/网格架构.md)
- [`packages/docs/technical/layout/除法竖式排版规则.md`](./packages/docs/technical/layout/除法竖式排版规则.md)（当前除法的专项排版规则）
- [`packages/docs/technical/macro/网格宏文档包.md`](./packages/docs/technical/macro/网格宏文档包.md)（宏文档包结构与维护约定）

当前除法计算规则见 [`packages/docs/technical/calculator/除法计算规则.md`](./packages/docs/technical/calculator/除法计算规则.md)。

## 必须遵守的规则文档同步

- **概念变更必须同步技术文档。** 修改宏语言、宏命令、语法糖、`GridScene`、计算/布局规则、路由、配置项或文档页面结构时，必须同步更新 `packages/docs/` 中对应分类的中文技术文档；宏语言可运行内容由 `packages/docs/src/macro` 提供，展示组件位于 `packages/macro-docs/src`，并同步检查 `packages/docs/technical/macro/网格宏文档包.md` 与文档测试。不能只改实现或只改示例。
- **任何运算器都必须有计算规则文档。**新增或修改加、减、乘、除、短除法等任一计算器的输入约束、逐位算法、进位/借位、补零、终止条件、过程数据、结果或异常处理时，必须同步创建或更新所属计算器包中中文命名的 `docs/<运算名称>计算规则.md`；不能只为除法维护规则。
- **任何运算器都必须有竖式布局规则。**修改某运算的行列结构、对齐、过程数字、运算线、符号、进位/借位标记、辅助网格或教学标注时，必须更新 `layout` 包中的专项布局文档；若规则由所有运算共享，则更新网格包的架构文档。
- 修改 `GridScene`、轨道、单元格、默认或单元格级对齐、样式 token、DOM/CSS/SVG 渲染器、数据流转面板或渲染器配置时，必须同步更新 `packages/docs/technical/grid/网格架构.md`；除法行为受影响时也必须同步更新 `packages/docs/technical/layout/除法竖式排版规则.md`。
- 如果任一规则文档发生变化，必须检查并同步实现和测试；不能只更新文档而让页面行为过期。
- 为新运算器添加命名图谱或修改已有图谱时，术语、线框范围、JSON 字段注释和实际网格单元格必须一致。
- 修改除法计算器返回的 JSON 契约、字段名称、字段含义或示例数据时，必须同步更新 `packages/web/src/pages/DivisionNamingMapPage.vue` 中的 JSON 字段注释与展示说明。
- `packages/docs/` 是框架无关的唯一文档源，按 `macro/`、`technical/`、`gallery/` 分类；`packages/docs-site/` 只放 VuePress 配置、主题适配和发布脚本。Vite HTML 壳与主应用路由页放在 `packages/web/`；宏文档运行组件放在 `packages/macro-docs/`。
- 根目录 `README.md` 与 `packages/core/README.md` 是两份需要手动保持同步的项目/npm 包说明；构建脚本不会自动复制 README。凡修改根目录 README 的通用安装、Skill、API 或使用说明，也必须同步修改 `packages/core/README.md` 并在同一提交中提交；VuePress 不从这两份 README 自动生成页面。
- Git 提交说明使用 Conventional Commits 格式：`<type>(<scope>): <中文说明>`。`type` 使用英文约定（如 `feat`、`fix`、`refactor`、`docs`、`test`、`chore`），`scope` 使用英文文件、模块或功能名，冒号后的说明使用中文，例如 `fix(index): 修复主页渲染问题`。
- 完成规则或实现修改后，至少执行 `npm run typecheck`、`npm run test` 与 `npm run build`。

## 架构边界

- 计算层只输出运算过程和语义 token，不能输出 DOM、CSS 或像素坐标。
- 每种运算都有独立的“计算结果 → `GridScene`”版式编排器；不要在通用渲染器中判断商、进位、借位、部分减数等运算规则。
- `GridScene` 是所有渲染器的通用输入。文本单元格可拥有自己的对齐覆盖值；未设置时继承场景的全局对齐配置。
- DOM/CSS 与 SVG 均为当前支持的渲染模式，必须保持对同一 `GridScene` 契约的支持；修改其中之一时必须考虑另一个。

## 源码目录

- `packages/calculators/src/`：各运算的输入校验、计算过程和结果契约；
- `packages/grid/src/`：跨运算的场景类型和轨道几何中间层；
- `packages/layout/src/`：各运算的计算过程到 `GridScene` 的排版适配；
- `packages/renderers/src/`：只消费 `GridScene` 的 DOM/CSS、SVG 渲染器；
- `packages/macro-docs/src/`：网格宏文档 Vue 页面组件、图例、文档预览与样式；
- `packages/docs/`：框架无关的集中式文档源；
- `packages/docs-site/`：VuePress 文档站适配层；
- `packages/web/src/`：Vue 应用入口、路由、页面、可复用组件和样式；
- `packages/web/src/styles/`：Tailwind 入口、页面和渲染器共享主题；
- `packages/web/index.html` 与 `packages/web/vite.config.ts`：唯一 Vite 应用壳与构建配置；根目录 npm 脚本进入该包执行前端命令。

## 编码偏好

- 新写的 JavaScript 和 TypeScript 函数默认使用箭头函数；只有需要独立 `this` 绑定时才使用普通函数。
- 新增或修改的代码必须补充必要的**中文注释**，说明模块职责、关键状态、算法步骤、边界条件或不直观的实现原因；不得为显而易见的逐行赋值添加无信息量注释。
- 页面网格采用绝对定位。新增视觉图元优先扩展 `GridCell`、轨道和语义样式 token，不要把运算专属坐标计算散落到渲染器中。
