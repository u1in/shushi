---
'@u1in/shushi-core': patch
---

将 `autoColor` 收敛为固定语义颜色主题，默认支持 CSS 变量和 fallback，并允许通过 `colorTheme` 配置对象覆盖颜色；首页预览增加主题颜色编辑器。新增共享本地数学字体资源子包，核心包会随包发布内置默认 STIX Two Math 的 `renderer.css`、不含字体的 `renderer-without-font.css`、字体汇总 CSS、逐字体 CSS，以及三套可切换字体文件。`shushi`、`shushiCore` 与宏编译入口新增 `fontFamily`，并在编译阶段与 `colorTheme` 一同写入 `GridScene`，使 DOM、SVG 与 SVG 字符串输出共享同一份外观结果。
