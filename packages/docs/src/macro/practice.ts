import type { MacroDocPage } from './types'

/**
 * “实践”分组：用各类运算的真实竖式对照完整命令与语法糖，
 * 最后集中列出容易踩坑的规则。所有 compare 左侧与右侧必须输出同一个 GridScene。
 */
export const practicePages: MacroDocPage[] = [
  {
    slug: 'examples',
    title: '录入示例：完整版与语法糖版对照',
    navLabel: '录入示例',
    kicker: 'PRACTICE · REWRITE',
    group: 'practice',
    summary: '同一道竖式可以先写成完整命令，再压缩成语法糖版。下面四组例子输出完全相同的 GridScene，适合逐段对照学习。',
    sections: [
      {
        id: 'why',
        title: '为什么先写完整版',
        blocks: [
          {
            type: 'paragraph',
            text: '完整版把每一个 `GRID`、`ROW`、`CELL` 都写出来，结构边界最清楚。语法糖版省略的是重复的包裹，不是结构本身；先写完整版能帮助你确认每一行的列数、同格关系和横线位置。',
          },
          {
            type: 'list',
            items: [
              '完整版适合调试：报错时能直接看出是哪一层结构出了问题。',
              '语法糖版适合日常录入：分号分行、方括号同格、零参数省略都能显著缩短源码。',
              '两者可以混用，但必须遵守各自的边界：方括号可以出现在显式 GRID 中，分号行不能和显式 GRID 混用。',
              '页面下方的每个对照都经过编译测试，左右两侧的列、行、元素与位置完全一致。',
            ],
          },
        ],
      },
      {
        id: 'addition',
        title: '加法：356 + 278 = 634',
        blocks: [
          {
            type: 'paragraph',
            text: '加法需要逐位对齐，并在进位位置使用 `RB(1)`。完整版把每个进位点写进独立的 `CELL`，语法糖版用方括号完成同样的组合。',
          },
          {
            type: 'compare',
            leftTitle: '完整命令版',
            leftCode:
              'GRID(\n  ROW(MM(3), MM(5), MM(6)),\n  ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),\n  LINE,\n  ROW(MM(6), MM(3), MM(4))\n)',
            rightTitle: '语法糖版',
            rightCode: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;\nLN;\n6,3,4;',
            note: '首行 3 5 6 右对齐到四列；第二行的 + 和结果 8 都是独立单元格，只有进位点与数字同格。',
          },
        ],
      },
      {
        id: 'multiplication',
        title: '乘法：97 × 89 = 8633',
        blocks: [
          {
            type: 'paragraph',
            text: '乘法包含部分积、错位和最终结果。这里在根 `GRID` 用 `KV(lineSpan, full)` 让两条横线贯穿四列：横线后的进位写在上行数字的 `RB`，其他过程进位写在目标数字的 `RT`，并用 `EMP` 空出最后一列。',
          },
          {
            type: 'compare',
            leftTitle: '完整命令版',
            leftCode:
              'GRID(\n  KV(lineSpan, full),\n  ROW(MM(9), MM(7)),\n  ROW(MM(×), CELL(MM(8), RB(6)), MM(9)),\n  LINE,\n  ROW(MM(8), MM(7), MM(3)),\n  ROW(CELL(MM(7), RB(1)), CELL(MM(7), RB(1), RT(5)), MM(6), EMPTY()),\n  LINE,\n  ROW(MM(8), MM(6), MM(3), MM(3))\n)',
            rightTitle: '最简版',
            rightCode:
              'GRID(KV(lineSpan,full),ROW(MM(9),MM(7)),ROW(MM(×),CELL(MM(8),RB(6)),MM(9)),LN,ROW(MM(8),MM(7),MM(3)),ROW(CELL(MM(7),RB(1)),CELL(MM(7),RB(1),RT(5)),MM(6),EMP),LN,ROW(MM(8),MM(6),MM(3),MM(3)))',
            note: '多条横线共享全宽时，最简宏将 `span` 提升到根 GRID；LN 本身不需要属性。',
          },
        ],
      },
      {
        id: 'short-division',
        title: '短除法：60 = 2 × 2 × 3 × 5',
        blocks: [
          {
            type: 'paragraph',
            text: '短除法不需要写阶梯或竖线；`DIV` 会自动切换到半格模式，`VALUE` 负责数值组的逐位展开与右对齐。',
          },
          {
            type: 'compare',
            leftTitle: '完整命令版',
            leftCode:
              'GRID(\n  ROW(MM(2), DIV, VALUE(60)),\n  ROW(MM(2), DIV, VALUE(30)),\n  ROW(MM(3), DIV, VALUE(15)),\n  ROW(VALUE(5))\n)',
            rightTitle: '语法糖版',
            rightCode: '2,DIV,VALUE(60);\n2,DIV,VALUE(30);\n3,DIV,VALUE(15);\nVALUE(5);',
            note: '短除法只有 ROW 与 VALUE，没有 LINE；横线和竖线由 DIV 自动生成。',
          },
        ],
      },
      {
        id: 'long-division',
        title: '长除法：10230 ÷ 25 = 409.2',
        blocks: [
          {
            type: 'paragraph',
            text: '长除法用 `BRACKET` 画厂字弯与厂字横，用 `DOT` 标出小数点，用 `EMPTY` 对齐商与过程数字。这个例子同时使用了本页讲到的多数语法糖。',
          },
          {
            type: 'compare',
            leftTitle: '完整命令版',
            leftCode:
              'GRID(\n  ROW(MM(4), MM(0), CELL(MM(9), DOT), MM(2)),\n  ROW(MM(2), MM(5), BRACKET, MM(1), MM(0), MM(2), MM(3), CELL(MM(0), DOT), MM(0)),\n  ROW(MM(1), MM(0), MM(0), EMPTY(), EMPTY(), EMPTY()),\n  LINE,\n  ROW(MM(2), MM(3), MM(0), EMPTY()),\n  ROW(MM(2), MM(2), MM(5), EMPTY()),\n  LINE,\n  ROW(MM(5), MM(0)),\n  ROW(MM(5), MM(0)),\n  LINE,\n  ROW(MM(0))\n)',
            rightTitle: '语法糖版',
            rightCode:
              '4,0,[9,DOT],2;2,5,BRKT,1,0,2,3,[0,DOT],0;1,0,0,EMP,EMP,EMP;LN;2,3,0,EMP;2,2,5,EMP;LN;5,0;5,0;LN;0;',
            note: 'ROW 默认右对齐，因此最简版省略了只用于行首缩进的 EMP；尾部 EMP 仍保留以表达横线和列跨度。BRACKET 独占一格并自动生成厂字横；被除数末尾补 0 并标出小数点，商为 409.2。',
          },
        ],
      },
      {
        id: 'rewrite',
        title: '如何从完整版改写为语法糖版',
        blocks: [
          {
            type: 'steps',
            items: [
              { title: '先确认列数一致', text: '找出最长行，数清每行的单元格跨度；语法糖只改写法，不应改变列数。' },
              {
                title: '把 GRID 改成顶层行',
                text: '如果不需要场景配置，删除最外层 `GRID(...)`，把每个 `ROW(...)` 改成以分号结尾的片段。',
              },
              { title: '把 ROW 改成裸文字', text: '去掉 `ROW(...)` 与 `MM(...)`，保留逗号分格；横线单独写 `LN;`。' },
              {
                title: '把 CELL 改成方括号',
                text: '首项为正文时去掉 `MM`；只有定位标记时可直接写成 `[RB(1)]`，后续定位宏保持完整调用。',
              },
              {
                title: '应用零参数省略',
                text: '把 `EMPTY()`、`LINE()`、`BRACKET()` 改成 `EMP`、`LN`、`BRKT`，边框宏也可以去掉空括号。',
              },
              { title: '重新对照输出', text: '逐项检查列数、行数、横线位置和同格图元；有差异时退回完整版定位。' },
            ],
          },
        ],
      },
      {
        id: 'equivalence',
        title: '对照检查清单',
        blocks: [
          {
            type: 'table',
            columns: ['检查项', '完整版看什么', '语法糖版看什么'],
            rows: [
              ['列数', '所有 ROW 的最大 `columnSpan` 之和', '最长分号行的逗号段数（考虑方括号与跨度）'],
              ['行数', '`ROW` 的数量', '普通分号段的数量；`LN` 不算行'],
              ['对齐', '每行是否右对齐，是否有 `KV(align, left)`', '分号行默认右对齐，不能单独设置 align'],
              ['同格', '`CELL(...)` 内的图元', '`[...]` 内的图元；首项为裸文字时可省略 MM，纯图元可直接作为首项'],
              ['横线', '`LINE` 的 span 与位置', '`LN` 或 `LN(KV(span, ...))` 的位置'],
              ['短除法', '`DIV` 与 `VALUE` 的组数', '每个过程行组数一致，最后一行不带 DIV'],
            ],
          },
          {
            type: 'callout',
            tone: 'tip',
            title: '等价不是“看起来差不多”',
            text: '等价指输出 GridScene 的列、行、元素、位置与内容一致。只把数字写对、但横线跨度或同格关系不同，仍然不是等价改写。',
          },
        ],
      },
      {
        id: 'practice',
        title: '动手练习',
        blocks: [
          {
            type: 'sandbox',
            title: '把加法语法糖版展开为完整命令',
            task: '把左侧的加法语法糖版改写为完整命令版：保留每个进位点与横线，输出必须一致。',
            starter: '3,5,6;\n+,[2,RB(1)],[7,RB(1)],8;\nLN;\n6,3,4;',
            answer:
              'GRID(\n  ROW(MM(3), MM(5), MM(6)),\n  ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),\n  LINE,\n  ROW(MM(6), MM(3), MM(4))\n)',
            hint: '先把每一行包成 ROW，再把方括号展开为 CELL，最后整体包进 GRID。',
            mode: 'source',
          },
        ],
      },
    ],
  },
  {
    slug: 'cautions',
    title: '注意事项与排错清单',
    navLabel: '注意事项',
    kicker: 'PRACTICE · CAUTIONS',
    group: 'practice',
    summary:
      '宏语言的限制大多来自“结构边界”和“自动配色”。记住这些高频陷阱，再按错误信息对照表排查，通常几分钟内就能定位问题。',
    sections: [
      {
        id: 'pitfalls',
        title: '高频陷阱',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**含分隔符的文字必须加引号**：逗号、圆括号、双引号、方括号和空格都会改变解析结果。',
              '**裸文字只在特定位置自动补 MM**：顶层分号行与方括号首项。其他位置写 `5` 不会自动变成居中文字。',
              '**方括号只有首项能省略 MM**：`[5, 1]` 与 `[5, RB]` 都无效。',
              '**显式 columns 不能太小**：小于最长行会报错，不会自动截断。',
              '**LINE 必须在 ROW 之后**：并且贴的是前一个 ROW，不是后一个。',
              '**DIV 的约束最多**：只能作为 ROW 直接子项；每行最多一个；最后一行不能有 DIV；组数必须一致。',
              '**autoColor 默认开启**：它会覆盖 STYLE 的颜色与线宽；需要精确样式时先写 `KV(autoColor, false)`。',
              '**EMPTY 不能携带图元**：需要内容时用 CELL；EMPTY 只负责占位。',
              '**BRACKET 必须独占一格**：不能设置 columnSpan，也不能与数字同格。',
              '**autoColor 最多 40 行**：超过时关闭 autoColor 或拆分场景。',
              '**宏层不写渲染细节**：不要写 DOM、CSS 类名、SVG 节点或像素坐标。',
              '**源码没有注释语法**：`//` 与 `/* */` 都不是注释，会被当作文字或导致解析错误。',
            ],
          },
        ],
      },
      {
        id: 'config',
        title: '配置与优先级',
        blocks: [
          {
            type: 'list',
            items: [
              '配置顺序是显式配置 > 自动推导 > 默认值。',
              '同一作用域重复设置同一个键会报错，不会后者覆盖前者。',
              '多数宿主宏忽略未知键，只有 STYLE 会报错；不要依赖“写了就会被忽略”来试探。',
              '显式 `columns` 与 `trackUnit` 在短除法中不参与布局；短除法由 VALUE 自动推导。',
              '`padding` 会同时覆盖 `paddingX` 与 `paddingY`。',
              '`fontSize` 是绝对字号，优先于 `fontSizeRatio` 的计算结果。',
            ],
          },
          {
            type: 'callout',
            tone: 'warn',
            title: '不要混用简写与显式 GRID',
            text: '顶层分号行会自动包出隐式 GRID；如果同时又写了显式 `GRID(...)`，很容易得到嵌套 GRID 或非法子节点。需要配置时，把分号行全部展开为 ROW。',
          },
        ],
      },
      {
        id: 'error-lookup',
        title: '错误信息对照表',
        blocks: [
          {
            type: 'table',
            columns: ['错误信息', '最可能的原因', '修正方向'],
            rows: [
              ['`GRID 只能包含 ROW、LINE 或 KV 配置。`', '把定位宏或裸文字直接放在 GRID 下。', '包一层 ROW。'],
              ['`GRID 至少需要一个 ROW。`', '只写了 KV。', '加入至少一个数字行。'],
              ['`GRID 的 columns=... 小于最长 ROW 所需的 ... 列。`', '显式列数不足。', '增大 columns 或删除配置。'],
              [
                '`ROW 只能包含 CELL、EMPTY、定位宏或 DOT。`',
                '把 LINE、STYLE 或裸文字塞进行内。',
                '横线移出 ROW；文字用 MM。',
              ],
              [
                '`CELL 内只能包含定位宏、边框宏、BRACKET、DOT 或 KV 配置。`',
                'CELL 内放了结构宏或裸文字。',
                '只保留单元格图元。',
              ],
              [
                '`BRACKET 必须独占一个 columnSpan 为 1 的 CELL。`',
                'BRACKET 与别的图元同格。',
                '拆成单独 `CELL(BRKT)`。',
              ],
              ['`LINE 前必须先有一个 ROW。`', 'LINE 出现在第一条 ROW 之前。', '移到需要画线的 ROW 之后。'],
              ['`LINE 的 span 只能是 previous、longest 或 full。`', 'span 拼写错误。', '改成三个枚举之一。'],
              ['`短除法每行 VALUE 数值组数量必须一致。`', '过程行与底行组数不同。', '统一每行的 VALUE 数量。'],
              ['`短除法最后一行必须是不含 DIV 的 VALUE 底行。`', '最后一行仍是过程行。', '补一行只含 VALUE 的底行。'],
              [
                '自动配色颜色不符合预期。',
                '`colorTheme` 配置覆盖了默认主题。',
                '检查传入的主题对象是否包含正确的八个颜色字段。',
              ],
              ['`配置 ... 被重复设置。`', '同一个宏里写了两次同名 KV。', '删除重复项。'],
            ],
          },
        ],
      },
      {
        id: 'checklist',
        title: '提交前检查清单',
        blocks: [
          {
            type: 'list',
            items: [
              '最长行与显式 columns 是否一致？',
              '每条 LINE 是否都在至少一个 ROW 之后，并且 span 符合预期？',
              '需要同格的数字与标记是否都放进了 CELL 或方括号？',
              '方括号的后续项是否都是完整宏，零参数宏是否确实是零参数？',
              '含逗号、括号、方括号或空格的文字是否加了双引号？',
              '短除法是否只有 ROW 与 KV，最后一行是否是不含 DIV 的 VALUE 底行？',
              '需要精确颜色或线宽时，是否关闭了 autoColor？',
              '是否把 DOM、CSS、SVG 或像素坐标写进了宏源码？',
              '源码中是否出现了不支持的注释或小写宏名？',
            ],
          },
        ],
      },
      {
        id: 'boundary',
        title: '能力边界',
        blocks: [
          {
            type: 'paragraph',
            text: '网格宏是声明式结构与图元语言，不是通用编程语言，也不是计算器。它没有变量、循环、条件、函数定义或表达式求值；这些能力如果确实需要，应由调用方在生成宏源码之前完成。',
          },
          {
            type: 'list',
            items: [
              '不计算加减乘除，不判断进位、借位、商或余数。',
              '不输出 DOM 节点、CSS 类名、SVG 路径或像素坐标。',
              '不读取外部数据，也不执行网络请求。',
              '不支持注释、变量、循环与自定义函数。',
              '新增视觉语义应扩展 GridScene 图元或样式 token，而不是在宏里写渲染代码。',
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
            title: '修复被自动配色覆盖的样式',
            task: '左侧横线写了蓝色 STYLE，但预览仍是主题色。补上必要配置，让蓝色 3px 生效。',
            starter: 'GRID(\n  ROW(MM(5), MM(6)),\n  LINE(STYLE(KV(color, "#2563eb"), KV(thickness, 3)))\n)',
            answer:
              'GRID(\n  KV(autoColor, false),\n  ROW(MM(5), MM(6)),\n  LINE(STYLE(KV(color, "#2563eb"), KV(thickness, 3)))\n)',
            hint: 'autoColor 是 GRID 级配置，默认开启。',
          },
        ],
      },
    ],
  },
]
