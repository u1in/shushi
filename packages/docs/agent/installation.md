---
title: Agent 安装说明
---

# `@u1in/shushi-core` Agent 安装说明

这份说明面向需要在已有项目中接入竖式能力的代码 Agent。当前包只保留一个 npm 入口：`@u1in/shushi-core`。

接入时遵循这条主线：

```text
算式字符串 → shushi → shushiCore → computation/source/scene/rendered/inspection
```

只有需要精确控制 `operation` 或逐层调试时，才绕过表达式入口使用 `shushiCore` 或更底层的计算、布局、宏和渲染 API。

## Agent 执行约束

- 先确认宿主项目根目录存在 `package.json`，并查看已有工作区状态。
- 保留宿主项目现有的依赖、锁文件、registry 配置和未提交改动；不要擅自切换包管理器或 Node.js。
- 公共包名固定为 `@u1in/shushi-core`，Skill 名固定为 `u1in-shushi`，不要混用两者。
- 安装验证只覆盖本包；除非用户明确要求修改宿主项目，否则不要自动执行宿主项目的全量构建、测试或配置迁移。
- 不要从页面、DOM、OCR 或 `GridScene` 反向拼接宏源码；计算器生成的宏使用 `source`，手写宏使用宏 API。

`@u1in/shushi-core` 的 Node.js 运行时最低版本为 `16.6`，npm 发布的 JavaScript 产物使用 ES2019 语法级别，因此仍使用旧版 Webpack 解析器的宿主通常无需单独转译该包。ES2019 只表示语法目标，不会为旧浏览器补充 DOM 或其他运行时 API；浏览器 DOM/SVG 渲染按现代浏览器支持，Node.js/SSR 使用 `svg-string`。

## 1. 安装

在宿主项目根目录确认运行时和包管理器：

```bash
test -f package.json
node --version
npm --version
```

使用宿主项目已经采用的包管理器。npm 项目执行：

```bash
npm install @u1in/shushi-core@latest
```

如果宿主项目使用 pnpm 或 Yarn，保持原有锁文件策略：

```bash
pnpm add @u1in/shushi-core@latest
yarn add @u1in/shushi-core@latest
```

### 品牌图标

`@u1in/shushi-core/logo.svg` 和 `@u1in/shushi-core/logo-dark.svg` 是随 npm 包发布的固定品牌色 Shushi 图标，分别用于浅色和深色背景，可以直接交给 `<img>` 使用；两个导出都不提供颜色覆盖。

安装前可确认当前 registry 能看到包：

```bash
npm view @u1in/shushi-core dist-tags.latest
```

不要因为 registry 暂时不可用就改用本地目录、内部工作区包名或未发布版本绕过安装检查。

## 2. 安装后验证

先检查依赖树：

```bash
npm ls @u1in/shushi-core --depth=0
```

再运行不依赖 DOM 的最小验证。默认 `shushi` 会返回 SSR 安全的 SVG 字符串：

```bash
node --input-type=module -e "import { shushi } from '@u1in/shushi-core'; const result = shushi('2 + 3'); if (result.computation.sumDigits !== '5' || result.scene.elements.length === 0 || typeof result.rendered !== 'string') throw new Error('shushi 验证失败'); console.log('安装验证通过：', result.scene.ariaLabel)"
```

验证结构化入口和组合表达式：

```bash
node --input-type=module -e "import { shushiCore } from '@u1in/shushi-core'; const result = shushiCore({ operation: 'composite', expression: '125 + 75 - 20 × 3' }); if (result.computation.resultDigits !== '540' || result.scene.elements.length === 0) throw new Error('shushiCore 验证失败'); console.log('结构化入口验证通过：', result.computation.resultDigits)"
```

## 3. 浏览器接入

浏览器中使用 DOM 或 SVG 节点时导入公共样式，并明确指定客户端渲染模式：

```typescript
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const host = document.querySelector('#result')
const { rendered, source, scene, inspection } = shushi('356 + 278', {
  fontFamily: 'STIX Two Math',
  renderMode: 'div',
  el: host ?? undefined,
})

console.log(rendered, source, scene, inspection)
```

`fontFamily` 与 `colorTheme` 都会在宏编译阶段写入 `scene`；默认 STIX Two Math 已包含在 `renderer.css`。改用其他字体时导入 `renderer-without-font.css`，再导入对应的字体 CSS，例如 `fonts/cmu-serif.css`。

渲染模式：

| 模式                 | `rendered` 类型 | 使用环境                                  |
| -------------------- | --------------- | ----------------------------------------- |
| `svg-string`（默认） | `string`        | Node.js、SSR、导出文件或不需要 DOM 的场景 |
| `div`                | `HTMLElement`   | 浏览器 DOM/CSS                            |
| `svg`                | `SVGSVGElement` | 浏览器 SVG DOM                            |

`el` 只能与 `div` 或 `svg` 一起使用。Node.js/SSR 不要调用 DOM 渲染器；需要 SVG 时使用默认的 `svg-string`。

## 4. API 选择

### 用户给出算式字符串

优先使用：

```typescript
import { shushi } from '@u1in/shushi-core'

const result = shushi('10230 ÷ 25')
```

`shushi` 会自动识别：

- 连续 `+`、`-`、`×`，也接受 `*` 和 `x`；
- 长除法：`10230 ÷ 25` 或 `10230 / 25`；
- 质因数分解：`|48`；
- 公因数：`|12 18`（算法自动试除）；
- 进制转换：`(13)2`。

连续四则表达式按书写顺序计算，不套用通常的乘法优先级。长除法不能与其他运算混写。

### 用户或程序已经有结构化请求

使用：

```typescript
import { shushiCore } from '@u1in/shushi-core'

const result = shushiCore({
  operation: 'division',
  divisor: '25',
  dividend: '10230',
})
```

结构化入口用于明确指定 `operation`、`shortDivision` 的 `mode`、具名计算选项或布局 settings。不要为了普通算式输入手工组装请求。

## 5. 出错时的最小排查

- `npm view` 找不到包：检查包名和 registry，不要替换为本地包。
- `ERR_MODULE_NOT_FOUND`：回到宿主项目根目录，检查 `npm ls @u1in/shushi-core --depth=0`。
- `document is not defined`：改用默认的 `svg-string`；DOM/SVG 节点渲染必须在浏览器执行。
- 竖式只有文字没有正确定位：确认浏览器入口导入了 `@u1in/shushi-core/renderer.css`。
- 算式无法识别：先按“API 选择”中的语法检查输入；不要在 Agent 侧猜测或改写用户的运算含义。

安装任务完成的最低标准是：依赖树存在 `@u1in/shushi-core`，`shushi('2 + 3')` 的纯数据验证成功，并且根据目标环境选择了正确的渲染模式。
