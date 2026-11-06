# Changelog

所有重要变更都会记录在此文件中。

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
