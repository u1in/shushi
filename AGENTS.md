# AGENTS.md

## 项目说明

这是一个基于 Vite 的原生静态网站项目，用于生成小学除法竖式。

除法计算与竖式排版、坐标布局、线条绘制和交互状态的正式规则分别记录在：

- [`docs/division-rules.md`](./docs/division-rules.md)
- [`docs/vertical-division-layout.md`](./docs/vertical-division-layout.md)

## 必须遵守的同步规则

- 修改除法计算逻辑、字符串逐位计算、整数输入约束、商的位置、乘积/余数推演时，必须同步检查并更新 `docs/division-rules.md`。
- 修改竖式列宽、行高、商/被除数/乘积对齐、厂字弧线、顶部横线、减法线、辅助网格或 DOM/CSS 渲染方式时，必须同步检查并更新 `docs/vertical-division-layout.md`。
- 如果任一规则文档发生变化，必须检查实现是否需要同步修改，不能只更新文档而让页面行为过期。
- 完成规则或实现修改后，至少执行 `npm run build` 验证项目可以正常构建。

## 编码偏好

- 新写的 JavaScript 和 TypeScript 函数默认使用箭头函数；只有需要独立 `this` 绑定时才使用普通函数。
- 在 WSL 中运行 Node.js、npm 或 npx 命令前，先执行 `source ~/.zshrc`，加载 fnm 管理的 Node.js 环境。
- 页面渲染使用 `div + CSS` 和绝对定位；除非规则明确变更，不要重新引入 SVG 线条层。
