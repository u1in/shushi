---
'@u1in/shushi-core': major
---

取消 `autoColor` 的 CSS 变量主题入口，统一通过 JavaScript 的 `colorTheme` 配置主题颜色。默认颜色和自定义颜色都会在宏编译阶段写入 `GridScene`，并移除 `AUTO_COLOR_THEME_VARIABLES` 导出，避免 DOM、SVG 和 SVG 字符串输出受到 CSS 继承或覆盖影响。
