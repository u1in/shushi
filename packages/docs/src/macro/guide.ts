import type { MacroDocPage } from './types'

/**
 * “开始”分组：先交代宏语言的定位和编译链路，再集中说明所有页面都会用到的
 * 调用、分隔符、引号、配置与优先级。具体宏与语法糖各自有独立页面。
 */
export const guidePages: MacroDocPage[] = [
  {
    slug: 'intro',
    title: '前言：用一行行源码描述竖式网格',
    navLabel: '前言',
    kicker: 'GETTING STARTED',
    group: 'guide',
    summary: '网格宏是一套面向竖式排版的受限声明式语言。它把行列结构、文字位置、线条与少量配置写成可读的源码，再编译成渲染器共用的 GridScene。',
    sections: [
      {
        id: 'why',
        title: '这套语言解决什么问题',
        blocks: [
          {
            type: 'paragraph',
            text: '各类运算的结果、过程与版式是三层不同的职责。计算层负责逐位算法，排版层决定数字落在哪些行列，渲染层才处理 SVG、DOM 与 CSS。网格宏位于排版层的输入端：让使用者直接用文字描述「第几行、第几列、这一格放什么」，而不必编写坐标、类名或渲染代码。',
          },
          {
            type: 'list',
            items: [
              '**结构可读**：`ROW` 表示一行，`CELL` 表示一个格子，`LINE` 表示贴着上一行的横线。',
              '**位置直观**：`MM(5)` 表示居中写 5，`RB(1)` 表示写在右下角，`DOT` 表示右边界的小数点。',
              '**渲染无关**：同一份源码既能交给 DOM/CSS 渲染器，也能交给 SVG 渲染器，输出契约完全一致。',
              '**渐进压缩**：先用完整命令把结构写对，再用分号行、方括号和零参数省略缩短源码。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '宏层不计算',
            text: '网格宏只描述结构与图元。它不知道商、余数、进位或借位应该等于几，也不会替你做加法。计算规则仍然属于计算器包；宏只负责把已经算好的数字排到正确位置。',
          },
        ],
      },
      {
        id: 'pipeline',
        title: '从源码到画面',
        blocks: [
          {
            type: 'steps',
            items: [
              { title: '宏源码', text: '用户输入 `GRID(...)`、`5,6;` 或 `[6,RB(1)]` 这样的文本。' },
              { title: '解析', text: '`parseMacro` 把源码解析为宏 AST，同时还原 `EMP`、`LN`、`BRKT`、`SQ`、`TRI`、`RND` 等输入别名。' },
              { title: '编译与归一化', text: '`compileMacro` 推导列数、对齐每一行、展开短除法阶梯，并输出 `GridScene`。' },
              { title: '渲染', text: 'DOM/CSS 与 SVG 渲染器各自消费同一个 `GridScene`，页面只负责选择渲染模式。' },
            ],
          },
          {
            type: 'code',
            title: '编译链路',
            code: '宏源码 → 宏 AST → 归一化网格结构 → GridScene → DOM/CSS 或 SVG',
          },
          {
            type: 'paragraph',
            text: '这条链路也解释了文档的阅读顺序：先理解语法，再理解基础结构宏，最后学习只改变源码写法、不改变输出契约的语法糖。',
          },
        ],
      },
      {
        id: 'quickstart',
        title: '五分钟快速上手',
        blocks: [
          {
            type: 'paragraph',
            text: '下面是一道完整的加法竖式：`356 + 278 = 634`。源码使用顶层分号行、方括号和进位标记 `RB`，结尾分号可以省略。',
          },
          {
            type: 'example',
            title: '第一道完整的加法竖式',
            code: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;\nLN;\n6,3,4;',
            note: '两个 `RB(1)` 分别贴在同格数字 2、7 的右下角，表示进位；`LN` 画出结果横线，最后一行是 634。',
          },
          {
            type: 'paragraph',
            text: '把这段源码读成完整命令就是：`GRID(ROW(MM(3), MM(5), MM(6)), ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)), LINE, ROW(MM(6), MM(3), MM(4)))`。语法糖页面会逐项解释这些压缩规则。',
          },
        ],
      },
      {
        id: 'practice',
        title: '动手练习',
        blocks: [
          {
            type: 'sandbox',
            title: '补全加法竖式的结果',
            task: '补上结果行和横线，使 356 + 278 = 634 成立。',
            starter: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;',
            answer: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;\nLN;\n6,3,4;',
            hint: '横线用 `LN` 单独占一个分号段；结果 634 放在最后一行。',
          },
        ],
      },
      {
        id: 'map',
        title: '文档阅读路线',
        blocks: [
          {
            type: 'cards',
            items: [
              { title: 'API 文档', text: '查阅门户调用、宏编译、SVG/DOM 渲染与可见文本行提取等公共 API。', to: '/macro-api/shushi' },
              { title: '基础语法规则', text: '调用形式、分隔符、引号、隐式 GRID、配置优先级与语法速查。', to: '/macro-rules/syntax' },
              { title: '基础宏命令', text: '从 GRID 到 KV 共九个结构宏；每页都列出参数、规则、错误与可运行示例。', to: '/macro-rules/grid' },
              { title: '方位宏命令', text: 'LT 到 RBL 共十个文本定位宏；每页说明锚点、字号与配色约定。', to: '/macro-rules/lt' },
              { title: '符号与边框宏命令', text: 'DOT、BRACKET 与 TBD/RBD/BBD/LBD；按固定图元与单元格边界分组。', to: '/macro-rules/dot' },
              { title: '语法糖', text: '分号行、方括号与零参数省略；只改变源码写法，不改变输出契约。', to: '/macro-rules/row-shorthand' },
              { title: '录入示例', text: '加法、乘法与短除法的完整版和语法糖版并排对照，输出结果逐项验证。', to: '/macro-rules/examples' },
              { title: '注意事项', text: '最容易踩的坑、错误信息对照表和提交前的检查清单。', to: '/macro-rules/cautions' },
            ],
          },
          {
            type: 'paragraph',
            text: '建议第一次阅读按左侧导航从上到下进行。已经熟悉完整命令的读者，可以直接跳到方位宏、语法糖或录入示例；遇到报错时再回查对应的宏页面。',
          },
        ],
      },
      {
        id: 'conventions',
        title: '文档约定与能力边界',
        blocks: [
          {
            type: 'table',
            columns: ['写法', '含义'],
            rows: [
              ['`完整命令`', '使用 `GRID`、`ROW`、`CELL` 等显式宏，结构最清楚，便于排查。'],
              ['`语法糖`', '分号行、`[]`、`EMP`、`LN`、`BRKT`、`SQ`、`TRI`、`RND` 等更短的写法；解析后仍还原为完整宏。'],
              ['`必填 / 可选`', '参数表中标注为必填的项缺失时会直接报错；可选参数省略时使用默认值。'],
              ['`KV(key, value)`', '宏的配置项；键的可用范围由宿主宏决定，重复设置同一个键会报错。'],
            ],
          },
          {
            type: 'list',
            items: [
              '文档中的代码块默认是**完整、可编译**的源码；标注为“片段”的除外。',
              '每个宏页面都提供可编译源码和结果预览；需要改写时，可对照完整宏与简化宏的输出。',
              '默认开启自动配色 `autoColor`，所以示例颜色可能与你手动写的 `STYLE` 不同；需要精确控制时先关闭自动配色。',
              '宏源码里没有注释语法，`//` 与 `/* */` 都不是合法注释。',
            ],
          },
          {
            type: 'callout',
            tone: 'warn',
            title: '不要写入渲染细节',
            text: '宏层不应出现 DOM 节点、CSS 类名、SVG 路径或像素坐标。需要新的视觉语义时，优先扩展 GridScene 的图元或语义样式 token，而不是把渲染代码塞进宏。',
          },
        ],
      },
    ],
  },
  {
    slug: 'syntax',
    title: '基础语法规则',
    navLabel: '基础语法规则',
    kicker: 'LANGUAGE BASICS',
    group: 'guide',
    summary: '所有宏都遵循同一套调用、分隔、引号与配置规则。先把这些规则读一遍，后面每个宏页面就只剩下参数和排版细节。',
    sections: [
      {
        id: 'calls',
        title: '调用形式与命名',
        blocks: [
          {
            type: 'paragraph',
            text: '宏调用使用大写英文函数名、圆括号和逗号分隔的参数：`FUNCTION(argument1, argument2)`。宏名区分大小写，必须写成大写；小写名称不会被识别为宏。',
          },
          {
            type: 'list',
            items: [
              '没有参数的宏可以写成 `NAME()`，其中 `LINE`、`EMPTY`、`STYLE`、`DIV`、`BRACKET` 与四个边框宏还能省略空括号。',
              '参数可以是文字、数字、子宏调用、`KV(...)` 配置或 `[]` 单元格简写。',
              '空白只用于分隔记号，不进入文字内容；裸文字内部不能包含空格。',
              '源码末尾允许省略分号，但顶层多个宏之间仍然必须用逗号或分号分隔。',
            ],
          },
          {
            type: 'code',
            title: '最小调用',
            code: 'GRID(ROW(MM(5), MM(6)))',
          },
        ],
      },
      {
        id: 'separators',
        title: '逗号、分号与嵌套层级',
        blocks: [
          {
            type: 'paragraph',
            text: '逗号分隔**同一层**的参数；分号只在最外层表示“一行的结束”。这条边界非常重要：`GRID`、`ROW`、`CELL` 内部不能使用分号，顶层分号行也不能直接携带 `GRID` 配置。',
          },
          {
            type: 'table',
            columns: ['位置', '允许的分隔符', '结果'],
            rows: [
              ['宏调用内部', '逗号', '参数列表，例如 `ROW(MM(5), MM(6))`。'],
              ['顶层、没有分号', '逗号', '隐式 `GRID` 的子项，例如 `ROW(...), LINE, ROW(...)`。'],
              ['顶层、使用分号', '分号分行、逗号分格', '每个普通分号段自动包成 `ROW`，整体再包成隐式 `GRID`。'],
            ],
          },
          {
            type: 'callout',
            tone: 'danger',
            title: '分号不能出现在括号里',
            text: '`GRID(ROW(MM(5)); ROW(MM(6)))` 会报错。括号内部必须使用逗号；分号只属于顶层简写。',
          },
        ],
      },
      {
        id: 'implicit-grid',
        title: '隐式 GRID 与显式 GRID',
        blocks: [
          {
            type: 'paragraph',
            text: '当源码不以 `GRID(` 开头时，顶层以逗号分隔的 `ROW`、`LINE` 会被自动包进隐式 `GRID`。因此下面两段源码都合法，只是第一段更短。',
          },
          {
            type: 'compare',
            leftTitle: '隐式 GRID',
            leftCode: 'ROW(MM(5), MM(6)),\nLINE,\nROW(MM(1), MM(2))',
            rightTitle: '显式 GRID',
            rightCode: 'GRID(\n  ROW(MM(5), MM(6)),\n  LINE,\n  ROW(MM(1), MM(2))\n)',
            note: '两段源码输出同一个场景。只有需要 `columns`、`showGrid` 等配置时，才必须显式写 `GRID`。',
          },
          {
            type: 'paragraph',
            text: '显式 `GRID` 的优先级更高：它可以直接读取 `KV` 配置；隐式 `GRID` 没有配置入口。不要在同一份源码里混用顶层分号简写和显式 `GRID`，否则可能得到嵌套的 `GRID(GRID(...))`。',
          },
        ],
      },
      {
        id: 'literals',
        title: '文字、数字与引号',
        blocks: [
          {
            type: 'paragraph',
            text: '简单文字、数字和保留常量可以不加引号，例如 `MM(5)`、`MM(+)`、`KV(span, full)`。当文字包含逗号、圆括号、双引号、方括号或空白时，必须用双引号包裹。',
          },
          {
            type: 'table',
            columns: ['内容', '写法', '说明'],
            rows: [
              ['单个数字或运算符', '`MM(5)`、`MM(+)`', '裸文字会一直读到分隔符为止。'],
              ['带空格的文字', '`MM("第 1 行")`', '空格不是分隔符时也必须加引号。'],
              ['包含括号或逗号', '`MM("(5, 6)")`', '不加引号会被解析成宏结构。'],
              ['包含方括号', '`MM("[5]")`', '`[]` 是保留的单元格简写语法。'],
              ['引号或反斜杠', '`MM("\\"")`', '反斜杠转义下一个字符。'],
            ],
          },
          {
            type: 'callout',
            tone: 'tip',
            title: '引号会保留原样',
            text: '双引号内的反斜杠可以转义引号或反斜杠；除此之外的字符按原样保留。引号本身不会显示在画面上。',
          },
        ],
      },
      {
        id: 'config',
        title: 'KV 配置与优先级',
        blocks: [
          {
            type: 'paragraph',
            text: '所有配置统一写成 `KV(key, value)`。键和值都必须是文本、数字或保留常量；每次调用必须恰好包含两项。同一个作用域里重复设置同一个键会报错，不会静默覆盖。',
          },
          {
            type: 'code',
            title: '配置写在宿主宏内部',
            code: 'GRID(\n  KV(columns, 3),\n  KV(showGrid, true),\n  ROW(MM(5), MM(6), KV(align, left))\n)',
          },
          {
            type: 'paragraph',
            text: '配置的生效顺序是：**显式配置 > 自动推导 > 默认值**。例如省略 `columns` 时会按最长 `ROW` 推导；显式写了更小的 `columns` 会报错，而不是截断内容。',
          },
          {
            type: 'paragraph',
            text: '不同宿主宏支持的键不同：`ROW` 只读 `align`，`CELL` 只读 `columnSpan` 与 `style`，`STYLE` 只读 `color` 与 `thickness`。多数宏会忽略自己不认识的键，`STYLE` 则会直接报错；因此应只写目标宏明确支持的配置。',
          },
        ],
      },
      {
        id: 'sugar-overview',
        title: '语法糖总览',
        blocks: [
          {
            type: 'paragraph',
            text: '语法糖只改变源码写法，不改变 `GridScene` 契约。解析器会先把它们还原成基础宏，再交给同一个编译器。',
          },
          {
            type: 'table',
            columns: ['语法糖', '例子', '等价于', '详见'],
            rows: [
              ['顶层分号行', '`5, 6; LN;`', '`GRID(ROW(MM(5), MM(6)), LINE)`', '`/macro-rules/row-shorthand`'],
              ['方括号单元格', '`[6, RB(1)]`', '`CELL(MM(6), RB(1))`', '`/macro-rules/cell-shorthand`'],
              ['零参数省略', '`LN`、`EMP`、`BRKT`、`SQ`、`TRI`、`RND`', '`LINE`、`EMPTY`、`BRACKET`、`SQUARE`、`TRIANGLE`、`ROUND`', '`/macro-rules/zero-argument`'],
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '这些是宏命令，不是语法糖',
            text: '九宫格定位（`LT` … `RBL`）、`DOT`、`BRACKET` 与四个边框宏都有固定的参数、锚点或图元，不是纯粹的源码改写。它们分别归入「方位宏命令」与「符号与边框宏命令」。',
          },
          {
            type: 'table',
            columns: ['宏命令分组', '包含', '详见'],
            rows: [
              ['方位宏命令', '`LT`、`MT`、`MTD`、`RT`、`ML`、`MM`、`MR`、`LB`、`MB`、`RB`、`RBL`', '九宫格定位、减法借位点和右边界文字，详见 `/macro-rules/lt` 与 `/macro-rules/mtd`'],
              ['符号与边框宏命令', '`DOT`、`BRACKET`、`TBD`、`RBD`、`BBD`、`LBD`', '`/macro-rules/dot`'],
            ],
          },
        ],
      },
      {
        id: 'grammar',
        title: '语法速查',
        blocks: [
          {
            type: 'code',
            title: '完整语法骨架',
            code: 'GRID( ...ROW / LINE / KV )\nROW( ...CELL / EMPTY / 定位宏 / DOT, ...KV )\nCELL( ...定位宏 / 边框宏 / BRACKET / DOT, ...KV )\nEMPTY( ...KV )\nLINE( STYLE(...), ...KV )\nDIV\nVALUE(number)\nSTYLE( ...KV )\nKV(key, value)',
          },
          {
            type: 'list',
            items: [
              '`GRID` 是唯一根节点；省略时由解析器自动补出。',
              '`ROW` 至少包含一个单元格；短行按 `align` 对齐。',
              '`LINE` 必须出现在至少一个 `ROW` 之后，并附着到上一条数字行。',
              '`DIV` 只能作为 `ROW` 的直接子项；含 `DIV` 的网格只能包含 `ROW` 与 `KV`。',
            ],
          },
        ],
      },
      {
        id: 'errors',
        title: '常见语法错误',
        blocks: [
          {
            type: 'table',
            columns: ['错误写法', '原因', '修正'],
            rows: [
              ['`GRID(ROW(MM(5)); ROW(MM(6)))`', '括号内使用了分号。', '改成逗号：`GRID(ROW(MM(5)), ROW(MM(6)))`。'],
              ['`MM`', '需要参数的宏省略了括号。', '写成 `MM(5)`。'],
              ['`[5, 1]`', '方括号只有首项能省略 `MM`。', '写成 `[5, MM(1)]` 或 `[5, RB(1)]`。'],
              ['`GRID(ROW(MM(5)), LINE, ROW(MM(6)))`', '`LINE` 出现在第二个 `ROW` 之前。', '把 `LINE` 移到需要画线的 `ROW` 之后。'],
              ['`GRID(KV(columns, 1), ROW(MM(5), MM(6)))`', '显式列数小于最长行。', '把 `columns` 改为至少 2，或删除该配置。'],
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
            title: '补全一条横线与结果行',
            task: '左侧是两行乘法过程，但缺少横线和结果行。补成：第一行 1 2，第二行 × 1 2，第三行横线，第四行 1 4 4。',
            starter: '1,2;\n×,1,2;',
            answer: '1,2;\n×,1,2;\nLN;\n1,4,4;',
            hint: '横线用 `LN` 单独占一个分号段；结果行继续用逗号分格。',
          },
        ],
      },
    ],
  },
]
