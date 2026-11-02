import type { MacroDocPage } from './types'

/** 宏编译 API 专题：编译、解析、格式化和压缩。 */
export const macroApiPage: MacroDocPage = {
  slug: 'compile-api',
  title: '宏编译 API',
  navLabel: '宏编译 API',
  kicker: 'REFERENCE · MACRO',
  group: 'api',
  summary: '从源码到 GridScene：compileMacro、parseMacro、formatMacro 与 minifyMacro。',
  sections: [
    {
      id: 'compile-macro',
      title: 'compileMacro',
      blocks: [
        {
          type: 'paragraph',
          text: '一步完成“解析 + 编译”，返回渲染器可直接消费的 `GridScene`。这是网页输入框和调用方最常用的入口。',
        },
        {
          type: 'code',
          title: '签名',
          code: `import type { GridScene } from '@vertical-arithmetic/grid'

type CompileMacro = (source: string) => GridScene`,
        },
        {
          type: 'code',
          title: '使用',
          code: `import { compileMacro } from '@vertical-arithmetic/macro'

const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')

console.log(scene.columns.length)  // 4
console.log(scene.rows.length)     // 3
console.log(scene.elements.length) // 文本与线条图元数量`,
        },
        {
          type: 'table',
          columns: ['参数 / 返回值', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '完整宏源码，允许结尾省略分号。'],
            ['返回值', '`GridScene`', '列、行、留白、字号、文本、线条与样式 token。'],
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          title: '宏层不计算',
          text: '`compileMacro` 不会计算 356 + 278，也不会补出 634。运算结果必须由调用方或计算器包先算好，再写进宏源码。',
        },
      ],
    },
    {
      id: 'parse-macro',
      title: 'parseMacro',
      blocks: [
        {
          type: 'paragraph',
          text: '只做语法解析，返回宏 AST 的根节点。需要在编译器之外检查或改写语法树时使用；如果只是要画面，直接用 `compileMacro`。',
        },
        {
          type: 'code',
          title: '使用',
          code: `import { parseMacro } from '@vertical-arithmetic/macro'
import type { MacroCall, MacroNode } from '@vertical-arithmetic/macro'

const ast: MacroCall = parseMacro('ROW(MM(3), MM(5))')

const firstArgument: MacroNode = ast.arguments[0]
console.log(firstArgument.kind) // 'call'`,
        },
        {
          type: 'table',
          columns: ['AST 节点', '字段', '用途'],
          rows: [
            ['`MacroCall`', '`name`、`arguments`', '宏调用，例如 `ROW(...)`。'],
            ['`MacroLiteral`', '`value`', '文字或数字字面量。'],
            ['`MacroSymbol`', '`name`', '无括号保留常量，例如 `DOT`。'],
          ],
        },
      ],
    },
    {
      id: 'format-macro',
      title: 'formatMacro 与 minifyMacro',
      blocks: [
        {
          type: 'paragraph',
          text: '两者都以源码字符串为输入、以源码字符串为输出。`formatMacro` 增加缩进和换行，便于阅读；`minifyMacro` 使用最短别名和省略规则，便于嵌入或传输。',
        },
        {
          type: 'code',
          title: '使用',
          code: `import { formatMacro, minifyMacro } from '@vertical-arithmetic/macro'

const source = '3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;'

console.log(formatMacro(source))
console.log(minifyMacro(source))`,
        },
        {
          type: 'table',
          columns: ['API', '输入', '输出', '是否改变语义'],
          rows: [
            ['`formatMacro(source)`', '宏源码', '带缩进的可读源码', '不改变'],
            ['`minifyMacro(source)`', '宏源码', '最短可读源码', '不改变'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          title: '语法错误',
          text: '解析失败时三个函数都会抛出带字符位置的错误。网页端可以直接把错误信息显示在输入框下方。',
        },
      ],
    },
  ],
}
