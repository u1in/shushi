# `@vertical-arithmetic/web`

四则运算竖式项目的浏览器前端应用，使用 Vue、Vue Router、Vite 和 Tailwind CSS 组织计算器、网格预览与竖式元素命名图谱页面。

## 页面

- `/`：加、减、乘、除计算器首页。
- `/addition-elements`：加法竖式元素命名图谱。
- `/subtraction-elements`：减法竖式元素命名图谱。
- `/division-elements`：除法竖式元素命名图谱。
- `/multiplication-elements`：乘法竖式元素命名图谱。

`packages/web/index.html` 是唯一的 Vite 应用壳；页面和组件位于 `src/`，测试位于 `test/`。前端通过工作区依赖调用计算器、布局引擎、行列网格和渲染器包。

## 本地开发

从仓库根目录执行：

```bash
source ~/.zshrc
npm install
npm run dev
```

也可以在本包目录执行 `npm run dev`、`npm run typecheck`、`npm run test` 或 `npm run build`。

详见[前端应用与工作区说明](./docs/前端应用与工作区说明.md)。

## Bug 反馈与作者

请在 [GitHub Issues](https://github.com/u1in/vertical-arithmetic-project/issues) 提供页面路径、输入数据、浏览器版本和复现步骤；布局问题最好同时附截图。

作者：u1in <u1in@qq.com>
