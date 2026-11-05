---
title: Agent 安装说明
---

# @u1in/shushi-core Agent 安装说明

这是一份给代码 Agent 使用的 npm 包安装说明，目标是在已有的前端或 Node.js 项目中安装并验证 `@u1in/shushi-core`。

## Agent 执行约束

以下约束适用于本说明中的所有安装和验证步骤：

- 在用户当前指定的宿主项目根目录操作，并先确认该目录包含 `package.json`。
- 先查看宿主项目已有状态；保留用户现有的依赖、配置、锁文件和其他未提交改动，不覆盖、回滚或删除用户文件。
- 识别并继续使用宿主项目现有的包管理器、Node.js 和 registry；不要擅自安装或切换 Node.js、registry 或包管理器，也不要混用包管理器。
- 如果文档无法访问、目标包不可用、安装受阻，或安装过程要修改无关文件，先说明具体原因并停止，不要用本地目录、其他包名或未经用户同意的配置变更绕过问题。
- 安装任务的最低验证是依赖树检查和纯数据 API smoke test；除非用户另有要求，不要擅自扩大为宿主项目的全量 typecheck、test 或 build。
- 完成后报告实际执行的命令、Node.js/包管理器和 `@u1in/shushi-core` 版本，以及每项验证的结果；未执行的步骤要明确标注。

## 0. 安装目标

- 运行时入口：`@u1in/shushi-core`
- 包含计算器、竖式布局、宏编译、网格工具、DOM/SVG 渲染器和 SSR SVG 字符串渲染器。
- 计算、布局和宏编译 API 可以在 Node.js 或 SSR 中使用。
- `renderDomGrid` 与 `renderSvgGrid` 需要浏览器 DOM 环境；SSR 或 Node.js 使用 `renderSvgString` 输出 SVG 字符串。
- 浏览器使用渲染器时还要导入 `@u1in/shushi-core/style.css`；纯计算、布局和宏编译不需要 CSS。
- 一般应用只需要安装 `@u1in/shushi-core`。

## 1. 环境检查

### 1.1 确认宿主项目

先进入需要使用竖式能力的宿主项目根目录，确认它包含 `package.json`：

```bash
test -f package.json
```

### 1.2 运行环境

直接使用宿主项目现有的 Node.js、npm 和 shell 环境。`@u1in/shushi-core` 本身不预设 Node.js 版本要求，安装本包不需要额外检查、切换或安装 Node.js；如果宿主项目已有运行时约束，遵循宿主项目自身的约束。

## 2. 依赖和发布状态检查

安装前先确认 npm registry 能看到目标包：

```bash
npm view @u1in/shushi-core dist-tags.latest
```

该命令应返回一个已发布版本号。如果返回 `E404`，说明包尚未发布到当前 registry，或当前 registry 配置不正确；不要用未经发布的本地目录替代 registry 包来绕过这个检查。

检查宿主项目当前是否已经安装：

```bash
npm ls @u1in/shushi-core --depth=0
```

如果命令提示未安装，这是预期结果；如果已经安装，先确认版本是否满足当前任务，不要重复添加不同版本。

如果宿主项目使用私有 registry，检查当前 registry：

```bash
npm config get registry
```

公共 npm 包通常应从 `https://registry.npmjs.org/` 获取。遵循宿主项目已有的 `.npmrc` 和组织级 registry 配置，不要覆盖项目级配置。

## 3. 安装步骤

### 3.1 npm

在宿主项目根目录执行：

```bash
npm install @u1in/shushi-core@latest
```

这会把 `latest` dist-tag 当前指向的版本写入宿主项目的 `package.json` 和锁文件；锁文件会记录实际解析到的完整版本，因此不需要在说明中预设某个具体版本号。

安装时请保持包名为 `@u1in/shushi-core`，不要替换为其他包名。

### 3.2 其他包管理器

如果宿主项目已经使用 pnpm 或 Yarn，保持原有包管理器，不要混用 npm：

```bash
pnpm add @u1in/shushi-core@latest
yarn add @u1in/shushi-core@latest
```

安装后应由宿主项目原有的包管理器更新对应锁文件。

## 4. 安装后导入验证

### 4.1 先验证纯数据 API

下面的 smoke test 不依赖浏览器 DOM，可以验证包解析、计算、布局和宏编译链路：

```bash
node --input-type=module -e "import { shushi } from '@u1in/shushi-core'; const { computation, scene } = shushi('2 + 3'); if (!('sumDigits' in computation) || computation.sumDigits !== '5' || scene.elements.length === 0) throw new Error('门户 API 未生成有效 GridScene'); console.log('安装验证通过：', scene.ariaLabel)"
```

命令应正常退出，并输出安装验证结果。出现 `ERR_MODULE_NOT_FOUND` 时，先回到“依赖和发布状态检查”，确认当前工作目录和安装命令是否正确。

### 4.2 可选：验证组合竖式与最简复制宏

需要在 AI 工作流中使用“先加后减再乘”的连续竖式时，可运行下面的纯数据检查；它同时验证组合计算、布局、最简复制导出和宏编译，不依赖 DOM：

```bash
node --input-type=module -e "import { compileMacro, computeCompositeArithmetic, createCompositeArithmeticMacroSource, getCompositeArithmeticStepCount, minifyMacroForCopy } from '@u1in/shushi-core'; const computation = computeCompositeArithmetic('500 + 1 - 237 × 2'); const source = createCompositeArithmeticMacroSource(computation, { cellWidth: 30, rowHeight: 46, fontSizeRatio: 1, showGuideGrid: false, showCarrySteps: true, showBorrowSteps: true, uniformMultiplicationBars: false, visibleStepCount: getCompositeArithmeticStepCount(computation) }); const copy = minifyMacroForCopy(source); if (compileMacro(copy).elements.length === 0) throw new Error('组合 GridScene 没有元素'); console.log('组合宏验证通过：', computation.resultDigits)"
```

组合表达式按文本从左至右计算，且复制导出文本不带网页渲染专用的 `ariaLabel`、`style`。不要从页面、OCR 或场景对象反向拼接宏；始终使用 `minifyMacroForCopy`。

### 4.3 在前端项目中使用

统一入口使用 ESM 导入：

```ts
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/style.css'

const { rendered, inspection } = shushi('356 + 278', {
  renderMode: 'div',
  el: document.querySelector('#result') ?? undefined,
})
console.log(rendered, inspection)
```

`shushi('356 + 278', { renderMode: 'div' })` 返回一个 DOM 元素；传入 `el` 后会自动挂载。`renderMode: 'svg'` 返回并可挂载 `SVGSVGElement`，`renderMode: 'svg-string'` 返回适合客户端或 SSR 的 SVG 字符串。复杂结构化请求应改用 `shushiCore({ operation, ... })`。`@u1in/shushi-core/style.css` 提供 `.grid-text`、`.grid-edge`、`.grid-corner` 和辅助网格的基础定位与视觉样式。应用可以在此基础上覆盖主题变量。

### 4.4 TypeScript 检查

本包自带类型声明，不需要额外安装 `@types` 包。宿主项目的 TypeScript 编辑器或类型检查器应能直接解析 `@u1in/shushi-core` 的类型；如果出现类型解析错误，告知用户具体错误，不要为了安装本包擅自修改宿主项目的 TypeScript 配置。

## 5. 收尾检查

安装完成后只确认依赖树和依赖文件：

```bash
npm ls @u1in/shushi-core --depth=0
git diff -- package.json package-lock.json pnpm-lock.yaml yarn.lock
```

再结合第 4 节的 smoke test，结果应满足：

- `@u1in/shushi-core` 出现在宿主项目依赖树中。
- `package.json` 与对应锁文件记录了同一安装结果。
- 纯数据 API smoke test 成功。

## 6. 常见故障处理

- **`npm view` 返回 404**：检查 registry、包名和网络，确认目标包是 `@u1in/shushi-core`。
- **`npm install` 修改了不应修改的锁文件**：停止操作并告知用户，不要自动回滚或覆盖宿主项目已有的文件变化。
- **`ERR_MODULE_NOT_FOUND`**：确认命令在宿主项目根目录执行，并检查 `npm ls @u1in/shushi-core --depth=0`。
- **Node.js 报 `require` 相关错误**：本包通过 ESM `exports` 提供入口，使用 `import`，不要使用 `require('@u1in/shushi-core')`。
- **DOM 渲染时报 `document is not defined`**：将 `renderDomGrid` 或 `renderSvgGrid` 放到浏览器端执行；Node.js/SSR 若要输出 SVG，请改用 `renderSvgString`，不需要 jsdom。
- **竖式元素没有正确显示**：确认浏览器入口导入了 `@u1in/shushi-core/style.css`；计算和宏编译成功不代表渲染器公共 CSS 已加载。

安装完成的最低标准是：目标包已写入宿主项目依赖、对应锁文件已更新、纯数据 API smoke test 成功。


