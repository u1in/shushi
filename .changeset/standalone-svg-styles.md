---
'@u1in/shushi-core': patch
---

修复 SVG 与 DOM 渲染器的图元样式固化，使导出的 `.svg` 文件或 Base64 `img` 不依赖外部渲染器 CSS 即可保留预览样式。
