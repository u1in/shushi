# AGENTS.md

## 作用域与基本原则

本文件是仓库根目录下所有代码 Agent 的项目级工作规范，适用于整个工作区。用户在当前任务中提出的明确要求优先于本文件；本文件用于补充项目结构、职责边界、文档同步、验证和交付约定。

- 开始修改前先查看 `git status`，保留用户已有改动，不覆盖、回滚或删除无关文件。
- 任务只需要诊断、解释或审查时，不要擅自实现修改、提交代码或执行外部发布。
- 任务明确要求修改时，保持改动范围与用户目标一致，并在交付前完成与风险相称的验证。
- 规范必须与宿主环境无关：不要假设 WSL、Windows、特定 shell、Node.js 版本管理器或用户目录。运行命令时优先使用仓库已有的 npm 脚本和项目当前使用的包管理器。
- 不要把密钥、令牌、机器路径、个人账号信息或其他本机配置写入源码、文档、测试和提交记录。

## 项目概览

这是一个基于 Vite、Vue、Vue Router 与 Tailwind CSS 的 TypeScript 多包工作区，根包名为 `@u1in/shushi`。项目提供加法、减法、乘法、长除法和短除法的计算过程、可编辑宏源码、统一 `GridScene` 场景以及 DOM/CSS 和 SVG 渲染。

- `@u1in/shushi`：工作区根包，私有，仅用于组织多包项目。
- `@u1in/shushi-core`：面向 npm 使用者的统一公开入口，汇总计算、布局、宏编译、网格工具和渲染器。
- `packages/docs/`：框架无关的唯一文档内容源。
- `packages/docs-site/`：VuePress 发布适配层、主题配置和导航，不是规则文档的权威来源。
- `packages/web/`：Vite 首页演示应用和计算器页面。
- `packages/macro-docs/`：宏语言文档的 Vue 展示组件、交互预览、图例和样式。

## 项目术语约定

- “项目主页”特指 `packages/web/` 子包运行的网页，包括首页演示应用和计算器页面。
- “技术文档”特指 `packages/docs-site/` 中运行的 VuePress 文档项目；其内容来源仍以 `packages/docs/` 为准。

## 文档入口与事实来源

修改实现或文档前，先按任务进入对应的集中式文档源：

- [文档总览](./packages/docs/README.md)：文档分类、阅读顺序和职责边界。
- [技术文档总览](./packages/docs/technical/README.md)：计算、布局、网格和 API 的技术入口。
- [计算规则索引](./packages/docs/technical/calculator/README.md)：五种运算的计算规则。
- [布局规则索引](./packages/docs/technical/layout/README.md)：五种运算的竖式排版规则。
- [网格架构](./packages/docs/technical/grid/网格架构.md)：轨道、单元格、图元、对齐和渲染契约。
- [宏文档包说明](./packages/docs/technical/macro/网格宏文档包.md)：宏文档源、运行组件和发布适配层的关系。
- [工作区说明](./packages/docs/technical/workspace/前端应用与工作区说明.md)：包边界、数据流和验证流程。
- [宏说明总览](./packages/docs/macro/README.md)：宏语言的入门、命令、语法糖和排错入口。
- [图例文档总览](./packages/docs/gallery/README.md)：运算图元命名、语义 token 和 VuePress 图例入口。
- [Agent 安装说明](./packages/docs/agent/installation.md) 与 [Agent 能力说明](./packages/docs/agent/capabilities.md)：第三方项目使用 `@u1in/shushi-core` 和 `u1in-shushi` Skill 的公开指南。

`packages/docs-site/vuepress.config.ts` 会排除 README、Agent 指南以及部分技术规则文档；不要因为某个 Markdown 没有生成 VuePress 页面，就把它当作过时或无效文档。VuePress 只是发布适配层，`packages/docs/` 才是框架无关的内容源。

## 包职责与架构边界

| 包 | 职责 | 不应承担的职责 |
| --- | --- | --- |
| `packages/calculators/src/` | 输入校验、运算算法、过程数据和结果契约 | DOM、CSS、SVG、像素坐标或网格排版 |
| `packages/layout/src/` | 把运算结果填写为可编辑的宏源码，并提供兼容的场景入口 | 在布局器中直接复制渲染器逻辑或维护第二套视觉坐标协议 |
| `packages/macro/src/` | 解析、格式化、补全、压缩宏源码，并编译为 `GridScene` | 判断具体运算的进位、借位、商或部分积规则 |
| `packages/grid/src/` | 通用场景类型、轨道、单元格、图元、几何和样式 token | 识别加法、减法、乘法或除法语义 |
| `packages/renderers/src/` | 只消费 `GridScene`，提供 DOM/CSS 和 SVG 渲染 | 重新计算运算过程、布局坐标或运算专属规则 |
| `packages/core/` | 汇总公开导出、构建 npm 入口和公共 CSS | 形成与底层包不一致的第二套 API |
| `packages/docs/` | 维护框架无关的规则、API、宏和图例内容 | 依赖 Vue 组件才能成立的页面逻辑 |
| `packages/macro-docs/src/` | 把宏文档源转换为 Vue 页面、预览和交互组件 | 成为宏语言规则的另一份事实来源 |
| `packages/docs-site/` | 配置 VuePress、主题、导航和发布 | 直接维护计算规则或宏语义 |
| `packages/web/src/` | 首页、路由、计算器页面和宿主交互 | 把运算规则散落到页面或通用渲染器 |

必须保持以下数据流：

```text
数值输入 → calculators → layout 生成宏源码 → macro 编译为 GridScene → renderers 渲染 DOM/SVG
人工宏源码 → macro 解析/编译为 GridScene → renderers 渲染 DOM/SVG
```

- 计算层只输出运算过程和语义 token，不输出 DOM、CSS 或像素坐标。
- 布局层优先生成可复制、可编辑的宏源码；兼容的 `create*GridScene` API 也必须经过统一宏编译链路，不能直接组装另一套场景。
- `GridScene` 是所有渲染器的通用输入。文本单元格可以覆盖场景级对齐；未覆盖时继承场景默认值。
- DOM/CSS 与 SVG 必须支持同一份 `GridScene` 契约。修改一个渲染器时，必须检查另一个渲染器和共享样式是否仍然一致。
- 页面网格采用绝对定位。新增视觉图元优先扩展 `GridCell`、轨道、图元类型和语义样式 token，不要把运算专属坐标写进渲染器。

## 规则与文档同步矩阵

任何会改变用户可见行为、公开 API、数据契约或工程约定的修改，都必须同步实现、文档和测试；不能只改其中一项。

### 计算器

修改输入约束、逐位算法、进位/借位、补零、终止条件、过程字段、结果字段或异常处理时：

- 更新 `packages/docs/technical/calculator/` 下对应文档：加法、减法、乘法、除法或短除法；
- 更新 `packages/docs/technical/calculator/README.md`（新增运算时必须补索引）；
- 同步更新 `packages/docs/technical/api/` 中受影响的公开 API 页面、示例和类型说明；
- 同步实现测试、页面示例和结果展示；
- 如果是面向 `@u1in/shushi-core` 用户的变更，补充 Changeset。

### 竖式布局

修改行列结构、轨道、对齐、过程数字、横线、符号、进位/借位、辅助网格、播放步骤或教学标注时：

- 更新 `packages/docs/technical/layout/` 下对应运算的专项布局规则；
- 更新 `packages/docs/technical/layout/README.md`（新增运算时必须补索引）；
- 如果修改共享网格契约、轨道或 token，同时更新 `packages/docs/technical/grid/网格架构.md`；
- 如果改变图例名称、线框范围或实际网格单元格，同时更新 `packages/docs/gallery/`、`packages/docs/src/gallery/` 以及对应 Vue 图例；
- 检查计算器结果、宏源码、`GridScene`、DOM/CSS 和 SVG 的一致性。

### 宏语言与宏文档

修改宏命令、定位方向、符号、边框、语法糖、解析器、AST、格式化、压缩、宏编译或公开宏词表时：

- 更新 `packages/docs/macro/` 中对应的宏说明；
- 更新 `packages/docs/technical/macro/网格宏文档包.md`，说明文档源、运行组件和测试关系；
- 更新 `packages/docs/src/macro/` 中的页面数据、示例、类型或 API 内容；
- 同步检查 `packages/macro-docs/src/` 的展示组件、图例和样式；
- 更新宏解析、编译、格式化或文档测试。

### 网格、样式与渲染器

修改 `GridScene`、轨道、单元格、图元、几何计算、默认/单元格对齐、样式 token、DOM/CSS、SVG、交互选择或渲染器配置时：

- 更新 `packages/docs/technical/grid/网格架构.md`；
- 更新受影响运算的布局规则和图例文档；
- 同时验证 DOM/CSS 与 SVG；
- 更新几何、渲染和交互测试；
- 不要在通用渲染器中新增运算专属分支。

### 图例、命名图谱与 JSON 契约

- 新增或修改命名图谱时，术语、线框范围、JSON 字段注释和实际 `GridScene` 单元格必须一致。
- 修改除法计算器返回的 JSON 字段、含义、示例或过程契约时，必须同步更新 `packages/web/src/pages/DivisionNamingMapPage.vue` 的字段注释和展示说明。
- 图例数据优先维护在 `packages/docs/src/gallery/` 和 `packages/docs/gallery/`；页面只负责展示，不要复制维护第二份命名规则。

### 路由、配置与发布文档

- 修改路由、页面结构、配置项、VuePress 导航、文档过滤规则或发布方式时，检查 `packages/docs/technical/workspace/前端应用与工作区说明.md`、相关 README、`packages/docs-site/` 配置和文档测试。
- `packages/docs/` 是框架无关的唯一文档源；`packages/docs-site/` 只做 VuePress 适配，不能把技术规则只写在 Vue 文件或 VuePress 配置中。
- 根目录 `README.md` 与 `packages/core/README.md` 是两份需要手动保持一致的项目/npm 包说明；构建脚本不会自动复制 README。修改根目录 README 的通用安装、Skill、API 或使用说明时，必须同步修改 `packages/core/README.md`，并在同一提交中提交。
- 修改 `skills/u1in-shushi/` 的名称、调用方式或安装路径时，同步更新两个 README、文档站首页中的安装/调用示例以及 Skill 自身的 frontmatter；npm 包名 `@u1in/shushi-core` 与 Skill 名 `u1in-shushi` 不要混淆。

### 公开 API 文档页面格式

- `packages/docs/src/macro/` 中的公开 API 页面统一按五段顺序编写：`名称` → `例子` → `作用` → `函数签名和属性说明` → `注意事项`；不要为单个 API 另起不一致的章节顺序，补充说明应合并到这五段中。
- API 页面中的代码块必须显式声明高亮语言（通常为 `typescript` 或 `css`），保持规范缩进和可复制格式；示例应携带解释环境、关键步骤、返回值或边界条件所必需的中文注释，不添加显而易见的逐行注释。
- 新增 API 页面时同步更新 `packages/docs/technical/api/` 页面入口、`packages/docs-site/vuepress.config.ts` 导航、`packages/docs-site/src/components/MacroDocCatalog.vue` 路由映射和宏文档章节顺序测试；文档源仍以 `packages/docs/` 为事实来源。

## 代码与内容规范

- 新写的 JavaScript/TypeScript 函数默认使用箭头函数；只有需要独立 `this` 绑定时才使用普通函数。
- 新增或修改的代码补充必要的中文注释，说明模块职责、关键状态、算法步骤、边界条件或不直观的实现原因；不要为显而易见的逐行赋值添加无信息量注释。
- 优先使用十进制字符串处理运算输入，避免将大整数转换为 JavaScript `number` 造成精度丢失。
- `computeDivision` 的参数顺序是 `divisorValue, dividendValue`，即除数在前、被除数在后。
- 渲染浏览器网格时导入 `@u1in/shushi-core/style.css`；纯计算、宏解析、编译、几何查询和文本提取不应依赖 DOM。
- 保持公开 API 的类型、字段名、字段含义和错误边界稳定；需要破坏性变更时，先同步文档、测试、Changeset 和迁移说明。
- 不要编辑 `dist/` 或 `.vuepress/` 等生成目录来修复源码问题；修改源文件后通过构建重新生成。

## 开发、验证与发布

### 常用命令

从仓库根目录使用现有包管理器执行：

```bash
npm run dev          # 启动首页演示
npm run docs:dev     # 启动 VuePress 文档站
npm run typecheck    # 检查统一入口和首页应用类型
npm run test         # 运行 Web 与宏文档测试
npm run build        # 构建 core 和首页应用
npm run docs:build   # 构建文档站
```

### 验证要求

- 规则、算法、公开 API、布局、网格或渲染器实现发生变化时，至少运行 `npm run typecheck`、`npm run test` 和 `npm run build`。
- 文档源、宏文档组件、VuePress 配置或导航发生变化时，运行 `npm run docs:build`；如果同时修改实现，仍需运行完整的类型检查、测试和应用构建。
- 发布前使用 `npm run release:check`，它会执行类型检查、测试和构建。
- 验证失败时报告实际失败命令和原因，不要通过删除测试、跳过构建或修改锁文件来掩盖问题。

### Changesets 与 npm 发布

- 每个面向 `@u1in/shushi-core` 用户的功能、修复、行为或公开文档变更都应新增 Changeset：`npm run changeset`。
- 发布流程使用 `npm run release:version`、`npm run release:check` 和 `npx changeset publish`；不要手工修改版本号或 CHANGELOG 来替代 Changesets。
- `packages/core/README.md`、`CHANGELOG.md`、`LICENSE` 和 `dist/` 是 npm 包发布内容的一部分；README 变更必须和根 README 按同步规则处理。

## Git 与交付规范

- 提交说明使用 Conventional Commits：`<type>(<scope>): <中文说明>`。
- `type` 使用 `feat`、`fix`、`refactor`、`docs`、`test`、`chore` 等英文约定；`scope` 使用英文模块、文件或功能名；冒号后的说明使用中文。
- 示例：`fix(renderers): 修复 SVG 竖式线条显示`、`docs(skill): 更新 u1in-shushi 使用说明`。
- 不要在用户没有要求时创建提交、推送、发布 npm、创建 Release 或修改远程仓库。
- 完成交付时说明：修改内容、影响范围、验证命令及结果；若有未解决问题，明确指出阻塞原因和后续动作。
