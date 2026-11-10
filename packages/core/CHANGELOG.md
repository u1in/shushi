# Changelog

所有重要变更都会记录在此文件中。

## 4.2.2

### Patch Changes

- fc9c391: 将 `SQUARE`/`SQ` 保持为居中的 `U+2610 (☐)`，并将默认字号放大为网格字号的 `1.25` 倍；宏调试区通过编译 API 默认打开辅助网格，但不改写用户输入的最简宏源码。

## 4.2.1

### Patch Changes

- 为导出的浅色和深色 logo SVG 补充 64×64 的固有宽高，便于宿主直接作为图片资源使用。

## 4.2.0

### Minor Changes

- 优化 SVG 字符串导出的内置字体体积：默认嵌入竖式字符子集，遇到未覆盖字符时自动回退完整字体，并新增 `fontSubset` 选项。计算器生成的 Macro 同时不再固化 `autoColor` 和页面专属 `ariaLabel`。

## 4.1.0

### Minor Changes

- fa089aa: 为 `renderSvgString` 和门户的 `svg-string` 模式新增 `embedFont` 开关，可将场景使用的内置字体以 Base64 `@font-face` 嵌入 SVG，便于独立文件和 Base64 `img` 保持预览字体表现。

### Patch Changes

- fa089aa: 修复 SVG 与 DOM 渲染器的图元样式固化，使导出的 `.svg` 文件或 Base64 `img` 不依赖外部渲染器 CSS 即可保留预览样式。

## 4.0.0

### Major Changes

- 发布 `@u1in/shushi-core` 4.0.0，确立当前统一计算门户、计算步骤快照与 GridScene 渲染链路的稳定公开版本。

### Minor Changes

- 48a70c2: 计算器结果新增 `calculationSteps`：补零、小数点、等值变换、逐列运算和组合子运算均由计算器按顺序返回为不含未来结果的自洽快照。布局与 `visibleStepCount` 改为消费这些计算器步骤前缀，组合表达式同时提供展平后的完整检查序列。

## 3.2.0

### Minor Changes

- 修正首页表达式预览：长除法未除尽时保留省略号标记，不再把竖式余数误显示为商的一部分。

## 3.1.0

### Minor Changes

- 43fcf4e: 新增 `useMinimalDecimalResult` 布局配置。开启后，加法、减法、乘法及组合竖式的完整小数结果末位 `0` 会使用 `STRIKE` 删除线标记，默认关闭且不改变计算结果和播放步数。

### Patch Changes

- c4ad2cc: 将单元格重构为 3×3 九区：减法借位点使用与 DOT 相同的字号并进入上中区，进位进入下右区，核心数字留在中心区；DOM 与 SVG 使用同一位置。

## 3.0.0

### Major Changes

- 发布 `@u1in/shushi-core` 3.0.0，汇总当前工作区已有的竖式计算、宏文档和渲染兼容性更新。

### Minor Changes

- 8d3426d: 支持小数减法，并统一四则运算播放的前缀快照契约：每帧只依据原输入和已发生的补零、数位、进借位、部分积、商位和余数布局，绝不预留未来结果或网格列。小数加减法补零前及补零过程中按当前可见数位右对齐，按最长小数位逐个右补零后再进入逐列计算，每补一个零都作为独立步骤；结果小数点独立展示，绝对值小于 1 时再单独补入前导零。首页表达式预览也会使用这套完整播放事件，不再在小数减法的数位计算结束时提前禁用下一步。同时将小数长除法的等值右移和被除数补零拆分为逐帧步骤：每帧同步放大除数与被除数，保留旧小数点和被略去的前导零并用删除线标记；除数、厂字弯与当前被除数作为整体动态右对齐，不预占最终补零列，完成后才进入试商。

### Patch Changes

- 0aea778: 修正小数乘法结果补出前缀零时的横线跨度，并新增按横线上下相邻图元确定范围的 `LINE` adjacent 跨度。
- c8a96cb: 支持 AST 检查器删除删除线：`STRIKE` 会被移除，`STRIKEDOT` 会回退为 `DOT`；首页宏调试器为选中的删除线图元提供“删除删除线”按钮。
- ee9af15: 小数乘法不再展示两行左侧定位零的逐位过程，并保留最终积的小数点定位步骤。
- b75f789: 将核心包发布产物的 JavaScript 语法目标降为 ES2019，并声明 Node.js `>=16.6`，改善旧版 Webpack 宿主的解析兼容性。
- 81f093f: 长除法允许将 `maxDecimalDigits` 设为 `0`，此时计算到整数个位后直接返回余数；首页长除法输入框同步允许输入 `0`。

## 2.0.0

### Major Changes

- 4f34069: 重构长除法小数终止选项：移除 `resultMode`，改为只使用可选的 `maxDecimalDigits`。未配置时返回整数商和余数；配置后保留到目标位的小数过程及剩余余数，并通过 `decimalTruncated` 标记未除尽的截断结果。

### Minor Changes

- 53e33d2: 支持小数加法、乘法与长除法竖式；加法和乘法将结果小数点作为独立教学步骤，长除法会对小数输入进行等值右移、保留原输入并用独立删除线标记变换，且在整数未除尽时默认展开商小数；短除法继续仅处理整数。`STRIKE` 标记当前单元格，`STRIKEDOT` 用于带删除线的小数点。

### Patch Changes

- a666db9: 修正 npm 包 homepage，指向 Shushi 项目主页。
- 412a303: 重构乘法的 10 倍数快捷计算：两个乘数都会移除末尾零参与基础乘法，最终积合并补零；同时所有乘法都保持用户输入的上下行顺序。宏压缩会省略最长横线冗余的 `span=full`，仅为需要与其对齐的较短横线保留该配置。

## 1.1.0

### Minor Changes

- 新增 `@u1in/shushi-core/logo.svg` 与 `@u1in/shushi-core/logo-dark.svg` 品牌图标导出，分别对应浅色和深色背景，固定使用 Shushi 品牌色，适合直接交给 `<img src>` 使用。

## 1.0.0

### Major Changes

- 2051049: 取消 `autoColor` 的 CSS 变量主题入口，统一通过 JavaScript 的 `colorTheme` 配置主题颜色。默认颜色和自定义颜色都会在宏编译阶段写入 `GridScene`，并移除 `AUTO_COLOR_THEME_VARIABLES` 导出，避免 DOM、SVG 和 SVG 字符串输出受到 CSS 继承或覆盖影响。

### Minor Changes

- 8c528e5: 新增 `SQUARE`/`SQ`、`TRIANGLE`/`TRI`、`ROUND`/`RND` 固定符号宏，并将 `EMPTY` 与 `BRACKET` 的首选缩写调整为 `EMP` 与 `BRKT`。

### Patch Changes

- f8e8052: 将 `autoColor` 收敛为固定语义颜色主题，默认使用 JavaScript 颜色对象，并允许通过 `colorTheme` 配置对象覆盖颜色；首页预览增加主题颜色编辑器。新增共享本地数学字体资源子包，核心包会随包发布内置默认 STIX Two Math 的 `renderer.css`、不含字体的 `renderer-without-font.css`、字体汇总 CSS、逐字体 CSS，以及三套可切换字体文件。`shushi`、`shushiCore` 与宏编译入口新增 `fontFamily`，并在编译阶段与 `colorTheme` 一同写入 `GridScene`，使 DOM、SVG 与 SVG 字符串输出共享同一份外观结果。

## 0.6.0

### Minor Changes

- a8df556: 短除法表达式统一使用 `|数` 做质因数分解、`|数1 数2` 自动试除并求最大公约数和最小公倍数；移除表达式入口的带左侧除数写法。

### Patch Changes

- 82fb59b: 修复最简宏对默认右对齐行的压缩：省略冗余的行首空单元格，并保留必要的列数与横线跨度。

## 0.5.0

### Minor Changes

- 66936c3: 新增 `shushi(expression, options)` 表达式入口，并将原有结构化门户更名为 `shushiCore(request)`；支持长除法、短除法、公因数与进制转换表达式语法。

## 0.4.0

### Minor Changes

- 0c8d7c8: 新增 `shushi` 统一竖式门户 API。一个调用即可完成加、减、乘、长除、短除或组合竖式的计算、可编辑宏源码生成和 `GridScene` 编译，并返回全部三层产物。

### Patch Changes

- d093614: 完善官网接入指引，并将文档站中的 AI 接入入口统一更名为 Agent。
- 44bb4b5: 组合竖式默认隐藏减法借位标记；传入 `showBorrowSteps: true` 可显式显示。最简宏会省略单条全宽横线的 `span`，并将多条共享横线的跨度提升为 `GRID(lineSpan)` 配置。
- 2c6d5e4: 补充宏文档中的 `MTD` 顶部借位点说明、示例、限制和导航入口。

## 0.3.0

### Minor Changes

- 新增可按书写顺序组合加、减、乘为单一连续竖式的计算与布局 API，并支持逐步播放；新增 `minifyMacroForCopy` 系列 API，统一导出可粘贴编辑的最简计算器宏。

### Patch Changes

- 2fed221: 新增不依赖浏览器 DOM 的 `renderSvgString`，支持在 Node.js 和 SSR 环境中将 `GridScene` 输出为 SVG 字符串。

## 0.2.2

### Patch Changes

- 修复 VuePress 更新日志页面错误显示文档分类侧边栏的问题。

## 0.2.0

### Minor Changes

- 整合近期的竖式计算、宏编译、网格布局与渲染能力，改进乘法过程显示，并补充公共样式与使用文档。

## 0.2.1

### Patch Changes

- 同步 npm 包 README，补充安装、AI/Skill 使用入口、API 指引和流程说明。

## [Unreleased]

## [0.1.0]

- 首次发布 `@u1in/shushi-core` 集合包。
