# @u1in/shushi-fonts

首页演示与 `@u1in/shushi-core` 共用的本地数学字体资源源包。

- `src/fonts/*.css` 分别维护每套字体的 `@font-face` 定义，`src/fonts.css` 汇总全部字体。
- `src/fonts/` 保存字体二进制文件及对应许可文件。
- `*-arithmetic-*.woff2` 是自动竖式专用子集，只保留数字、运算符、小数点和借位点；SVG 导出优先使用这些资源，人工宏或短除法出现其他字符时回退完整字体。
- 首页通过 `@u1in/shushi-fonts/fonts.css` 直接加载；核心包构建时会把全量、渲染器和逐字体 CSS，以及字体文件复制到 `dist/`。

这个包是工作区内部资源包，不作为单独的 npm 公共入口发布。使用 `@u1in/shushi-core` 的项目可以按需导入对应的 CSS 入口。
