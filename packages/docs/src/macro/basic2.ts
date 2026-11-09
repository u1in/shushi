import type { MacroDocPage } from './types'

/** 基础宏第二组：行级横线与短除法的两个结构宏。 */
export const basicPagesPartTwo: MacroDocPage[] = [
  {
    slug: 'line',
    title: 'LINE · 行级横线',
    navLabel: 'LINE / LN',
    kicker: 'BASE MACRO · 05',
    group: 'basic',
    summary:
      'LINE 在上一行数字的下边缘画横线。它不创建新行，不改变行高，是竖式中的运算线和分隔线。别名 LN，可省略空括号。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`LINE` 是边缘图元，不是数字行。它始终附着到**上一条 ROW 的下边缘**，因此必须先有至少一个 ROW。横线的跨度由 `span` 决定，样式由 `STYLE`、`KV(style)` 或自动配色决定。',
          },
          {
            type: 'list',
            items: [
              '可以写成 `LINE`、`LINE()`、`LN` 或 `LN()`。',
              '可选第一个参数是 `STYLE(...)`；其余配置使用 `KV`。',
              '不创建额外行高，也不占用列。',
              '同一个 ROW 后面可以跟多条 LINE，但通常只需要一条。',
            ],
          },
        ],
      },
      {
        id: 'signature',
        title: '签名与参数',
        blocks: [
          {
            type: 'code',
            title: '签名',
            code: 'LINE(STYLE(...), ...lineOptions)\nLN(STYLE(...), ...lineOptions)',
          },
          {
            type: 'table',
            columns: ['项', '类型', '默认值', '说明'],
            rows: [
              ['`STYLE(...)`', '受限样式', '黑色 2px', '颜色与线宽；最多一个。自动配色开启时会被主题覆盖。'],
              [
                '`KV(span, ...)`',
                '`previous`、`adjacent`、`longest` 或 `full`',
                '继承 `GRID(lineSpan)`',
                '仅在当前横线需要覆盖根节点共同跨度时设置；横线跨度可取上一行、所有行最小包围范围或整个已解析列宽。',
              ],
              [
                '`KV(style, token)`',
                '语义样式 token',
                '未设置',
                '交给渲染器主题控制颜色；与 `STYLE` 同时出现时 token 仍会保留。',
              ],
            ],
          },
        ],
      },
      {
        id: 'behavior',
        title: '跨度与样式规则',
        blocks: [
          {
            type: 'table',
            columns: ['span', '起点', '终点', '典型用途'],
            rows: [
              [
                '`previous`',
                '上一行最左单元格',
                '上一行最右单元格右边界',
                '只在当前运算行下方画线，不强制与其他横线等宽。',
              ],
              [
                '`adjacent`',
                '横线上下两行的最左可见图元',
                '横线上下两行的最右边界',
                '默认规则；适合结果行动态出现前缀 0 等宽度变化。',
              ],
              ['`longest`', '所有数字行的最左列', '所有数字行的最右边界', '让多条横线在视觉上尽量等宽。'],
              ['`full`', '第 0 列', '整个场景列宽', '需要贯穿整张网格的运算线。'],
            ],
          },
          {
            type: 'list',
            items: [
              '默认样式是黑色、2px；LINE 默认按 `adjacent` 取其上下两行的最左、最右可见图元边界，适合上下行宽度不同的竖式。需要覆盖整张网格时写 `KV(span, full)` 或 `GRID(KV(lineSpan, full), ...)`；写 `STYLE(KV(thickness, 3))` 可以改粗。',
              '`autoColor` 开启时，LINE 使用主题的 `rule.color` 与 `rule.thickness`，显式 `STYLE` 不参与最终输出。',
              '`LINE` 前面没有 ROW 时会报错；放在两个 ROW 之间时，它贴的是**前一个** ROW。',
              '横线不改变行数：`ROW`、`LINE`、`ROW` 仍然是两行。',
            ],
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '单条横线的默认全宽跨度',
            code: 'GRID(\n  ROW(MM(5), MM(6)),\n  ROW(MM(1), MM(2)),\n  LINE\n)',
            note: '只有一条横线时无需写属性，会自动覆盖推导出的完整列宽。',
          },
          {
            type: 'example',
            title: '贯穿整个场景',
            code: 'GRID(\n  KV(columns, 4),\n  ROW(MM(5)),\n  LINE\n)',
            note: '虽然内容只占一列，单条横线仍从第 0 列延伸到第 4 列。',
          },
          {
            type: 'example',
            title: '关闭自动配色后自定义样式',
            code: 'GRID(\n  KV(autoColor, false),\n  ROW(MM(5), MM(6)),\n  LINE(STYLE(KV(color, "#2563eb"), KV(thickness, 3)))\n)',
            note: '关闭 autoColor 后，STYLE 的颜色与线宽才会真正生效。',
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
              ['`LINE 前必须先有一个 ROW。`', '把 LINE 放在第一条 ROW 之前。', '把 LINE 移到需要画线的 ROW 之后。'],
              [
                '`LINE 最多接受一个 STYLE 参数，其余请用 KV 配置。`',
                '传了两个 STYLE 或其他图元。',
                '只保留一个 STYLE，其他用 `KV`。',
              ],
              [
                '`LINE 的 span 只能是 previous、adjacent、longest 或 full。`',
                '写了其他跨度值。',
                '改成四个枚举值之一。',
              ],
              ['`LINE 找不到可确定跨度的数字行。`', '场景里没有数字行。', '至少加入一个 ROW。'],
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
            title: '补一条贯穿横线',
            task: '在第二行下方补一条横线，并让它覆盖整个四列场景。',
            starter: 'GRID(\n  KV(columns, 4),\n  ROW(MM(5), MM(6)),\n  ROW(MM(1), MM(2))\n)',
            answer: 'GRID(\n  KV(columns, 4),\n  ROW(MM(5), MM(6)),\n  ROW(MM(1), MM(2)),\n  LINE\n)',
            hint: '`LINE` 必须放在第二行之后；单条横线会自动覆盖四列。',
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
              { title: 'STYLE · 线条样式', text: '颜色与线宽的受限声明。', to: '/macro-rules/style' },
              { title: '零参数省略与别名', text: '`LINE` 与 `LN` 的解析规则。', to: '/macro-rules/zero-argument' },
              { title: '边框宏', text: '如果只需要单元格的一条边，不要用整行 LINE。', to: '/macro-rules/tbd' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'div',
    title: 'DIV · 短除法分割边界',
    navLabel: 'DIV',
    kicker: 'BASE MACRO · 06',
    group: 'basic',
    summary:
      'DIV 是短除法结构宏。它把所在 ROW 分成左侧除数格与右侧 VALUE 数值组，并让整个 GRID 自动切换到短除法半格模式。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`DIV` 不占列、不是文字格，而是短除法的结构分界。它在源码中的位置决定左侧除数与右侧数值组的分界；编译器据此生成半格阶梯、竖线和本行横线。',
          },
          {
            type: 'code',
            title: '基本形状',
            code: 'ROW(除数单元格, DIV, VALUE(数值), ...)',
          },
          {
            type: 'list',
            items: [
              'DIV 必须是 ROW 的直接子项，不能放进 CELL。',
              '左侧必须恰有一个普通单元格；右侧至少有一个 `VALUE(...)`。',
              '同一行最多一个 DIV；最后一行不能包含 DIV。',
              '含 DIV 的 GRID 只能包含 ROW 与 KV，不能出现 LINE、CELL 直接子项或其他结构宏。',
              'DIV 只支持 `KV(separatorStyle, token)` 和 `KV(barStyle, token)`；不支持文字或 `STYLE`，也不支持 `ROW(align)`。',
            ],
          },
        ],
      },
      {
        id: 'signature',
        title: '签名与参数',
        blocks: [
          {
            type: 'code',
            title: '签名',
            code: 'DIV 或 DIV(KV(separatorStyle, token), KV(barStyle, token))',
          },
          {
            type: 'table',
            columns: ['项', '类型', '必填', '说明'],
            rows: [
              ['`DIV`', '结构宏', '是', '只表示结构分界；可选 separatorStyle / barStyle token，不接收文字或 STYLE。'],
              ['左侧', '一个 `CELL`、`EMPTY` 或定位宏', '是', '短除法的除数格，按普通单元格参与列布局。'],
              ['右侧', '一个或多个 `VALUE(...)`', '至少一个', '每个 VALUE 是一个可独立右对齐的数值组。'],
            ],
          },
        ],
      },
      {
        id: 'layout',
        title: '自动半格与阶梯规则',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: '切换半格轨道',
                text: '只要任意 ROW 含 DIV，GRID 就自动使用 0.5u 的真实轨道；显式 `KV(trackUnit, full)` 也会被覆盖。',
              },
              { title: '固定数值组右边界', text: '编译器读取所有行，按每个 VALUE 组的最大位数固定各组的右边界。' },
              { title: '从下向上补阶梯', text: '较上方的过程行会按位宽差向左偏移 0.5u 的整数倍，形成短除法阶梯。' },
              { title: '生成本行线条', text: 'DIV 输出右侧首组左边界上的竖线，以及从该边界到数值区右端的本行横线。' },
            ],
          },
          {
            type: 'paragraph',
            text: '多输入公因数短除法只需在 DIV 右侧写多个 VALUE；相邻数值组之间会自动保留一个半格空隙。每个 VALUE 内部逐位展开为两个半格轨道，因此整组看起来仍是一个完整的数字格。',
          },
          {
            type: 'callout',
            tone: 'warn',
            title: 'columns 与 trackUnit 不参与短除法布局',
            text: '短除法模式下列轨道完全由 VALUE 组推导，`KV(columns, ...)` 会被忽略；`KV(trackUnit, ...)` 也由 DIV 强制覆盖。不要依赖这两个键控制短除法宽度。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '单输入短除法：60 = 2 × 2 × 3 × 5',
            code: 'GRID(\n  ROW(MM(2), DIV, VALUE(60)),\n  ROW(MM(2), DIV, VALUE(30)),\n  ROW(MM(3), DIV, VALUE(15)),\n  ROW(VALUE(5))\n)',
            note: '前三行是过程行，最后一行是不含 DIV 的底行；阶梯、竖线和横线都由编译器生成。',
          },
          {
            type: 'example',
            title: '多输入公因数：60 与 84',
            code: 'GRID(\n  ROW(MM(2), DIV, VALUE(60), VALUE(84)),\n  ROW(MM(2), DIV, VALUE(30), VALUE(42)),\n  ROW(MM(3), DIV, VALUE(15), VALUE(21)),\n  ROW(VALUE(5), VALUE(7))\n)',
            note: '右侧两个 VALUE 组会各自右对齐，组间保留半格空隙。',
          },
          {
            type: 'code',
            title: '等价的顶层简写',
            code: '2,DIV,VALUE(60);2,DIV,VALUE(30);3,DIV,VALUE(15);VALUE(5);',
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
              ['`短除法 ROW 最多只能包含一个 DIV。`', '一行写了两个分界。', '每个过程行只保留一个 DIV。'],
              [
                '`短除法 DIV 左侧必须恰有一个除数单元格。`',
                '左侧为空或写了两个单元格。',
                '把除数合并成一个 CELL，或删除多余项。',
              ],
              ['`短除法 DIV 右侧至少需要一个 VALUE。`', 'DIV 后没有数值组。', '补上 `VALUE(...)`。'],
              [
                '`短除法每行 VALUE 数值组数量必须一致。`',
                '有的行一个组，有的行两个组。',
                '所有过程行与底行使用相同组数。',
              ],
              [
                '`短除法最后一行必须是不含 DIV 的 VALUE 底行。`',
                '最后一行仍是过程行。',
                '在末尾补一行只含 VALUE 的底行。',
              ],
              [
                '`包含 DIV 的 GRID 只能包含 ROW 与 KV。`',
                '混入了 LINE、CELL 或其他结构。',
                '删除 LINE，把单元格包回 ROW。',
              ],
              [
                '`包含 DIV 的短除法 ROW 不支持 KV 配置。`',
                '在过程行上写了 `KV(align, ...)`。',
                '删除该行配置，对齐由短除法规则决定。',
              ],
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
            title: '补成公因数短除法',
            task: '把单输入短除法改成同时分解 60 与 84，让每一行右侧有两个数值组。',
            starter: '2,DIV,VALUE(60);\n2,DIV,VALUE(30);\n3,DIV,VALUE(15);\nVALUE(5);',
            answer:
              '2,DIV,VALUE(60),VALUE(84);\n2,DIV,VALUE(30),VALUE(42);\n3,DIV,VALUE(15),VALUE(21);\nVALUE(5),VALUE(7);',
            hint: '每个过程行都要同时给出两个 VALUE；底行也必须是两个 VALUE。',
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
              { title: 'VALUE · 数值组', text: '理解右侧数值组如何逐位展开与右对齐。', to: '/macro-rules/value' },
              { title: 'GRID · 网格根节点', text: '查看场景级尺寸与留白配置。', to: '/macro-rules/grid' },
              { title: '录入示例', text: '查看短除法完整版与语法糖版对照。', to: '/macro-rules/examples' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'value',
    title: 'VALUE · 短除法数值组',
    navLabel: 'VALUE',
    kicker: 'BASE MACRO · 07',
    group: 'basic',
    summary:
      'VALUE 是短除法右侧或底行的一个数值组。它把数字逐位展开为数字格，让编译器可以按组计算共同右边界与阶梯偏移，并可携带语义样式。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '普通 ROW 使用 `MM(6)`、`MM(0)` 逐个写数字；短除法使用 `VALUE(60)` 把一组数字作为一个整体交给编译器。编译器随后按组内位数展开为多个半格数字格，并保留组边界。',
          },
          {
            type: 'list',
            items: [
              '只能出现在含 DIV 的短除法网格中。',
              '过程行中位于 DIV 右侧；底行中单独出现，不再带 DIV。',
              '每个 VALUE 恰好一个数值文本参数，不能写 `KV`。',
              '同一行的 VALUE 组数量必须一致；底行也一样。',
            ],
          },
        ],
      },
      {
        id: 'signature',
        title: '签名与参数',
        blocks: [
          {
            type: 'code',
            title: '签名',
            code: 'VALUE(number)',
          },
          {
            type: 'table',
            columns: ['参数', '类型', '必填', '说明'],
            rows: [['`number`', '文本或数字', '是', '按字符逐位展开；`VALUE(60)` 会生成两个数字格。']],
          },
          {
            type: 'paragraph',
            text: 'VALUE 的每个字符都会变成一个完整的 `MM` 数字格（在短除法中占两条半格轨道）。因此 `VALUE(60)` 与 `VALUE(84)` 是两个可独立右对齐的组，而不是四个没有边界的文字单元格。',
          },
        ],
      },
      {
        id: 'behavior',
        title: '排版规则',
        blocks: [
          {
            type: 'list',
            items: [
              '**组边界**：同一个 VALUE 内的数字共享一个组，相邻 VALUE 之间保留一个半格空隙。',
              '**右对齐**：编译器取每个组在所有行中的最大位数作为该组宽度，组内数字从右边界向左排列。',
              '**阶梯偏移**：较上方的过程行会按组宽差向左偏移，形成短除法阶梯。',
              '**底行**：最后一行只由数量一致的 VALUE 组组成，不能包含 DIV。',
              '**不支持配置**：VALUE 没有 `KV`，也不能使用 `style`；样式跟随所在 GRID。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: 'VALUE 不是计算',
            text: '`VALUE(60)` 不会计算 60 的因数，也不会验证整除。它只负责把这组数字排进网格；质因数、商和余数仍由计算层决定。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '两位数数值组',
            code: 'GRID(\n  ROW(MM(2), DIV, VALUE(60)),\n  ROW(VALUE(30))\n)',
            note: '过程行的 60 与底行的 30 都展开为两个数字格，并按共同右边界对齐。',
          },
          {
            type: 'example',
            title: '两个数值组',
            code: 'GRID(\n  ROW(MM(2), DIV, VALUE(60), VALUE(84)),\n  ROW(MM(2), DIV, VALUE(30), VALUE(42)),\n  ROW(VALUE(15), VALUE(21))\n)',
            note: '每一行都有两个组；组与组之间自动保留半格空隙。',
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
              [
                '`短除法 DIV 右侧和底行只能包含 VALUE(...)。`',
                '在 DIV 右侧写了 `MM` 或裸数字。',
                '改成 `VALUE(...)`。',
              ],
              [
                '`VALUE 必须且只能包含一个数值文本；只支持 KV(style, token)。`',
                '传了多个文本或使用了 style 以外的配置。',
                '写 `VALUE(60)`，或写 `VALUE(60, KV(style, short-division.final))`。',
              ],
              ['`VALUE 不能为空。`', '写了 `VALUE()` 或空字符串。', '补一个数值。'],
              ['`短除法每行 VALUE 数值组数量必须一致。`', '有的行组数不同。', '让所有行使用相同数量的 VALUE。'],
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
            title: '补全短除法数值组',
            task: '把单步示例补成完整的 60 分解：2、2、3 三次除以，最后商是 5。',
            starter: '2,DIV,VALUE(60);\nVALUE(30);',
            answer: '2,DIV,VALUE(60);\n2,DIV,VALUE(30);\n3,DIV,VALUE(15);\nVALUE(5);',
            hint: '最后一行的 VALUE 不再带 DIV。',
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
              { title: 'DIV · 短除法分割边界', text: '过程行的结构与阶梯规则。', to: '/macro-rules/div' },
              { title: 'GRID · 网格根节点', text: '短除法模式下仍可使用的尺寸配置。', to: '/macro-rules/grid' },
            ],
          },
        ],
      },
    ],
  },
]
