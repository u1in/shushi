import type { MacroDocPage } from './types'

/** 宏编译 API 页面共用的固定阅读顺序：名称、例子、作用、签名和属性、注意事项。 */
const compilePage = (page: MacroDocPage): MacroDocPage => ({
  ...page,
  apiArea: 'compile',
})

export const compileMacroPage = compilePage({
  slug: 'compileMacro',
  title: 'compileMacro',
  navLabel: 'compileMacro',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '把完整宏源码一次解析并编译为渲染器可以直接消费的 GridScene。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`compileMacro`：宏源码的一步式编译入口。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacro } from '@vertical-arithmetic/core'

// 分号分隔三行，编译器会把它们转换成 GridScene。
const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')

console.log(scene.elements.length) // 文本与线条图元数量`,
      }],
    },
    {
      id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它串联 `parseMacro` 与编译器，把源码中的行、单元格、定位宏和线条转换为与运算无关的 `GridScene`。网页输入框、计算器布局结果和文档示例都可以使用这个入口。' }],
    },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type CompileMacro = (source: string) => GridScene` },
        {
          type: 'table', columns: ['项目', '类型', '说明'], rows: [
            ['`source`', '`string`', '完整宏源码；允许使用顶层分号行、方括号 CELL 简写和零参数省略。'],
            ['返回值', '`GridScene`', '包含列轨道、行轨道、留白、字号、文本/线条图元、对齐方式和样式 token。'],
          ],
        },
      ],
    },
    {
      id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '编译器不负责四则运算', text: '`compileMacro` 不会计算 356 + 278，也不会自动补出 634；运算结果必须由计算器或调用方先写入宏源码。源码语法错误会抛出带字符位置的 Error。' }],
    },
  ],
})

export const compileMacroAstPage = compilePage({
  slug: 'compileMacroAst', title: 'compileMacroAst', navLabel: 'compileMacroAst',
  kicker: 'API · MACRO COMPILER', group: 'api',
  summary: '把已经解析完成的 MacroCall AST 编译为 GridScene。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`compileMacroAst`：AST 到 `GridScene` 的底层编译入口。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { compileMacroAst, parseMacro } from '@vertical-arithmetic/core'

const ast = parseMacro('3,5,6;LN;6,3,4;')
// 先解析，再把 AST 交给编译器生成通用场景。
const scene = compileMacroAst(ast)

console.log(scene.rows.length)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它把 `MacroCall` AST 归一化为轨道、图元、对齐和样式组成的 `GridScene`。需要缓存 AST、改写宏树或实现自定义源码前处理时使用；普通调用方优先使用 `compileMacro`。'}] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type CompileMacroAst = (root: MacroCall) => GridScene` },
        { type: 'table', columns: ['参数 / 返回值', '类型', '说明'], rows: [
          ['`root`', '`MacroCall`', '已经由 `parseMacro` 生成的 AST 根调用节点。'],
          ['返回值', '`GridScene`', '可直接交给 SVG、DOM/CSS 渲染器或网格文本工具处理的场景。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '不要传入任意对象', text: '调用方必须传入符合 `MacroCall` 契约的 AST。手动改写 AST 后仍需保持宏节点、参数节点和定位宏结构合法；源码字符串入口请使用 `compileMacro`。'}] },
  ],
})

export const parseMacroPage = compilePage({
  slug: 'parseMacro', title: 'parseMacro', navLabel: 'parseMacro', kicker: 'API · MACRO COMPILER', group: 'api',
  summary: '只解析宏源码并返回 MacroCall AST，适合检查或改写语法树。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`parseMacro`：宏源码到 AST 根节点的解析入口。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { parseMacro } from '@vertical-arithmetic/core'
import type { MacroCall } from '@vertical-arithmetic/core'

// 只解析，不生成轨道或渲染节点。
const ast: MacroCall = parseMacro('ROW(MM(3), MM(5))')

console.log(ast.name) // GRID：顶层 ROW 会被放入隐式 GRID`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它把宏源码转换成 `MacroCall`、`MacroLiteral` 和 `MacroSymbol` 组成的 AST。需要做语法检查、宏分析、格式化或自定义编译前处理时使用；只想得到场景时应直接调用 `compileMacro`。'}] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type ParseMacro = (source: string) => MacroCall` },
        {
          type: 'table', columns: ['AST 节点 / 属性', '类型', '说明'], rows: [
            ['`MacroCall.name`', '`string`', '宏名称，例如 `GRID`、`ROW` 或 `MM`。'],
            ['`MacroCall.arguments`', '`MacroNode[]`', '按源码顺序排列的参数节点。'],
            ['`MacroLiteral.value`', '`string`', '文字或数字字面量内容。'],
            ['`MacroSymbol.name`', '`string`', '不带括号的符号或零参数宏名称。'],
          ],
        },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: 'AST 不是 GridScene', text: '`parseMacro` 不会校验运算布局语义，也不会生成轨道尺寸。源码缺少括号、逗号或引号时会抛出带字符位置的 Error；AST 改写后需要交给 `compileMacroAst` 才能编译。' }] },
  ],
})

export const formatMacroPage = compilePage({
  slug: 'formatMacro', title: 'formatMacro', navLabel: 'formatMacro', kicker: 'API · MACRO COMPILER', group: 'api',
  summary: '解析宏源码并输出带缩进和换行的可读版本。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`formatMacro`：宏源码格式化函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { formatMacro } from '@vertical-arithmetic/core'

const source = 'GRID(ROW(MM(3),MM(5)),LINE,ROW(MM(8)))'
// 输出保留宏层级，并为嵌套参数补充两格缩进。
const formatted = formatMacro(source)

console.log(formatted)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它将紧凑源码转换为适合审阅、日志记录和文档展示的多行源码。格式化只改变空白与换行，不改变宏语义。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type FormatMacro = (source: string) => string` },
        { type: 'table', columns: ['项目', '类型', '说明'], rows: [
          ['`source`', '`string`', '可解析的宏源码。'],
          ['返回值', '`string`', '带缩进和换行的源码；会保留顶层分号行与方括号简写风格。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'info', title: '格式化前会先解析', text: '输入必须是合法宏源码；语法错误会直接抛出 Error。不要把格式化后的字符串当作计算结果，`formatMacro` 只处理源码文本。' }] },
  ],
})

export const minifyMacroPage = compilePage({
  slug: 'minifyMacro', title: 'minifyMacro', navLabel: 'minifyMacro', kicker: 'API · MACRO COMPILER', group: 'api',
  summary: '解析宏源码并输出去除多余空白的最短可读版本。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`minifyMacro`：宏源码压缩函数。' }] },
    {
      id: 'example', title: '例子', blocks: [{
        type: 'code', title: 'TypeScript 示例', language: 'typescript',
        code: `import { minifyMacro } from '@vertical-arithmetic/core'

const source = \`GRID(
  ROW(MM(3), MM(5)),
  LINE,
  ROW(MM(8))
)\`
// 压缩结果适合放入请求体或单行配置。
const compact = minifyMacro(source)

console.log(compact)`,
      }],
    },
    { id: 'purpose', title: '作用', blocks: [{ type: 'paragraph', text: '它移除不必要的换行和空格，并使用可用的最短宏别名，减少源码传输体积。压缩前后编译得到的 `GridScene` 语义保持一致。' }] },
    {
      id: 'signature', title: '函数签名和属性说明', blocks: [
        { type: 'code', title: '函数签名', language: 'typescript', code: `type MinifyMacro = (source: string) => string` },
        { type: 'table', columns: ['项目', '类型', '说明'], rows: [
          ['`source`', '`string`', '可解析的宏源码。'],
          ['返回值', '`string`', '无多余换行和空白的源码，保留必要的分隔符。'],
        ] },
      ],
    },
    { id: 'cautions', title: '注意事项', blocks: [{ type: 'callout', tone: 'warn', title: '压缩不是任意删除字符', text: '函数会先解析源码，因此语法错误仍会抛出 Error。不要使用字符串替换自行删除逗号、分号或引号，否则可能改变文本参数和行结构。' }] },
  ],
})

/** 宏编译分类的页面顺序同时决定侧栏顺序和技术文档页尾翻页顺序。 */
export const macroApiPages = [compileMacroPage, compileMacroAstPage, parseMacroPage, formatMacroPage, minifyMacroPage]
