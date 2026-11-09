# `@u1in/shushi-core` 安装参考

## 安装前

`@u1in/shushi-core` 要求 Node.js `>=16.6`。发布 JavaScript 使用 ES2019 语法级别，旧版 Webpack 宿主通常可以直接解析；这不包含针对旧浏览器 DOM 或其他运行时 API 的 polyfill。

在宿主项目根目录确认：

```bash
test -f package.json
node --version
npm --version
npm config get registry
```

遵循宿主项目已有的包管理器和 registry，不要自动切换环境或修改 `.npmrc`。

## 安装

```bash
npm install @u1in/shushi-core@latest
```

pnpm/Yarn 项目继续使用原包管理器：

```bash
pnpm add @u1in/shushi-core@latest
yarn add @u1in/shushi-core@latest
```

## 验证

```bash
npm view @u1in/shushi-core dist-tags.latest
npm ls @u1in/shushi-core --depth=0
node --input-type=module -e "import { shushi } from '@u1in/shushi-core'; const result = shushi('2 + 3'); if (result.computation.sumDigits !== '5' || result.scene.elements.length === 0) throw new Error('shushi 验证失败'); console.log(result.scene.ariaLabel)"
```

默认 `shushi` 使用 `svg-string`，所以这个验证不需要浏览器或 jsdom。

## 浏览器验证

```typescript
import { shushi } from '@u1in/shushi-core'
import '@u1in/shushi-core/renderer.css'

const host = document.querySelector('#result')
const { rendered } = shushi('356 + 278', {
  renderMode: 'div',
  el: host ?? undefined,
})

if (!(rendered instanceof HTMLElement)) throw new Error('DOM 渲染验证失败')
```

不要在 Node.js/SSR 中调用 `renderDomGrid` 或 `renderSvgGrid`；需要字符串时使用默认 `svg-string` 或 `renderSvgString`。

## 安装故障边界

- `npm view` 404：检查包名和 registry，不要替换为工作区本地路径。
- `npm ls` 为空：确认安装命令在宿主项目根目录执行。
- `ERR_MODULE_NOT_FOUND`：检查依赖树和锁文件，不要修改 TypeScript 配置绕过导入错误。
- `document is not defined`：把 DOM/SVG 渲染移到浏览器，或改用 `svg-string`。
- 页面样式缺失：浏览器入口导入 `@u1in/shushi-core/renderer.css`，它已包含默认 STIX Two Math；如果改用其他字体，改导入 `renderer-without-font.css` 并补充对应字体 CSS。
