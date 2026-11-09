---
name: u1in-shushi
description: Use when an agent needs to install or use @u1in/shushi-core for arithmetic expressions, vertical calculation steps, editable macro source, GridScene inspection, browser DOM/SVG rendering, or SSR SVG output. Prefer the shushi expression portal; use shushiCore only for structured requests or advanced control.
---

# `u1in-shushi` Skill

这个 Skill 让 Agent 在宿主项目中正确接入 `@u1in/shushi-core`。当前公共入口以两个门户为主：

- `shushi(expression, options?)`：面向用户输入的表达式入口，自动选择完整运算规则。
- `shushiCore(request)`：面向结构化请求和高级控制的入口。

两者都会经过同一条链路：

```text
输入 → 计算 → 可编辑宏源码 → GridScene → DOM/SVG/SVG 字符串
```

不要根据旧 API 名称、旧示例或页面 DOM 猜测调用方式；以本 Skill 的参考资料和 `@u1in/shushi-core` 当前类型为准。

发布包的 Node.js 运行时最低版本为 `16.6`，JavaScript 产物使用 ES2019 语法级别，兼容仍使用旧版 Webpack 解析器的宿主。该语法目标不包含旧浏览器运行时 API 的 polyfill；浏览器 DOM/SVG 按现代浏览器支持，Node.js/SSR 使用默认的 `svg-string`。

## 1. 执行前的判断

### 1.1 用户已经给出算式

直接使用 `shushi`，不要先询问 `operation`：

```typescript
const result = shushi('125 + 75 - 20 × 3')
```

支持的表达式写法：

| 写法                       | 含义                       |
| -------------------------- | -------------------------- |
| `125 + 75 - 20 × 3`        | 按书写顺序执行的连续加减乘 |
| `10230 ÷ 25`、`10230 / 25` | 长除法                     |
| `                          | 48`                        | 分解质因数       |
| `                          | 12 18`                     | 自动试除求公因数 |
| `(13)2`                    | 进制转换                   |

加法、减法和乘法也接受 `*`、`x`、`X` 作为乘号。连续表达式不使用乘法优先级，从左到右计算；除法不能与其他运算混写。

加法、减法、乘法和长除法可使用非负小数，例如 `1.2 + 3.04`、`8.7 - 0.89`、`1.2 × 3.4`、`34.5 ÷ 5`；短除法始终只处理整数。小数加减法播放从原输入开始：每一帧先按当前可见数位右对齐，较短小数再按书写顺序逐个右补零；最后一个零出现后小数点对齐。每补一个 `0` 占用一步，之后才进入进位或借位计算。所有结果数位完成后单独标点，绝对值小于 `1` 时下一帧补前导 `0`。小数乘法会省略两行左侧仅用于小数定位的零的逐位过程，第二行从右向左算到左侧无非零位即停止，最终积的小数点仍在数字过程后恢复。小数长除法会先逐帧同步右移除数和被除数；被除数小数位不足时在右侧补零，完成全部右移后才试商，未除尽时默认补零展开最多十位商小数。

加、减、乘布局可通过 `settings.useMinimalDecimalResult` 开启小数结果最简标记，默认关闭；完整结果末尾的一个 `0` 会以 `STRIKE` 标记，播放步数不增加，未完成帧不提前显示。

任何设置 `visibleStepCount` 的结果都是独立前缀快照：场景只能使用当前输入和已发生的数位、补零、进借位、部分积、商位及余数，不能为未来步骤预留轨道或结果位置。

### 1.2 用户明确要求结构化控制

使用 `shushiCore`：

```typescript
const result = shushiCore({
  operation: 'shortDivision',
  mode: 'factorization',
  values: ['48'],
})
```

适用场景：明确指定 `operation`、短除法 `mode`、长除法/乘法 calculation、布局 settings，或需要逐层调试计算器和宏源码。

### 1.3 用户只要某一层

按需要选择：

```text
只要过程数据       → compute*
过程数据转宏源码   → create*MacroSource
宏源码转场景       → compileMacro
宏源码格式处理     → parseMacro / formatMacro / minifyMacro
AST 图元定位编辑   → createMacroAstInspection
场景渲染           → renderDomGrid / renderSvgGrid / renderSvgString
```

不要在渲染器中重新计算进位、借位、部分积、商或余数。

## 2. 安装与验证

遵守宿主项目已有的 Node.js、包管理器、registry 和锁文件策略，不擅自切换环境：

```bash
npm install @u1in/shushi-core@latest
npm ls @u1in/shushi-core --depth=0
```

安装后先做纯数据 smoke test：

```bash
node --input-type=module -e "import { shushi } from '@u1in/shushi-core'; const result = shushi('2 + 3'); if (result.computation.sumDigits !== '5' || result.scene.elements.length === 0) throw new Error('shushi 验证失败'); console.log('验证通过')"
```

安装任务不默认执行宿主项目的全量 typecheck、test 或 build。只有用户明确要求修改宿主项目时，才扩大验证范围。

## 3. 门户 API 规则

### 3.1 `shushi`

```typescript
import { shushi } from '@u1in/shushi-core'

const result = shushi('356 + 278', {
  renderMode: 'div',
  el: document.querySelector('#result') ?? undefined,
  settings: {
    showGuideGrid: false,
  },
})
```

返回 `computation`、`source`、`scene`、`rendered` 和 `inspection`。省略 `renderMode` 时返回 SSR 安全的 `svg-string`；浏览器 `div`/`svg` 模式需要导入：

```typescript
import '@u1in/shushi-core/renderer.css'
```

`el` 只能和 `div` 或 `svg` 一起使用。Node.js/SSR 使用默认的 `svg-string`。

### 3.2 `shushiCore`

结构化请求的 `operation` 为：

```text
addition | subtraction | multiplication | division | shortDivision | composite
```

请求要点：

- `addition`：`values`；
- `subtraction`：`operands: [被减数, 减数]`，两者可为非负十进制数；
- `multiplication`：`operands`，可选 `calculation`；
- `division`：`divisor` 在前、`dividend` 在后；两者可为小数，其中 `dividend` 非负、`divisor` 必须大于 `0`。`calculation.maxDecimalDigits` 可选，已有输入小数会先计算完，省略时后续默认最多补零十位，传入非负整数时覆盖该上限，传入 `0` 时不追加小数位，整数输入直接返回余数；
- `shortDivision`：`mode`、`values`，指定除数时增加 `divisor`，进制转换时增加 `targetBase`；
- `composite`：`expression`。

所有请求都可以传 `settings`、`renderMode` 和客户端模式下的 `el`。

例如 `shushi('0.18 + 0.12', { settings: { useMinimalDecimalResult: true } })` 会保留 `computation.sumText === '0.30'`，并在完整结果行的末位 `0` 上生成删除线。

## 4. 结果、源码和 AST

### 4.1 统一结果

门户返回的 `scene` 是所有渲染器的共同输入：

```typescript
const { computation, source, scene, rendered, inspection } = shushi('10230 / 25')
```

`source` 是可编辑宏源码；需要复制到宏编辑器时使用 `minifyMacroForCopy(source)`，不要手工删除 `style`、`ariaLabel` 或其他宏参数。

小数除法会将除数和被除数的同步右移拆成逐帧源码，每帧用 `DOT` 标记当前小数点，并用 `STRIKEDOT` 保留旧小数点、用 `STRIKE` 划去被略去的前导零；完成等值变换后才开始试商。不要用 CSS `text-decoration` 或像素坐标替代这些宏图元。

### 4.2 AST 检查与修改

```typescript
const inspection = createMacroAstInspection(source)
const element = inspection.scene.elements[0]
const updated = inspection.updateElementText(element.id, '9')
```

`updateElementText` 和 `removeElementStrike` 返回新的检查结果，不修改旧对象。重新渲染时必须使用新结果的 `scene`；删除线操作会直接删除 `STRIKE`，并把 `STRIKEDOT` 回退为 `DOT`。

### 4.3 DOM、SVG 和 SSR

- `renderDomGrid(scene)`：浏览器 DOM/CSS；
- `renderSvgGrid(scene)`：浏览器 SVG DOM；
- `renderSvgString(scene)`：Node.js、SSR 和导出文件。

纯计算、宏解析、编译、几何查询和文本提取不依赖 DOM。

## 5. 参考资料路由

按任务读取，不要无关地加载全部文档：

- `references/installation.md`：安装、registry、验证和宿主项目边界；
- `references/api.md`：当前签名、输入语法、请求字段和结果类型；
- `references/public-exports.md`：公开导出和 API 选择速查；
- `references/workflows.md`：从需求到实现的完整流程；
- `references/troubleshooting.md`：输入、渲染、宏和 AST 故障排查。

## 6. 交付检查

完成宿主项目修改后，报告：

1. 实际使用的入口：`shushi`、`shushiCore` 或底层 API；
2. 输入语法和渲染模式；
3. 修改的文件和结果链路；
4. 实际运行的验证命令及结果；
5. 未执行或被宿主环境阻塞的步骤。

不要为了兼容已经删除的旧入口新增别名、适配层或第二套 GridScene 数据流。
