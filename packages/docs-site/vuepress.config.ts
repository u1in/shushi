import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { resolve } from 'node:path'

/**
 * 集中文档站只负责内容组织和发布，不承载计算器业务路由。
 * 三个顶层入口使用独立目录，避免宏说明、技术文档与图例文档互相混入。
 */
export default defineUserConfig({
  lang: 'zh-CN',
  // 项目 Pages 将文档站发布在仓库根路径；本地开发保持根路径，便于直接访问。
  base: process.env.GITHUB_ACTIONS ? '/shushi/' : '/',
  title: '@u1in/shushi',
  description: '计算规则、网格宏语言、技术契约与竖式图例。',
  clientConfigFile: resolve(process.cwd(), 'vuepress.client.ts'),
  // README 是文档包维护者说明，不是用户手册页面；VuePress 使用专门的 index.md 作为首页。
  // README 与内部契约文档只属于文档源包，不作为用户手册页面发布。
  pagePatterns: [
    '**/*.md',
    '!.vuepress',
    '!**/README.md',
    // Agent 指南由部署工作流单独复制为 Markdown，不参与 VuePress 页面生成。
    '!agent/**',
    '!technical/calculator/**',
    '!technical/layout/**',
    '!technical/grid/**',
    '!technical/macro/**',
    '!technical/workspace/**',
    '!macro/网格宏语言规则.md',
  ],
  /**
   * 首页元数据属于发布适配层，不写回框架无关的 packages/docs Markdown。
   * 未来替换文档框架时，只需替换 docs-site，不必清理 VuePress frontmatter。
   */
  extendsPage(page) {
    if (page.path !== '/') return
    Object.assign(page.frontmatter, {
      home: true,
      sidebar: false,
      heroText: '@u1in/shushi',
      tagline: '人工录入与计算器自动填写同一份宏源码，并经同一编译链路得到竖式',
      actions: [
        { text: '查看演示', link: 'https://u1in.github.io/shushi/demo/', type: 'demo', target: '_blank', rel: 'noopener noreferrer' },
        { text: '查看技术文档', link: '/technical/安装', type: 'default' },
        { text: '查看宏命令', link: '/macro/语法基础', type: 'default' },
        { text: '查看图例文档', link: '/gallery/加法', type: 'default' },
      ],
      footer: 'Copyright © 2026 u1in · @u1in/shushi · Released under the MIT License',
    })
  },
  bundler: viteBundler(),
  theme: defaultTheme({
    repo: 'u1in/shushi',
    docsRepo: 'u1in/shushi',
    docsDir: 'packages/docs',
    // 文档页只保留正文与侧边栏，隐藏默认主题提供的编辑和前后页导航控件。
    editLink: false,
    prev: false,
    next: false,
    // Markdown 代码块使用成对的 PrismJS 主题，确保浅色/深色模式切换时背景和语法色同步变化。
    themePlugins: {
      prismjs: {
        themes: {
          light: 'one-light',
          dark: 'one-dark',
        },
      },
    },
    // 侧边栏完全由下方显式目录管理，避免把正文 h2/h3 再复制成嵌套菜单。
    sidebarDepth: 0,
    navbar: [
      { text: '首页', link: '/' },
      { text: '宏命令文档', link: '/macro/语法基础' },
      { text: '技术文档', link: '/technical/安装' },
      { text: '图例文档', link: '/gallery/加法' },
      { text: '在线演示', link: 'https://u1in.github.io/shushi/demo/' },
    ],
    sidebar: {
      '/': [
        {
          text: '文档分类',
          collapsible: false,
          children: [
            { text: '首页', link: '/' },
            { text: '宏命令文档', link: '/macro/语法基础' },
            { text: '技术文档', link: '/technical/安装' },
            { text: '图例文档', link: '/gallery/加法' },
          ],
        },
      ],
      '/macro/': [
        {
          text: '语法基础',
          collapsible: false,
          children: [{ text: '基础语法规则', link: '/macro/语法基础' }],
        },
        {
          text: '基础宏命令',
          collapsible: false,
          children: [
            { text: 'GRID · 网格根节点', link: '/macro/basic/GRID' },
            { text: 'ROW · 数字行', link: '/macro/basic/ROW' },
            { text: 'CELL · 同格图元容器', link: '/macro/basic/CELL' },
            { text: 'EMPTY · 占位空单元格', link: '/macro/basic/EMPTY' },
            { text: 'LINE · 行级横线', link: '/macro/basic/LINE' },
            { text: 'DIV · 短除法分割边界', link: '/macro/basic/DIV' },
            { text: 'VALUE · 短除法数值组', link: '/macro/basic/VALUE' },
            { text: 'STYLE · 受限线条样式', link: '/macro/basic/STYLE' },
            { text: 'KV · 配置键值对', link: '/macro/basic/KV' },
          ],
        },
        {
          text: '定位宏命令',
          collapsible: false,
          children: [
            { text: 'LT · 左上', link: '/macro/orientation/LT' },
            { text: 'MT · 中上', link: '/macro/orientation/MT' },
            { text: 'RT · 右上', link: '/macro/orientation/RT' },
            { text: 'ML · 左中', link: '/macro/orientation/ML' },
            { text: 'MM · 居中', link: '/macro/orientation/MM' },
            { text: 'MR · 右中', link: '/macro/orientation/MR' },
            { text: 'LB · 左下', link: '/macro/orientation/LB' },
            { text: 'MB · 中下', link: '/macro/orientation/MB' },
            { text: 'RB · 右下', link: '/macro/orientation/RB' },
            { text: 'RBL · 右边界', link: '/macro/orientation/RBL' },
          ],
        },
        {
          text: '符号与边框',
          collapsible: false,
          children: [
            { text: 'DOT · 小数点', link: '/macro/symbol/DOT' },
            { text: 'BRACKET · 厂字弯', link: '/macro/symbol/BRACKET' },
            { text: 'TBD · 上边框', link: '/macro/symbol/TBD' },
            { text: 'RBD · 右边框', link: '/macro/symbol/RBD' },
            { text: 'BBD · 下边框', link: '/macro/symbol/BBD' },
            { text: 'LBD · 左边框', link: '/macro/symbol/LBD' },
          ],
        },
        {
          text: '语法糖',
          collapsible: false,
          children: [
            { text: '顶层分号行', link: '/macro/sugar/顶层分号行' },
            { text: '方括号 CELL 简写', link: '/macro/sugar/方括号CELL简写' },
            { text: '零参数省略', link: '/macro/sugar/零参数省略' },
          ],
        },
        {
          text: '示例与排错',
          collapsible: false,
          children: [
            { text: '录入示例', link: '/macro/录入示例' },
            { text: '注意事项', link: '/macro/注意事项' },
          ],
        },
      ],
      '/technical/': [
        {
          text: '使用教程',
          collapsible: false,
          children: [
            { text: '安装', link: '/technical/安装' },
            { text: '快速使用', link: '/technical/快速使用' },
          ],
        },
        {
          text: 'API',
          collapsible: false,
          // API 菜单按名称首字符分组排序：特殊字符、数字、大写字母、小写字母；同组内按字典序排列。
          children: [
            { text: 'GridScene', link: '/technical/api/GridScene' },
            { text: 'compileCalculatorMacro', link: '/technical/api/compileCalculatorMacro' },
            { text: 'compileMacro', link: '/technical/api/compileMacro' },
            { text: 'compileMacroAst', link: '/technical/api/compileMacroAst' },
            { text: 'createMacroAstInspection', link: '/technical/api/createMacroAstInspection' },
            { text: 'computeAddition', link: '/technical/api/computeAddition' },
            { text: 'computeDivision', link: '/technical/api/computeDivision' },
            { text: 'computeMultiplication', link: '/technical/api/computeMultiplication' },
            { text: 'computeShortDivision', link: '/technical/api/computeShortDivision' },
            { text: 'computeSubtraction', link: '/technical/api/computeSubtraction' },
            { text: 'createAdditionGridScene', link: '/technical/api/createAdditionGridScene' },
            { text: 'createAdditionMacroSource', link: '/technical/api/createAdditionMacroSource' },
            { text: 'createDivisionGridScene', link: '/technical/api/createDivisionGridScene' },
            { text: 'createDivisionMacroSource', link: '/technical/api/createDivisionMacroSource' },
            { text: 'createMultiplicationGridScene', link: '/technical/api/createMultiplicationGridScene' },
            { text: 'createMultiplicationMacroSource', link: '/technical/api/createMultiplicationMacroSource' },
            { text: 'createShortDivisionGridScene', link: '/technical/api/createShortDivisionGridScene' },
            { text: 'createShortDivisionMacroSource', link: '/technical/api/createShortDivisionMacroSource' },
            { text: 'createSubtractionGridScene', link: '/technical/api/createSubtractionGridScene' },
            { text: 'createSubtractionMacroSource', link: '/technical/api/createSubtractionMacroSource' },
            { text: 'extractVisibleTextRows', link: '/technical/api/extractVisibleTextRows' },
            { text: 'formatMacro', link: '/technical/api/formatMacro' },
            { text: 'getDivisionPlaybackStepCount', link: '/technical/api/getDivisionPlaybackStepCount' },
            { text: 'getGridElementRect', link: '/technical/api/getGridElementRect' },
            { text: 'getGridPositionRect', link: '/technical/api/getGridPositionRect' },
            { text: 'getGridTextAnchor', link: '/technical/api/getGridTextAnchor' },
            { text: 'getMultiplicationStepCount', link: '/technical/api/getMultiplicationStepCount' },
            { text: 'minifyMacro · 完整宏最简化', link: '/technical/api/minifyMacro' },
            { text: 'parseMacro', link: '/technical/api/parseMacro' },
            { text: 'renderDomGrid', link: '/technical/api/renderDomGrid' },
            { text: 'renderSvgGrid', link: '/technical/api/renderSvgGrid' },
            { text: 'resolveGridMetrics', link: '/technical/api/resolveGridMetrics' },
          ],
        },
      ],
      '/gallery/': [
        { text: '加法竖式元素', link: '/gallery/加法' },
        { text: '减法竖式元素', link: '/gallery/减法' },
        { text: '乘法竖式元素', link: '/gallery/乘法' },
        { text: '除法竖式元素', link: '/gallery/除法' },
        { text: '短除法元素', link: '/gallery/短除法' },
      ],
    },
  }),
})
