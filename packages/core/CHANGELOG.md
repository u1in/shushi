# Changelog

所有重要变更都会记录在此文件中。

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
