# `@u1in/shushi-core` 故障排查

先确认问题属于安装、入口、输入、渲染、宏还是 AST；不要用本地路径、字符串替换或第二套计算逻辑绕过错误。

## 1. 安装与导入

如果旧版 Webpack 报 `Unexpected token` 并定位到宿主依赖中的现代语法，先确认使用的是包含 ES2019 产物的 `@u1in/shushi-core` 版本并重新安装依赖。当前发布包已经将语法降到 ES2019；若宿主仍无法解析，应检查宿主自己的 loader 配置和锁定的包版本。该处理只覆盖 JavaScript 语法，不会补齐旧浏览器运行时 API。

### `npm view` 返回 404

检查包名和 registry：

```bash
npm config get registry
npm view @u1in/shushi-core dist-tags.latest
```

公共包应从可访问的 npm registry 获取。不要把 `@u1in/shushi` 工作区根包当成运行时依赖。

### `ERR_MODULE_NOT_FOUND`

确认命令在宿主项目根目录执行，并检查：

```bash
npm ls @u1in/shushi-core --depth=0
```

保持 ESM `import` 写法，不要为了绕过入口错误改用内部源码路径或 `require`。

## 2. 入口选择错误

- 用户给出算式字符串：使用 `shushi(expression)`；
- 已有 `operation`、短除法 `mode` 或结构化字段：使用 `shushiCore(request)`；
- 只需要计算过程：使用 `compute*`；
- 已有宏源码：使用 `parseMacro`、`compileMacro` 或 `createMacroAstInspection`。

不要把 `compute*`、`create*MacroSource` 和 `render*` 拼成门户的替代实现。

## 3. 算式无法解析

### 连续表达式

加法、减法和乘法接受非负小数；短除法才只接受非负整数。小数减法会自动右补零；播放阶段先按当前可见数位右对齐，数位补齐后小数点对齐。`*`、`x`、`X` 会作为乘号。计算按文本从左到右，不使用乘法优先级。

### 长除法

使用单独的：

```text
10230 ÷ 25
10230 / 25
```

不要写成含有加减乘的混合表达式。表达式入口按“被除数 ÷ 除数”解析；`shushiCore` 和 `computeDivision` 则固定传 `divisor` 在前、`dividend` 在后。小数除数会先右移为整数；被除数的小数位不足时会在右侧补 `0` 后再计算。

若只需要整数商和余数，可传入 `calculation.maxDecimalDigits: 0`；例如 `15 ÷ 4` 会得到商 `3` 和余数 `3`，不会生成小数点。传入正整数时才会继续追加对应上限的小数位。

### 短除法

```text
|48        分解质因数
|12 18     自动试除求公因数
(13)2      进制转换
```

表达式入口的短除法使用 `|数` 或 `|数1 数2`；算法会自动试除。结构化入口对应的 mode 是 `division`、`factorization`、`commonFactor`、`baseConversion`。

## 4. 渲染问题

### `document is not defined`

Node.js/SSR 中不要使用 `renderMode: 'div'` 或 `'svg'`，也不要调用 `renderDomGrid`/`renderSvgGrid`。改用默认的 `svg-string` 或 `renderSvgString`。

### 页面只有文字或布局错位

浏览器入口导入：

```typescript
import '@u1in/shushi-core/renderer.css'
```

确认渲染器接收的是完整的 `GridScene`，不要把 `computation` 或宏源码直接当作渲染器输入。

### DOM 没有挂载

只有 `renderMode: 'div'` 或 `'svg'` 支持 `el`。确认 `el` 是真实的浏览器 `Element`，并且调用发生在 DOM 已建立之后。

## 5. 宏源码问题

- 只整理空白：`formatMacro(source)`；
- 展开完整结构：`completeMacro(source)`；
- 输出最简源码：`minifyMacro(source)`；
- 复制计算器生成的宏：`minifyMacroForCopy(source)`。

这些函数都会先解析源码。源码不完整时应把解析错误反馈给用户，不要用正则删除逗号、分号、`KV` 或括号。

计算器生成的源码可能包含网页专属 `ariaLabel` 和 `style`；复制到宏编辑器前必须使用 `minifyMacroForCopy`，不要手工裁剪。

小数长除法的等值变换会逐帧同步右移除数和被除数，并用 `DOT` 显示每帧的当前小数点；旧小数点以 `STRIKEDOT`、被略去的前导零以 `STRIKE` 保留，若被除数位数不足，补零也会单独显示。不要用 `text-decoration`、字符串替换或渲染器坐标逻辑代替这些宏图元。

## 6. AST 编辑问题

```typescript
const inspection = createMacroAstInspection(source)
const updated = inspection.updateElementText(elementId, text)
```

`updateElementText` 和 `removeElementStrike` 都是不可变操作。更新后必须替换编辑器中的 `source`，并使用新结果的 `scene`；不能继续引用旧检查结果。`removeElementStrike` 对 `STRIKE` 直接移除，对 `STRIKEDOT` 回退为 `DOT`。

如果元素没有可编辑文字，说明它可能是线条、边框或无文字图元，不要强行写入文本。

## 7. 组合竖式问题

组合表达式使用 `computeCompositeArithmetic` 或 `shushi('125 + 75 - 20 × 3')`。它按书写顺序计算；中间结果为负数时不能继续组合。播放步骤使用 `visibleStepCount` 重新生成宏源码和场景，不要依次拼接多个单项宏。

## 8. 最后检查

```bash
npm ls @u1in/shushi-core --depth=0
```

然后运行一个最小纯数据验证：

```bash
node --input-type=module -e "import { shushi } from '@u1in/shushi-core'; const result = shushi('2 + 3'); if (result.computation.sumDigits !== '5' || result.scene.elements.length === 0) throw new Error('验证失败'); console.log('验证通过')"
```
