import type { MacroDocPage } from './types'

/**
 * 不针对单个图元的语法糖：顶层分号行、方括号单元格、零参数省略与输入别名。
 * 这三页解释“源码如何被改写”，后续页面再逐个讲定位、点和边框。
 */
export const sugarSyntaxPages: MacroDocPage[] = [
  {
    slug: 'row-shorthand',
    title: '顶层分号行',
    navLabel: '顶层分号行',
    kicker: 'SYNTAX SUGAR · 01',
    group: 'sugar',
    summary: '在顶层用分号分隔行、用逗号分隔同一行的单元格，解析器会自动补出 ROW 与隐式 GRID。裸文字会补成 MM，横线单独保留。',
    sections: [
      {
        id: 'purpose',
        title: '作用与展开结果',
        blocks: [
          {
            type: 'paragraph',
            text: '完整命令需要为每一行写 `ROW(...)`，最后还要包一层 `GRID(...)`。当没有任何场景配置时，这些包裹都是重复的；分号行简写把「一行」直接写成以分号结束的片段。',
          },
          {
            type: 'code',
            title: '简写',
            code: '1, 2;\n×, 1, 2;\nLN;\n1, 4, 4;',
          },
          {
            type: 'code',
            title: '展开后的完整命令',
            code: 'GRID(\n  ROW(MM(1), MM(2)),\n  ROW(MM(×), MM(1), MM(2)),\n  LINE,\n  ROW(MM(1), MM(4), MM(4))\n)',
          },
        ],
      },
      {
        id: 'rules',
        title: '展开规则',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**分号分行**：每个普通分号段变成一个 `ROW(...)`。',
              '**逗号分格**：段内的逗号仍然分隔同一行的单元格。',
              '**裸文字补 MM**：段内的裸文字自动包成 `MM(text)`，所以可以直接写数字和运算符。',
              '**横线保留**：单独一段 `LINE` 或 `LINE(...)` 不会被包成 ROW，仍作为横线图元。',
              '**整体包 GRID**：所有行与横线最后放进隐式 `GRID(...)`。',
              '**末尾分号可省**：最后一个分号可以省略，解析结果相同。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '只作用于顶层',
            text: '分号行简写只在最外层生效。`CELL(...)`、`ROW(...)`、`GRID(...)` 的括号内部仍然必须用逗号分隔参数；括号里出现分号会报错。',
          },
        ],
      },
      {
        id: 'compare',
        title: '完整版与语法糖版对照',
        blocks: [
          {
            type: 'compare',
            leftTitle: '完整命令版',
            leftCode: 'GRID(\n  ROW(MM(1), MM(2)),\n  ROW(MM(×), MM(1), MM(2)),\n  LINE,\n  ROW(MM(1), MM(4), MM(4))\n)',
            rightTitle: '顶层分号版',
            rightCode: '1,2;\n×,1,2;\nLN;\n1,4,4;',
            note: '两段源码输出完全相同的 GridScene。对照时注意：分号版没有显式 GRID，因此不能同时写场景配置。',
          },
        ],
      },
      {
        id: 'when-not',
        title: '什么时候不要用',
        blocks: [
          {
            type: 'list',
            items: [
              '需要 `columns`、`showGrid`、`unitWidth`、`autoColor` 等配置时，必须写显式 `GRID`；分号简写没有配置入口。',
              '需要单独控制某一行的 `align` 时，必须写显式 `ROW(..., KV(align, left))`。',
              '不要把显式 `GRID(...)` 和额外的分号行混在一起：那会得到嵌套的 GRID 或非法子节点。',
              '如果源码里一个分号都没有，裸文字不会自动变成行；此时必须写完整 `ROW(MM(...))`。',
            ],
          },
          {
            type: 'callout',
            tone: 'danger',
            title: '不能混用',
            text: '`GRID(ROW(MM(5))); ROW(MM(6));` 会尝试把 GRID 和 ROW 一起包进新的隐式 GRID，最终报错。显式 GRID 要么完整包住所有行，要么完全不用。',
          },
        ],
      },
      {
        id: 'errors',
        title: '常见错误',
        blocks: [
          {
            type: 'table',
            columns: ['错误写法', '原因', '修正'],
            rows: [
              ['`GRID(ROW(MM(5)); ROW(MM(6)))`', '分号写进了括号内部。', '括号内改用逗号。'],
              ['`5,6`（没有分号）', '没有触发分行，裸文字不是合法 GRID 子项。', '在行末补分号，或写完整 `ROW(MM(5), MM(6))`。'],
              ['`5,6;LN;` 后继续写 `KV(columns, 3)`', '分号简写没有 GRID 配置入口。', '改写为显式 `GRID(KV(columns, 3), ROW(...), LINE)`。'],
            ],
          },
        ],
      },
      {
        id: 'practice',
        title: '动手练习',
        blocks: [
          {
            type: 'sandbox',
            title: '用分号行补全算式',
            task: '把两行乘法过程补成完整竖式：第一行 1 2，第二行 × 1 2，第三行横线，第四行结果 1 4 4。',
            starter: '1,2;\n×,1,2;',
            answer: '1,2;\n×,1,2;\nLN;\n1,4,4;',
            hint: '横线用 `LN` 单独一个分号段；结果行继续用逗号分格。',
          },
        ],
      },
      {
        id: 'related',
        title: '相关页面',
        blocks: [
          {
            type: 'cards',
            items: [
              { title: '方括号 []', text: '在分号行里继续压缩同格图元。', to: '/macro-rules/cell-shorthand' },
              { title: 'ROW · 数字行', text: '完整命令中的行结构。', to: '/macro-rules/row' },
              { title: '录入示例', text: '三道竖式的完整版与语法糖版对照。', to: '/macro-rules/examples' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'cell-shorthand',
    title: '方括号 CELL 简写 []',
    navLabel: '方括号 []',
    kicker: 'SYNTAX SUGAR · 02',
    group: 'sugar',
    summary: '方括号是 CELL 的短写形式：[5, RB(1)] 等价于 CELL(MM(5), RB(1))。只有首项可以省略 MM，后续项必须是完整宏或零参数宏。',
    sections: [
      {
        id: 'purpose',
        title: '作用与展开结果',
        blocks: [
          {
            type: 'paragraph',
            text: '同一个格子里叠数字、进位点或小数点时，完整写法需要 `CELL(MM(...), ...)`。方括号把 `CELL` 和首项的 `MM` 一起省掉，只保留真正的图元差异。',
          },
          {
            type: 'compare',
            leftTitle: '完整命令版',
            leftCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), RB(1)))\n)',
            rightTitle: '方括号版',
            rightCode: 'GRID(\n  ROW(MM(5), [6, RB(1)])\n)',
            note: '两段源码输出相同场景。方括号可以出现在任何原本允许 `CELL(...)` 的位置。',
          },
        ],
      },
      {
        id: 'rules',
        title: '首项与后续项规则',
        blocks: [
          {
            type: 'table',
            columns: ['位置', '允许的写法', '说明'],
            rows: [
              ['第一项', '`MM(text)` 或裸文字', '裸文字会自动补成 `MM(text)`；这是唯一能省略 MM 的位置。'],
              ['后续项', '完整宏调用', '例如 `RB(1)`、`TBD()`、`KV(columnSpan, 2)`。'],
              ['后续项', '零参数图元', '`DOT`、`MTD`、`BK`、`TBD`、`RBD`、`BBD`、`LBD` 可以不带括号；`EP` 是 ROW 的单元格，不能放进 CELL。'],
            ],
          },
          {
            type: 'list',
            items: [
              '方括号内部同样用逗号分隔，不能使用分号。',
              '`[5, 1]` 无效：后续的 1 不是完整宏调用，也不会自动补 MM。',
              '`[5, RB]` 无效：`RB` 需要文字参数，不能按零参数宏处理。',
              '`[RB(1), 5]` 无效：首项必须是文字或 `MM(text)`。',
              '`[]` 无效：至少需要首项文字。',
              '方括号不能嵌套：后续项不能是另一个 `[...]`。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '保留语法',
            text: '`[` 与 `]` 是 CELL 简写的保留符号。要把它们作为普通文字显示，必须用双引号包裹，例如 `MM("[5]")`。',
          },
        ],
      },
      {
        id: 'options',
        title: '在方括号里写配置',
        blocks: [
          {
            type: 'paragraph',
            text: '方括号内部仍然支持 CELL 的配置项。`KV(columnSpan, n)` 与 `KV(style, token)` 可以和其他图元一起写；它们会在解析时原样变成 `CELL` 的参数。',
          },
          {
            type: 'code',
            title: '跨列并改变样式',
            code: '[8, KV(columnSpan, 2), KV(style, macro.input)]',
          },
          {
            type: 'paragraph',
            text: '对应的完整写法是 `CELL(MM(8), KV(columnSpan, 2), KV(style, macro.input))`。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '进位点与数字同格',
            code: 'GRID(\n  ROW(MM(5), [6, RB(1)])\n)',
            note: '6 居中，1 在右下角；两者共享同一个单元格。',
          },
          {
            type: 'example',
            title: '小数点与数字同格',
            code: 'GRID(\n  ROW([7, DOT])\n)',
            note: '`DOT` 是零参数宏，可以不带括号写在后续项中。',
          },
        ],
      },
      {
        id: 'errors',
        title: '常见错误',
        blocks: [
          {
            type: 'table',
            columns: ['错误信息', '触发原因', '修正'],
            rows: [
              ['`CELL 简写首项必须是 MM(text) 或可省略 MM 的文字值`', '首项写了 `RB(1)` 或其他定位宏。', '把文字放在首项，定位宏放到后面。'],
              ['`CELL 简写只有首项可以省略 MM；后续项必须写成完整宏调用`', '后续项写了裸文字或裸的 `RB`。', '写成 `RB(1)`，或把文字移到首项。'],
              ['`CELL 简写至少需要首项文字`', '写了 `[]`。', '至少补一个文字，例如 `[5]`。'],
              ['`CELL 简写参数之间必须使用逗号分隔`', '用了空格或分号。', '改成逗号。'],
            ],
          },
        ],
      },
      {
        id: 'practice',
        title: '动手练习',
        blocks: [
          {
            type: 'sandbox',
            title: '把数字与进位点合并',
            task: '第二格现在是独立的 6；把它改成 6 与进位点 1 同格，并尽量使用方括号简写。',
            starter: 'GRID(\n  ROW(MM(5), MM(6))\n)',
            answer: 'GRID(\n  ROW(MM(5), [6, RB(1)])\n)',
            hint: '方括号首项写 6，后续项写完整的 `RB(1)`。',
          },
        ],
      },
      {
        id: 'related',
        title: '相关页面',
        blocks: [
          {
            type: 'cards',
            items: [
              { title: 'CELL · 单元格', text: '方括号展开后的完整宏。', to: '/macro-rules/cell' },
              { title: 'RB · 右下角文字', text: '最常与方括号一起使用的定位宏。', to: '/macro-rules/rb' },
              { title: 'DOT · 小数点', text: '零参数的小数点简写。', to: '/macro-rules/dot' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'zero-argument',
    title: '零参数省略与输入别名',
    navLabel: '零参数省略与别名',
    kicker: 'SYNTAX SUGAR · 03',
    group: 'sugar',
    summary: 'LN、EP、BK 分别是 LINE、EMPTY、BRACKET 的输入别名；零参数宏还可以省略空括号。`MTD` 则是 `MT(·)` 的零参数专用简写。',
    sections: [
      {
        id: 'aliases',
        title: '三个输入别名',
        blocks: [
          {
            type: 'table',
            columns: ['写法', '还原为', '常见位置', '说明'],
            rows: [
              ['`LN`', '`LINE`', 'GRID 直接子项', '行级横线；可写成 `LN` 或 `LN(...)`。'],
              ['`EP`', '`EMPTY`', 'ROW 的单元格位置', '占位空单元格；可写成 `EP` 或 `EP(...)`。'],
              ['`BK`', '`BRACKET`', 'ROW 单元格或 `CELL(BK)`', '厂字弯；必须独占一个 CELL。'],
            ],
          },
          {
            type: 'paragraph',
            text: '别名只存在于源码边界。解析器先把 `LN`、`EP`、`BK` 归一化为 `LINE`、`EMPTY`、`BRACKET`，后续 AST、编译器与渲染器都只看到完整宏名。',
          },
        ],
      },
      {
        id: 'zero-argument',
        title: '可以省略空括号的宏',
        blocks: [
          {
            type: 'table',
            columns: ['宏', '省略写法', '语境'],
            rows: [
              ['`LINE`', '`LINE` 或 `LN`', '必须位于至少一个 ROW 之后。'],
              ['`EMPTY`', '`EMPTY` 或 `EP`', 'ROW 的单元格位置。'],
              ['`BRACKET`', '`BRACKET` 或 `BK`', '独占单元格。'],
              ['`STYLE`', '`STYLE`', 'LINE 或边框宏的参数。'],
              ['`DIV`', '`DIV`', 'ROW 的直接子项。'],
              ['`TBD / RBD / BBD / LBD`', '`TBD` 等', 'CELL 内。'],
              ['`MTD`', '`MTD` 或 `MTD()`', 'CELL 内，表示中上借位点。'],
            ],
          },
          {
            type: 'callout',
            tone: 'warn',
            title: '需要参数的宏不能省括号',
            text: '`MM`、`RB`、`MT`、`VALUE`、`KV` 都必须保留括号。裸写 `MM` 不会自动变成“空文字居中的单元格”，裸写 `RB` 也不会被当作进位宏。`MTD` 是专门的无参数借位点宏，不能写成裸 `MT`。',
          },
        ],
      },
      {
        id: 'formatting',
        title: '格式化与去格式化',
        blocks: [
          {
            type: 'paragraph',
            text: '格式化器会输出最短合法宏名：`LINE` 变 `LN`、`EMPTY` 变 `EP`、`BRACKET` 变 `BK`。去格式化（`minifyMacro`）还会去掉空格与换行，但不会改变语义。',
          },
          {
            type: 'code',
            title: '输入与输出',
            code: 'LINE  → LN\nEMPTY → EP\nBRACKET → BK',
          },
          {
            type: 'paragraph',
            text: '因此不要把格式化结果当作“另一种语法”——它只是同一棵 AST 的更短写法。需要可读的完整结构时，可以手动写全名。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'compare',
            leftTitle: '带空括号',
            leftCode: 'GRID(\n  ROW(MM(5), EMPTY(), MM(6)),\n  LINE()\n)',
            rightTitle: '零参数省略',
            rightCode: 'GRID(\n  ROW(MM(5), EP, MM(6)),\n  LN\n)',
            note: '解析后两段源码完全等价；省略只发生在零参数宏上。',
          },
          {
            type: 'example',
            title: '厂字弯的两种省略层级',
            code: 'GRID(\n  ROW(MM(3), BK, MM(1), MM(4))\n)',
            note: '`BK` 直接作为单元格内容时等价于 `CELL(BRACKET)`；如果要写样式，仍应使用 `CELL(BK, KV(style, ...))`。',
          },
        ],
      },
      {
        id: 'errors',
        title: '常见错误',
        blocks: [
          {
            type: 'table',
            columns: ['错误写法', '原因', '修正'],
            rows: [
              ['`GRID(ROW(MM(5)), MM(6))`', '`MM(6)` 不是 GRID 的合法子项。', '包成 `ROW(MM(6))`。'],
              ['`[5, RB]`', '`RB` 需要文字参数。', '写成 `[5, RB(1)]`。'],
              ['`GRID(ROW(LINE))`', '`LINE` 不能放进 ROW。', '把 `LINE` 写到 ROW 外。'],
              ['`GRID(ROW(MM(5)), EP)`', '`EP` 是单元格，不是 GRID 子项。', '放进 `ROW(...)`。'],
            ],
          },
        ],
      },
      {
        id: 'practice',
        title: '动手练习',
        blocks: [
          {
            type: 'sandbox',
            title: '补空位并改用别名',
            task: '在 5 与 6 之间补一个空位，并把 `EMPTY` 与 `LINE` 写成最短形式。',
            starter: 'GRID(\n  ROW(MM(5), MM(6)),\n  LINE()\n)',
            answer: 'GRID(\n  ROW(MM(5), EP, MM(6)),\n  LN\n)',
            hint: '先补一个 `EP` 空位；`EP` 还原为 `EMPTY`，`LN` 还原为 `LINE`。',
          },
        ],
      },
      {
        id: 'related',
        title: '相关页面',
        blocks: [
          {
            type: 'cards',
            items: [
              { title: 'LINE · 行级横线', text: '`LN` 的完整规则。', to: '/macro-rules/line' },
              { title: 'EMPTY · 占位空单元格', text: '`EP` 的完整规则。', to: '/macro-rules/empty' },
              { title: 'BRACKET · 厂字弯', text: '`BK` 的完整规则。', to: '/macro-rules/bracket' },
            ],
          },
        ],
      },
    ],
  },
]
