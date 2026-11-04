# API 文档

这里是 `@u1in/shushi-core` 的公共 API 查阅入口。页面按调用频率分为常用 API 和高级 API，不再提供安装或快速使用教程。

## API 分类

- [API 参考](./api/)：`technical/api` 平铺并直接链接所有面向用户的公共 API 页面。
- [常用 API](./api/shushi.md)：从统一门户 API、宏源码处理和直接渲染入口开始查阅。
- [高级 API](./api/compileMacroAst.md)：查阅 AST 底层接口、计算器过程、布局源码和网格几何工具。

## 维护参考

- `calculator/`、`layout/`、`grid/` 和 `workspace/` 只用于维护实现契约，不作为 VuePress 的 API 查阅页面发布。
- [宏文档包说明](./macro/网格宏文档包.md)：了解文档内容源与 Vue 展示组件的分工。
- [工作区说明](./workspace/前端应用与工作区说明.md)：查看包边界、数据流和验证流程。
