import type { MacroDocPage } from './types'

/** 宏处理 API 页面共用的固定阅读顺序：名称、例子、作用、签名和属性、注意事项。 */
const compilePage = (page: MacroDocPage): MacroDocPage => ({
  ...page,
  apiTier: 'common',
})

/** AST 直编译和 AST 序列化属于高级 API，普通源码调用优先使用字符串入口。 */
const advancedCompilePage = (page: MacroDocPage): MacroDocPage => ({
  ...page,
  apiTier: 'advanced',
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
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { compileMacro } from '@u1in/shushi-core'

// 分号分隔三行，编译器会把它们转换成 GridScene。
const scene = compileMacro('3,5,6;+,[2,RB(1)],[7,RB(1)],8;LN;6,3,4;')

// 也可以传入纯色主题；主题会在编译阶段写入 GridScene。
const themedScene = compileMacro('3,5,6;LN;6,3,4;', {
  fontFamily: 'STIX Two Math',
  colorTheme: {
    text: '#243b64', carry: '#0f766e', borrow: '#8b5cf6',
    operator: '#be123c', decimal: '#c026d3',
    rule: { color: '#334155', thickness: 2 },
    bracketRule: { color: '#2563eb', thickness: 2 },
  },
})

console.log(scene.elements.length, themedScene.elements.length) // 文本与线条图元数量`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它串联 `parseMacro` 与编译器，把源码中的行、单元格、定位宏和线条转换为与运算无关的 `GridScene`。网页输入框、计算器布局结果和文档示例都可以使用这个入口。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type CompileMacro = (source: string, options?: {
  colorTheme?: AutoColorTheme
  fontFamily?: string
}) => GridScene`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '完整宏源码；允许使用顶层分号行、方括号 CELL 简写和零参数省略。'],
            [
              '`options.colorTheme`',
              '`AutoColorTheme`',
              '覆盖 autoColor 的固定语义颜色；颜色值可以是普通 CSS 色值。省略时使用内置 JavaScript 主题，主题会在编译阶段写入 GridScene。',
            ],
            [
              '`options.fontFamily`',
              '`string`',
              '写入 `GridScene.fontFamily` 的默认字体名称；省略时为 STIX Two Math，随 `renderer.css` 内置。改用其他字体时使用 `renderer-without-font.css` 加对应字体 CSS。',
            ],
            [
              '返回值',
              '`GridScene`',
              '包含列轨道、行轨道、留白、字号、默认字体、文本/线条图元、对齐方式和样式 token。',
            ],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '编译器不负责计算',
          text: '`compileMacro` 不会计算 356 + 278，也不会自动补出 634；运算结果必须由计算器或调用方先写入宏源码。源码语法错误会抛出带字符位置的 Error。',
        },
      ],
    },
  ],
})

export const compileMacroAstPage = advancedCompilePage({
  slug: 'compileMacroAst',
  title: 'compileMacroAst',
  navLabel: 'compileMacroAst',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '把已经解析完成的 MacroCall AST 编译为 GridScene。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`compileMacroAst`：AST 到 `GridScene` 的底层编译入口。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { compileMacroAst, parseMacro } from '@u1in/shushi-core'

const ast = parseMacro('3,5,6;LN;6,3,4;')
// 先解析，再把 AST 交给编译器生成通用场景。
const scene = compileMacroAst(ast)

console.log(scene.rows.length)`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它把 `MacroCall` AST 归一化为轨道、图元、对齐和样式组成的 `GridScene`。需要缓存 AST、改写宏树或实现自定义源码前处理时使用；普通调用方优先使用 `compileMacro`。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type CompileMacroAst = (
  root: MacroCall,
  options?: { colorTheme?: AutoColorTheme; fontFamily?: string },
) => GridScene`,
        },
        {
          type: 'table',
          columns: ['参数 / 返回值', '类型', '说明'],
          rows: [
            ['`root`', '`MacroCall`', '已经由 `parseMacro` 生成的 AST 根调用节点。'],
            ['返回值', '`GridScene`', '可直接交给 SVG、DOM/CSS 渲染器或网格文本工具处理的场景。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '不要传入任意对象',
          text: '调用方必须传入符合 `MacroCall` 契约的 AST。手动改写 AST 后仍需保持宏节点、参数节点和定位宏结构合法；源码字符串入口请使用 `compileMacro`。',
        },
      ],
    },
  ],
})

export const parseMacroPage = compilePage({
  slug: 'parseMacro',
  title: 'parseMacro',
  navLabel: 'parseMacro',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '只解析宏源码并返回 MacroCall AST，适合检查或改写语法树。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`parseMacro`：宏源码到 AST 根节点的解析入口。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { parseMacro } from '@u1in/shushi-core'
import type { MacroCall } from '@u1in/shushi-core'

// 只解析，不生成轨道或渲染节点。
const ast: MacroCall = parseMacro('ROW(MM(3), MM(5))')

console.log(ast.name) // GRID：顶层 ROW 会被放入隐式 GRID`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它把宏源码转换成 `MacroCall`、`MacroLiteral` 和 `MacroSymbol` 组成的 AST。需要做语法检查、宏分析、格式化或自定义编译前处理时使用；只想得到场景时应直接调用 `compileMacro`。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type ParseMacro = (source: string) => MacroCall`,
        },
        {
          type: 'table',
          columns: ['AST 节点 / 属性', '类型', '说明'],
          rows: [
            ['`MacroCall.name`', '`string`', '宏名称，例如 `GRID`、`ROW` 或 `MM`。'],
            ['`MacroCall.arguments`', '`MacroNode[]`', '按源码顺序排列的参数节点。'],
            ['`MacroLiteral.value`', '`string`', '文字或数字字面量内容。'],
            ['`MacroSymbol.name`', '`string`', '不带括号的符号或零参数宏名称。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: 'AST 不是 GridScene',
          text: '`parseMacro` 不会校验运算布局语义，也不会生成轨道尺寸。源码缺少括号、逗号或引号时会抛出带字符位置的 Error；AST 改写后需要交给 `compileMacroAst` 才能编译。',
        },
      ],
    },
  ],
})

export const formatMacroPage = compilePage({
  slug: 'formatMacro',
  title: 'formatMacro',
  navLabel: 'formatMacro',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '解析宏源码并输出带缩进和换行的可读版本。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`formatMacro`：宏源码格式化函数。' }] },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { formatMacro } from '@u1in/shushi-core'

const source = 'GRID(ROW(MM(3),MM(5)),LINE,ROW(MM(8)))'
// 输出保留宏层级，并为嵌套参数补充两格缩进。
const formatted = formatMacro(source)

console.log(formatted)`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它将紧凑源码转换为适合审阅、日志记录和文档展示的多行源码。格式化只改变空白与换行，不改变宏语义。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type FormatMacro = (source: string) => string`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '可解析的宏源码。'],
            ['返回值', '`string`', '带缩进和换行的源码；会保留顶层分号行与方括号简写风格。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'info',
          title: '格式化前会先解析',
          text: '输入必须是合法宏源码；语法错误会直接抛出 Error。不要把格式化后的字符串当作计算结果，`formatMacro` 只处理源码文本。',
        },
      ],
    },
  ],
})

export const completeMacroPage = compilePage({
  slug: 'completeMacro',
  title: 'completeMacro',
  navLabel: 'completeMacro',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '把宏源码补全为显式 GRID、ROW、CELL 和定位宏结构。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`completeMacro`：宏源码完整化函数。' }] },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { completeMacro } from '@u1in/shushi-core'

const source = '3,5;LN;8;'
const completed = completeMacro(source)

console.log(completed) // 显式展开为 GRID / ROW / CELL 结构`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它把适合输入和复制的简写宏展开为更适合调试、审阅和二次改写的完整结构，同时保留宏的语义。需要阅读或修改 AST 前，可以先用它查看完整源码。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type CompleteMacro = (source: string) => string`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '可解析的宏源码，允许使用分号行、方括号和零参数简写。'],
            ['返回值', '`string`', '显式展开后的可读宏源码。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'info',
          title: '只改变表达形式',
          text: '`completeMacro` 不计算运算结果，也不生成 `GridScene`；只想得到场景时使用 `compileMacro`，只想格式化空白时使用 `formatMacro`。',
        },
      ],
    },
  ],
})

export const unformatMacroPage = compilePage({
  slug: 'unformatMacro',
  title: 'unformatMacro',
  navLabel: 'unformatMacro',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '移除宏源码中的格式化空白，并保留原有宏结构表达。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`unformatMacro`：宏源码去格式化函数。' }] },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { unformatMacro } from '@u1in/shushi-core'

const formatted = 'GRID(\\n  ROW(MM(3), MM(5)),\\n  LINE\\n)'
const compact = unformatMacro(formatted)

console.log(compact) // 移除换行和缩进，但不启用额外语法糖`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它只移除换行、缩进和不影响语义的空白，适合在保留完整宏名称和调用层级的前提下压缩日志或传输文本。需要启用别名、方括号和默认值省略时，应改用 `minifyMacro`。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type UnformatMacro = (source: string) => string`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '可解析的带缩进或换行宏源码。'],
            ['返回值', '`string`', '去除格式化空白后的宏源码。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'info',
          title: '不要把它当作最简化',
          text: '`unformatMacro` 不会主动降级宏名称或删除默认配置；需要最短可编译源码时使用 `minifyMacro`。',
        },
      ],
    },
  ],
})

export const minifyMacroPage = compilePage({
  slug: 'minifyMacro',
  title: 'minifyMacro',
  navLabel: 'minifyMacro',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '把完整宏源码转换为去除空白、启用语法糖的最简形式。',
  sections: [
    { id: 'name', title: '名称', blocks: [{ type: 'paragraph', text: '`minifyMacro`：宏源码压缩函数。' }] },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { minifyMacro } from '@u1in/shushi-core'

const source = \`GRID(
  ROW(MM(3), MM(5)),
  LINE,
  ROW(MM(8))
)\`
// 完整 GRID/ROW/CELL 写法会进一步降级为分号行、方括号和最短宏名。
const compact = minifyMacro(source)

console.log(compact)
// 3,5;LN;8;`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它移除不必要的换行和空格，使用最短宏别名，并在不影响语法与语义时把完整的 `GRID`、`ROW`、`CELL`、`MM` 写法降级为顶层分号行、方括号和可省略的 `MM`。最简化还会省略 GRID、ROW、LINE、CELL 和 STYLE 已知的默认 KV，以及能由当前 GRID 结构推导或已被短除法规则接管的配置。方括号首项为裸文字时省略 `MM`；无配置的单图元 CELL 会继续消除外壳，例如 `CELL(MM(1))` / `[1]` 输出 `1`，`CELL(RB(1))` / `[RB(1)]` 输出 `RB(1)`。压缩前后编译得到的 `GridScene` 语义保持一致。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type MinifyMacro = (source: string) => string`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '可解析的宏源码。'],
            ['返回值', '`string`', '最短可读写法；无场景级 KV 配置时优先使用分号行，有配置时保留必要的 GRID 根节点。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '压缩不是任意删除字符',
          text: '函数会先解析源码，因此语法错误仍会抛出 Error。它只改变宏源码表达方式，不验证加法、减法、乘法或除法的业务计算结果；不要使用字符串替换自行删除逗号、分号或引号。',
        },
      ],
    },
  ],
})

export const minifyMacroAstPage = advancedCompilePage({
  slug: 'minifyMacroAst',
  title: 'minifyMacroAst',
  navLabel: 'minifyMacroAst',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '将已改写的宏 AST 按正式最简化规则输出为宏源码。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`minifyMacroAst`：AST 形式的最简宏生成函数。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { minifyMacroAst, parseMacro } from '@u1in/shushi-core'

const ast = parseMacro('GRID(ROW(MM(3), MM(5)), LINE, ROW(MM(8)))')
const source = minifyMacroAst(ast)

console.log(source) // '3,5;LN;8;'`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它使用与 `minifyMacro` 完全相同的默认配置省略、方括号简写、顶层分号行和别名规则，但调用方可以先在 AST 层完成受控改写。组合竖式布局使用它生成复制到宏调试的宏源码框的源码，不自行拼接宏字符串。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type MinifyMacroAst = (
  root: MacroCall,
  omitDefaults?: boolean,
) => string`,
        },
        {
          type: 'table',
          columns: ['参数 / 返回值', '类型', '说明'],
          rows: [
            ['`root`', '`MacroCall`', '已经解析或由调用方安全改写过的宏 AST。'],
            ['`omitDefaults`', '`boolean`', '默认 `true`，省略可推导或已知默认配置。'],
            ['返回值', '`string`', '可重新交给 `compileMacro` 的正式最简宏源码。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '先确保 AST 合法',
          text: '函数不验证业务计算；手动改写 AST 时必须保留合法的 GRID、ROW、CELL 与定位宏结构。只有需要 AST 处理时使用它，普通字符串输入请使用 `minifyMacro`。',
        },
      ],
    },
  ],
})

export const minifyMacroForCopyPage = compilePage({
  slug: 'minifyMacroForCopy',
  title: 'minifyMacroForCopy',
  navLabel: 'minifyMacroForCopy',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '为计算器的“复制宏命令”导出可粘贴编辑的最简源码。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`minifyMacroForCopy`：计算器宏的复制导出函数。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { minifyMacroForCopy } from '@u1in/shushi-core'

const source = 'GRID(KV(ariaLabel,"加法"),ROW(MM(3,KV(style,addition.addend)),MM(5)))'
const copied = minifyMacroForCopy(source)

console.log(copied) // '3,5;'`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它先解析原始宏，再移除计算器页面专属的 `ariaLabel` 和 `style` KV，省略右对齐行首仅用于缩进的 `EMPTY`，最后通过正式的 AST 最简化 API 输出别名、方括号与分号行。尺寸、辅助网格、必要列数和其他会影响可见几何的非默认配置会保留；所有首页计算器的“复制宏命令”均使用此 API。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type MinifyMacroForCopy = (source: string) => string`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`source`', '`string`', '计算器布局生成的可解析宏源码。'],
            ['返回值', '`string`', '适合直接粘贴到宏调试的宏源码框的最简宏，不含页面专属 aria 或 style KV。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '仅用于计算器导出',
          text: '此 API 会有意删除 `style` KV；手写宏若依赖自定义样式 token，应使用 `minifyMacro`，而不是本函数。需要先改写 AST 的布局器可使用 `minifyMacroForCopyAst`。',
        },
      ],
    },
  ],
})

export const minifyMacroForCopyAstPage = advancedCompilePage({
  slug: 'minifyMacroForCopyAst',
  title: 'minifyMacroForCopyAst',
  navLabel: 'minifyMacroForCopyAst',
  kicker: 'API · MACRO COMPILER',
  group: 'api',
  summary: '为已改写的计算器宏 AST 导出可粘贴编辑的最简源码。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`minifyMacroForCopyAst`：计算器 AST 的复制导出函数。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { minifyMacroForCopyAst, parseMacro } from '@u1in/shushi-core'

const ast = parseMacro('GRID(KV(ariaLabel,"加法"),ROW(MM(3,KV(style,addition.addend)),MM(5)))')
const copied = minifyMacroForCopyAst(ast)

console.log(copied) // '3,5;'`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它用于布局器已在 AST 层完成安全改写的情形。函数统一删除页面专属 `ariaLabel`、`style` KV，再沿用 `minifyMacroAst` 的默认配置省略、语法糖与别名规则，避免调用方重新实现字符串序列化。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type MinifyMacroForCopyAst = (root: MacroCall) => string`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`root`', '`MacroCall`', '计算器布局安全改写后的宏 AST 根节点。'],
            ['返回值', '`string`', '适合直接粘贴到宏调试的宏源码框的最简宏。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '不要手写序列化',
          text: '调用方应只改写 AST 的必要结构，然后交给本函数输出源码。普通字符串输入请使用 `minifyMacroForCopy`；手写宏若依赖自定义样式 token，请使用 `minifyMacro`。',
        },
      ],
    },
  ],
})

export const createMacroAstInspectionPage = compilePage({
  slug: 'createMacroAstInspection',
  title: 'createMacroAstInspection',
  navLabel: 'createMacroAstInspection',
  kicker: 'API · MACRO INSPECTOR',
  group: 'api',
  summary: '编译宏源码，并建立渲染元素到 AST 节点的可编辑反查映射。',
  sections: [
    {
      id: 'name',
      title: '名称',
      blocks: [{ type: 'paragraph', text: '`createMacroAstInspection`：宏渲染元素检查与单项编辑入口。' }],
    },
    {
      id: 'example',
      title: '例子',
      blocks: [
        {
          type: 'code',
          title: 'TypeScript 示例',
          language: 'typescript',
          code: `import { createMacroAstInspection } from '@u1in/shushi-core'

const inspection = createMacroAstInspection('GRID(ROW(MM(3), MM(5)), LINE, ROW(MM(8)))')
const five = inspection.scene.elements.find(
  ({ content }) => content.kind === 'text' && content.text === '5',
)

// 由渲染元素 ID 反查 MM(5) 的 AST 节点，并只替换它的文字字面量。
const updated = inspection.updateElementText(five!.id, '9')

console.log(updated.source)
// 仍沿用输入的完整格式`,
        },
      ],
    },
    {
      id: 'purpose',
      title: '作用',
      blocks: [
        {
          type: 'paragraph',
          text: '它把 `GridScene` 与一份元素 ID → AST 节点路径映射并列返回。调用方可以用渲染器节点上的 `data-grid-element-id` 找到对应的 `references[elementId]`，再通过 `updateElementText` 仅修改该节点的第一个文字字面量；更新结果会重新编译场景，并提供沿用输入风格的 `source` 与统一最简化的 `minifiedSource`。',
        },
      ],
    },
    {
      id: 'signature',
      title: '函数签名和属性说明',
      blocks: [
        {
          type: 'code',
          title: '函数签名',
          language: 'typescript',
          code: `type CreateMacroAstInspection = (source: string) => MacroAstInspection

interface MacroAstInspection {
  ast: MacroCall
  scene: GridScene
  sourceStyle: 'formatted' | 'minified'
  source: string
  minifiedSource: string
  references: Record<string, MacroElementAstReference>
  updateElementText: (elementId: string, text: string) => MacroAstInspection
}`,
        },
        {
          type: 'table',
          columns: ['项目', '类型', '说明'],
          rows: [
            ['`sourceStyle`', '`"formatted" | "minified"`', '记录当前输入框使用的完整版或最简版风格。'],
            [
              '`references`',
              '`Record<string, MacroElementAstReference>`',
              '以 `GridElement.id` 为键，包含来源 AST 节点、路径以及可编辑文字路径。',
            ],
            ['`updateElementText`', '函数', '不可变地替换所选图元的第一个文字字面量，并返回新的检查结果。'],
            ['`source`', '`string`', '当前 AST 按输入框原有完整版或最简版风格重新输出的宏源码。'],
            ['`minifiedSource`', '`string`', '当前 AST 统一输出的最简宏源码。'],
          ],
        },
      ],
    },
    {
      id: 'cautions',
      title: '注意事项',
      blocks: [
        {
          type: 'callout',
          tone: 'warn',
          title: '并非所有图元都包含文字',
          text: '数字、运算符和进位注记通常可以编辑；LINE、BRACKET、边框和 DIV 等图元仍可反查来源节点，但没有文字字面量，调用 `updateElementText` 会抛出 Error。映射不写入 GridScene，因此渲染器仍保持与宏语言无关。',
        },
      ],
    },
  ],
})

/** 宏编译分类的页面顺序同时决定 API 文档侧栏顺序和页尾翻页顺序。 */
export const macroApiPages = [
  compileMacroPage,
  compileMacroAstPage,
  parseMacroPage,
  formatMacroPage,
  completeMacroPage,
  unformatMacroPage,
  minifyMacroPage,
  minifyMacroAstPage,
  minifyMacroForCopyPage,
  minifyMacroForCopyAstPage,
  createMacroAstInspectionPage,
]
