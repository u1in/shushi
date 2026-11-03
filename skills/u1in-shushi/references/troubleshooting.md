# `@u1in/shushi-core` 故障排查

先确认问题属于安装、模块导入、计算、宏、渲染还是 AST 编辑，再执行对应检查。不要因为包安装失败而修改宿主 shell、Node 版本管理器或项目构建配置。

## 安装与 registry

### `npm install` 报 404 或找不到包

```bash
npm view @u1in/shushi-core dist-tags.latest
npm config get registry
```

如果 `npm view` 也失败，优先检查包名、registry、网络和凭据。不要擅自切换 registry；需要私有 registry 时让用户提供明确配置。

### 安装后 `npm ls` 找不到包

确认命令是在目标应用目录执行，并检查实际使用的包管理器和 lockfile。不要在一个包管理器的项目里无理由混用另一个包管理器。

### 安装阶段提示 Node 版本

`@u1in/shushi-core` 本身不声明 Node.js `engines` 版本。先区分是宿主项目、包管理器、构建工具还是其他依赖发出的提示；不要把其他工具链的版本要求写成本包的运行时要求。

## 导入与模块格式

### `Cannot find export`

只从公开入口导入：

```ts
import { computeAddition, compileMacro } from '@u1in/shushi-core'
```

不要引用内部目录、源码文件或工作区包名。对照 `references/api.md` 的导出名称和参数顺序。

### CommonJS/ESM 不兼容

确认宿主项目的模块模式和 TypeScript/Vite 配置，再使用宿主已经支持的导入方式。不要为了单个导入错误改写整个项目的模块系统。

### 浏览器没有样式

浏览器渲染入口额外导入：

```ts
import '@u1in/shushi-core/style.css'
```

如果 CSS 解析失败，检查构建工具是否允许包的 CSS export；纯计算和宏处理不需要该 CSS。

## 计算与输入

### 大数结果错误

使用字符串输入，不要先执行 `Number(value)`、`parseInt(value)` 或 `BigInt` 后再传入，除非明确理解输出契约和精度边界。

### 减法结果与预期符号不同

不要交换参数或预先取绝对值。`computeSubtraction(minuend, subtrahend)` 的返回值通过 `isNegative`、`resultText` 和步骤字段表达结果。

### 除法结果颠倒

函数签名是：

```ts
computeDivision(divisorValue, dividendValue, options?)
```

第一个参数是除数，第二个参数是被除数。除数不能为零。

### 小数或余数模式不符合预期

确认 `resultMode` 是 `'decimal'` 还是 `'remainder'`；有限小数模式还要设置合理的正整数 `maxDecimalDigits`。不要把展示层截断当作计算器的精度设置。

### 短除法输入被拒绝

检查 `mode`：`factorization` 需要一个正整数，`commonFactor` 至少需要两个正整数，`baseConversion` 需要十进制整数和 2–36 的 `targetBase`。具体边界以 `references/api.md` 为准。

## 宏与 AST

### 宏解析失败

保留原始错误，先用 `parseMacro(source)` 定位语法问题，再选择 `formatMacro`、`completeMacro` 或 `minifyMacro`。不要静默修复可能改变运算含义的源码。

### 图元没有 AST 引用

只能通过 `inspection.references[elementId]` 查找由检查器建立的引用。确保 `elementId` 来自当前 `scene` 或当前渲染结果的 `data-grid-element-id`，不要复用旧场景的 ID。

### `literalPath` 不存在

线条、边框、圆角或纯符号图元可能没有可编辑文字。此时可以修改宏源码中的其他文字节点，但不能调用 `updateElementText` 强行修改该图元。

### 更新后视图没有变化

`updateElementText` 不会修改旧检查结果。保存返回的新对象，并使用 `nextInspection.scene` 重新渲染，同时使用 `nextInspection.source` 更新编辑器文本。

## 渲染与运行时

### SSR 报 `document is not defined`

`renderDomGrid` 和 `renderSvgGrid` 需要浏览器 DOM。把它们延迟到客户端生命周期；服务端只执行计算、宏转换、`compileMacro`、几何/文本查询，或使用不依赖 DOM 的 `renderSvgString` 输出 SVG 字符串。

### DOM 与 SVG 结果不一致

确认三个渲染入口消费的是同一个 `GridScene`，且 SVG DOM 与 SVG 字符串使用同一棵无 DOM SVG 渲染树。不要为不同渲染器复制运算或坐标算法；需要几何信息时使用 `resolveGridMetrics`、`getGridElementRect` 和 `getGridTextAnchor`。

### 教学播放少一步或多一步

乘法使用 `getMultiplicationStepCount`，除法使用 `getDivisionPlaybackStepCount`。除法是否显示零商步骤必须与布局器的 `showZeroQuotientSteps` 保持一致；不要用任意数组长度替代播放步数。

## 副作用边界

包安装任务的最小收尾是 `npm ls @u1in/shushi-core --depth=0` 和一个纯数据导入 smoke test。不要默认执行宿主项目的全量 typecheck、test、build，不要修改 shell 配置、Node 版本、registry、路由或无关锁文件。只有用户明确要求修改宿主项目时，才扩大验证范围。
