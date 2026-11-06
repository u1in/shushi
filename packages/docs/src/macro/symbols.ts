import type { DocBlock, MacroDocPage } from './types'

/** 单个符号与边框宏命令：DOT、BRACKET 与四个单元格边框宏。 */
const borderCommonErrors = (name: string): DocBlock => ({
  type: 'table',
  columns: ['错误信息', '触发原因', '修正'],
  rows: [
    [`\`${name} 最多接受一个 STYLE 参数。\``, '传了多个图元。', '只保留一个 `STYLE(...)`。'],
    ['`LINE 的样式必须使用 STYLE(...)。`', '把文字或数字传给了边框宏。', '边框宏不接收文字；需要文字请另放定位宏。'],
    ['`CELL 内只能包含定位宏、边框宏、BRACKET、DOT 或 KV 配置。`', '把边框宏直接放在 ROW 或 GRID 下。', `把 \`${name}\` 放进 \`CELL(...)\`。`],
  ],
})

interface BorderPageConfig {
  slug: string
  name: 'TBD' | 'RBD' | 'BBD' | 'LBD'
  title: string
  edge: 'top' | 'right' | 'bottom' | 'left'
  edgeLabel: string
  purpose: string
  useCase: string
  exampleTitle: string
  exampleCode: string
  exampleNote: string
  practiceTask: string
  starter: string
  answer: string
  practiceHint: string
}

const createBorderPage = (config: BorderPageConfig): MacroDocPage => ({
  slug: config.slug,
  title: config.title,
  navLabel: config.name,
  kicker: 'SYMBOL MACRO · BORDER',
  group: 'symbol',
  summary: config.purpose,
  sections: [
    {
      id: 'position',
      title: '位置与作用',
      blocks: [
        { type: 'paragraph', text: config.purpose },
        { type: 'border-board', macro: config.name, edge: config.edge, note: `高亮的就是当前单元格的${config.edgeLabel}边线；${config.name} 只画这一条边，不新增单元格。` },
        {
          type: 'callout',
          tone: 'info',
          title: '边框不是单元格',
          text: config.edge === 'right'
            ? 'RBD 的竖线与当前单元格的右边界基线（baseline）重合，线宽以该基线为中心向两侧展开；它不会向右新增一列，也不是相邻单元格。'
            : `边框是当前单元格的边界线，不是新的单元格；${config.name} 只画${config.edgeLabel}边，不增加行或列。`,
        },
        { type: 'paragraph', text: config.useCase },
      ],
    },
    {
      id: 'signature',
      title: '签名与参数',
      blocks: [
        { type: 'code', title: '签名', code: `${config.name}(STYLE(...), ...options)` },
        {
          type: 'table',
          columns: ['项', '类型', '必填', '说明'],
          rows: [
            ['`STYLE(...)`', '受限线条样式', '否', '颜色与线宽；最多一个。省略时使用黑色 2px。'],
            ['`KV(style, token)`', '语义样式 token', '否', '交给渲染器主题控制线条；与 STYLE 可同时存在。'],
          ],
        },
        {
          type: 'paragraph',
          text: `\`${config.name}\` 是零参数宏，可以写成 \`${config.name}\`、\`${config.name}()\`；它不接收文字。`,
        },
      ],
    },
    {
      id: 'style',
      title: '样式与边界规则',
      blocks: [
        {
          type: 'list',
          items: [
            '边框只画在当前 CELL 的指定边上；它不是一个独立的行或列。',
            '要画跨多格的边框，应把 `KV(columnSpan, n)` 设在 CELL 上；边框宏自身不读取跨度。',
            '未写 STYLE 时默认黑色 2px；autoColor 开启时改用主题 `rule` 的颜色与线宽。',
            '需要精确颜色与线宽时，在 GRID 上写 `KV(autoColor, false)`。',
            '边框宏必须放在 CELL 内；直接放在 ROW 会报错。',
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
          title: config.exampleTitle,
          code: config.exampleCode,
          note: config.exampleNote,
        },
      ],
    },
    {
      id: 'errors',
      title: '常见错误',
      blocks: [borderCommonErrors(config.name)],
    },
    {
      id: 'practice',
      title: '动手练习',
      blocks: [
        {
          type: 'sandbox',
          title: `练习 ${config.name} 的边界`,
          task: config.practiceTask,
          starter: config.starter,
          answer: config.answer,
          hint: config.practiceHint,
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
            { title: 'CELL · 单元格', text: '边框宏的唯一合法宿主。', to: '/macro-rules/cell' },
            { title: 'STYLE · 线条样式', text: '颜色与线宽的完整规则。', to: '/macro-rules/style' },
            { title: 'LINE · 行级横线', text: '需要横跨整行时使用 LINE。', to: '/macro-rules/line' },
          ],
        },
      ],
    },
  ],
})

interface FixedSymbolPageConfig {
  slug: string
  name: 'SQUARE' | 'TRIANGLE' | 'ROUND'
  shortName: 'SQ' | 'TRI' | 'RND'
  glyph: '☐' | '△' | '◯'
  title: string
}

/** 固定符号宏共享同一套文档结构，避免三个零参数宏的规则描述发生分叉。 */
const createFixedSymbolPage = (config: FixedSymbolPageConfig): MacroDocPage => ({
  slug: config.slug,
  title: config.title,
  navLabel: `${config.name} / ${config.shortName}`,
  kicker: 'SYMBOL MACRO · FIXED GLYPH',
  group: 'symbol',
  summary: `${config.name} 是一个零参数单元格符号宏，渲染为 ${config.glyph}；${config.shortName} 是它的首选简写。`,
  sections: [
    {
      id: 'purpose',
      title: '作用与位置',
      blocks: [
        { type: 'paragraph', text: `${config.name} 用于快速输入固定符号 ${config.glyph}。它使用普通单元格的中心位置，不新增列，也不改变行高。` },
        { type: 'paragraph', text: `宏可以直接作为 ROW 中的一个单元格，也可以与数字放在同一个 CELL 内；需要同格叠放时使用 CELL(MM(5), ${config.shortName}) 或 [5, ${config.shortName}]。` },
      ],
    },
    {
      id: 'signature',
      title: '签名与参数',
      blocks: [
        { type: 'code', title: '签名', code: `${config.name}\n${config.shortName}` },
        {
          type: 'table',
          columns: ['写法', '含义'],
          rows: [
            [`\`${config.name}\``, `完整宏名，渲染为 ${config.glyph}。`],
            [`\`${config.shortName}\``, `首选零参数简写，与 ${config.name} 等价。`],
            [`\`${config.name}(KV(style, token))\``, '可以附加单元格样式配置，但不能传入文字参数。'],
          ],
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
            '省略空括号与显式空括号会编译为同一个图元。',
            '默认使用普通中心文字字号；可以通过 CELL 的 KV 配置调整跨度或样式。',
            '宏本身不参与运算，只负责向 GridScene 添加一个固定文字图元。',
            `旧式或较长写法可直接替换为首选简写：${config.name} → ${config.shortName}。`,
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
          title: `输入 ${config.glyph}`,
          code: `GRID(\n  ROW(${config.shortName}, MM(5), MM(6))\n)`,
          note: `${config.shortName} 占据一个普通单元格并显示 ${config.glyph}。`,
        },
        {
          type: 'example',
          title: '与数字同格',
          code: `GRID(\n  ROW([5, ${config.shortName}])\n)`,
          note: `${config.glyph} 与 5 共享单元格，适合需要叠放标记的场景。`,
        },
      ],
    },
    {
      id: 'errors',
      title: '注意事项',
      blocks: [
        {
          type: 'table',
          columns: ['错误写法', '原因', '修正'],
          rows: [
            [`\`${config.name}(文字)\``, '固定符号宏不接受文字参数。', `使用 ${config.name}，或改用 MM(文字) 输入自定义文字。`],
            [`\`ROW(MM(5), ${config.shortName}(1))\``, '简写仍然是零参数宏。', `使用 ROW(MM(5), ${config.shortName})。`],
          ],
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
            { title: 'CELL · 单元格', text: '把固定符号与数字放入同一个格子。', to: '/macro-rules/cell' },
            { title: 'MM · 中心文字', text: '需要自定义文字时使用中心定位宏。', to: '/macro-rules/mm' },
            { title: '零参数省略', text: '了解宏的空括号省略和输入别名。', to: '/macro-rules/zero-argument' },
          ],
        },
      ],
    },
  ],
})

const fixedSymbolPages: MacroDocPage[] = [
  createFixedSymbolPage({ slug: 'square', name: 'SQUARE', shortName: 'SQ', glyph: '☐', title: 'SQUARE · 方框符号' }),
  createFixedSymbolPage({ slug: 'triangle', name: 'TRIANGLE', shortName: 'TRI', glyph: '△', title: 'TRIANGLE · 三角符号' }),
  createFixedSymbolPage({ slug: 'round', name: 'ROUND', shortName: 'RND', glyph: '◯', title: 'ROUND · 圆形符号' }),
]

export const symbolPages: MacroDocPage[] = [
  {
    slug: 'dot',
    title: 'DOT · 小数点符号宏',
    navLabel: 'DOT',
    kicker: 'SYMBOL MACRO · DECIMAL',
    group: 'symbol',
    summary: 'DOT 是 RBL(.) 的专用零参数宏，把小数点贴在当前单元格右侧边框中点，并始终使用小数点独占色。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '小数点在竖式中通常紧贴数字右侧，而不是占据一个新的数字格。`DOT` 就是为这个位置准备的宏：它等价于 `RBL(.)`，但更短，并且自动配色会强制使用小数点专用颜色。',
          },
          { type: 'edge-text-board', note: 'DOT 的位置是当前单元格右侧边框中点，与 RBL 一致；它不占新列。' },
        ],
      },
      {
        id: 'signature',
        title: '签名与参数',
        blocks: [
          { type: 'code', title: '签名', code: 'DOT' },
          {
            type: 'table',
            columns: ['项', '类型', '必填', '说明'],
            rows: [
              ['`DOT`', '零参数宏', '是', '不接收文字或 KV；样式 token 从所在 CELL 继承。'],
            ],
          },
          {
            type: 'paragraph',
            text: '`DOT` 使用正常字号，不套用 0.42 教学字号。它的 `styleToken` 来自所在 CELL；但自动配色开启时，颜色始终是小点专用色。',
          },
        ],
      },
      {
        id: 'behavior',
        title: '排版与配色规则',
        blocks: [
          {
            type: 'list',
            items: [
              '位置是 `edgeMidpoint` 的右边界，不创建新列，也不改变行高。',
              '通常与左侧数字放在同一个 CELL：`CELL(MM(7), DOT)` 或 `[7, DOT]`。',
              '`DOT` 也可以单独作为 ROW 的单元格内容，但这样会脱离数字，通常不是想要的效果。',
              '自动配色下，DOT 的颜色优先级最高，不受运算符色或行文字色影响。',
              '`DOT(5)` 不是合法的 DOT：一旦带参数，它会被当作普通调用，无法通过单元格内容校验。',
            ],
          },
          {
            type: 'compare',
            leftTitle: '完整写法',
            leftCode: 'GRID(\n  ROW(CELL(MM(7), RBL(.)))\n)',
            rightTitle: 'DOT 写法',
            rightCode: 'GRID(\n  ROW(CELL(MM(7), DOT))\n)',
            note: '两者位置相同；DOT 还会获得小数点专用颜色。',
            equivalent: false,
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '一位小数',
            code: 'GRID(\n  ROW(MM(4), CELL(MM(2), DOT))\n)',
            note: '4 与 2 是两个独立列，小数点贴在 2 的右边界。',
          },
          {
            type: 'example',
            title: '多位数中的小数点',
            code: 'GRID(\n  ROW(MM(1), MM(0), CELL(MM(2), DOT), MM(3))\n)',
            note: '小数点属于 2 所在的格子；后续的 3 仍占独立的下一列。',
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
              ['`ROW 只能包含 CELL、EMPTY、定位宏或 DOT。`', '把 DOT 放进了 GRID 或其他结构宏。', '把 DOT 放进 `CELL` 或 `ROW`。'],
              ['`DOT(5)` 无法编译', 'DOT 不接受参数。', '写成 `DOT`，把数字另放在 `MM(5)`。'],
              ['小数点颜色不是预期值', 'autoColor 使用了专用色。', '需要自定义颜色时关闭 autoColor 并使用 `RBL(.)` + STYLE。'],
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
            title: '给数字加上小数点',
            task: '把 7 改成 7.，小数点使用 DOT 并贴在右边界。',
            starter: 'GRID(\n  ROW(MM(7))\n)',
            answer: 'GRID(\n  ROW(CELL(MM(7), DOT))\n)',
            hint: 'DOT 必须与 7 共享同一个 CELL。',
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
              { title: 'RBL · 右边界文字', text: 'DOT 展开后的完整宏。', to: '/macro-rules/rbl' },
              { title: 'CELL · 单元格', text: '小数点与数字同格的容器。', to: '/macro-rules/cell' },
              { title: '方括号 []', text: '`[7, DOT]` 的短写形式。', to: '/macro-rules/cell-shorthand' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'bracket',
    title: 'BRACKET · 厂字弯',
    navLabel: 'BRACKET / BRKT',
    kicker: 'SYMBOL MACRO · BRACKET',
    group: 'symbol',
    summary: 'BRACKET 生成除法竖式左侧的厂字弯，并自动向右延伸厂字横。它必须独占一个单元格，所在轨道会缩窄为 0.5u。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`BRACKET` 是完整的厂字宏，编译为通用 `corner(bottomRight)` 图元。它不只是一个弯角：还会从自身右上角沿当前行的上边界延伸到网格最右边界，形成厂字横。',
          },
          {
            type: 'bracket-board',
            note: '弯角独占一个 0.5u 轨道；厂字横从弯角右上角延伸到网格最右边界，被除数各格不需要重复写 `TBD`。',
          },
          {
            type: 'callout',
            tone: 'info',
            title: 'BRACKET 是弯角，不是四条边框',
            text: 'BRACKET 占的是弯角所在的单元格，厂字横沿该行上边界向右延伸；它不是 TBD/RBD/BBD/LBD 的组合，也不会在右侧新增单元格。',
          },
          {
            type: 'list',
            items: [
              '别名 `BRKT`，可以写成 `BRKT`、`BRKT()`、`BRACKET` 或 `BRACKET()`。',
              '必须独占一个 `columnSpan` 为 1 的 CELL；可写成 `CELL(BRKT)` 或直接放在 ROW 中。',
              '所在真实列的轨道尺寸变为 0.5u，被除数各格不需要重复写 `TBD`。',
              '右侧没有列时只保留厂字弯，不生成零长度厂字横。',
            ],
          },
        ],
      },
      {
        id: 'signature',
        title: '签名与参数',
        blocks: [
          { type: 'code', title: '签名', code: 'BRACKET\nBRKT' },
          {
            type: 'table',
            columns: ['项', '类型', '必填', '说明'],
            rows: [
              ['`BRACKET`', '零参数宏', '是', '不接收文字、STYLE 或 KV。'],
              ['所在 CELL', '独占单元格', '是', '需要样式时写成 `CELL(BRKT, KV(style, token))`。'],
            ],
          },
        ],
      },
      {
        id: 'behavior',
        title: '几何与样式规则',
        blocks: [
          {
            type: 'list',
            items: [
              '图元内容为 `corner(bottomRight)`，圆角比例 1，线宽 2。',
              '厂字横从弯角右上角出发，覆盖当前行从下一列到网格右边界。',
              'autoColor 开启时，弯角与厂字横共同使用 `bracketRule` 的独立线条色，不与普通 LINE 混用。',
              '`BRACKET` 不能与数字、边框或其他定位图元同格，也不能设置 `columnSpan`。',
              '它只负责版式，不计算除法，也不选择被除数或商。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '直接写在 ROW 里的等价形式',
            text: '`ROW(MM(3), BRKT, MM(1))` 会为 BRKT 自动建立一个独占单元格；如果要附加样式 token，仍应显式写 `CELL(BRKT, KV(style, ...))`。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '厂字弯与右侧厂字横',
            code: 'GRID(\n  ROW(MM(2), MM(4), MM(6)),\n  ROW(MM(2), BRACKET, MM(4), MM(9), MM(2))\n)',
            note: '第一行商 246 位于厂字横上方，第二行是除数 2、BRACKET 与被除数 492；492 ÷ 2 = 246。',
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
              ['`BRACKET 是零参数宏；请在 CELL 上设置样式配置。`', '给 BRACKET 传了参数。', '改成 `BRACKET`，样式写在 CELL 上。'],
              ['`BRACKET 必须独占一个 columnSpan 为 1 的 CELL。`', '与数字同格，或设置了跨度。', '拆成单独单元格，保持 `columnSpan=1`。'],
              ['`CELL 内只能包含...`', '把 BRACKET 与边框等不允许的图元混用。', 'BRACKET 只与 KV 配置同格。'],
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
            title: '补一个厂字弯',
            task: '在除数 2 与被除数 492 之间补一个厂字弯，使商 246 的除法竖式成立。',
            starter: 'GRID(\n  ROW(MM(2), MM(4), MM(6)),\n  ROW(MM(2), MM(4), MM(9), MM(2))\n)',
            answer: 'GRID(\n  ROW(MM(2), MM(4), MM(6)),\n  ROW(MM(2), BRACKET, MM(4), MM(9), MM(2))\n)',
            hint: 'BRACKET 自己占一格；它右侧的被除数仍在原列之后。',
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
              { title: 'TBD · 上边框', text: '厂字横之外的普通上边界线。', to: '/macro-rules/tbd' },
              { title: 'DOT · 小数点', text: '除法结果中常见的小数点。', to: '/macro-rules/dot' },
              { title: '零参数省略与别名', text: '`BRKT` 是 `BRACKET` 的输入别名。', to: '/macro-rules/zero-argument' },
            ],
          },
        ],
      },
    ],
  },
  ...fixedSymbolPages,
  createBorderPage({
    slug: 'tbd',
    name: 'TBD',
    title: 'TBD · 单元格上边框',
    edge: 'top',
    edgeLabel: '上',
    purpose: 'TBD 在单元格的上边界画线，常用于除法被除数的顶部横线，或需要单独强调的上边线。',
    useCase: '与整行 LINE 不同，TBD 只影响一个单元格。需要跨多格时，把跨度设在 CELL 上，边框会覆盖整个单元格宽度。',
    exampleTitle: '给单个单元格加上边框',
    exampleCode: 'GRID(\n  ROW(CELL(MM(8), TBD()))\n)',
    exampleNote: '上边框只覆盖 8 所在单元格的宽度。',
    practiceTask: '给 8 的上边界补一条边框。',
    starter: 'GRID(\n  ROW(CELL(MM(8)))\n)',
    answer: 'GRID(\n  ROW(CELL(MM(8), TBD()))\n)',
    practiceHint: 'TBD 是零参数宏，可以省略空括号。',
  }),
  createBorderPage({
    slug: 'rbd',
    name: 'RBD',
    title: 'RBD · 单元格右边框',
    edge: 'right',
    edgeLabel: '右',
    purpose: 'RBD 在单元格的右边界画线，竖线与右边界基线（baseline）重合。它用于强调某一格的右侧分隔，或补充竖式右侧的短竖线。',
    useCase: '右边框跟随单元格的右边界；线宽以边界基线为中心向两侧展开，不占新列。跨两格时把 `columnSpan` 设在 CELL 上，线会落在整个跨度的右端。',
    exampleTitle: '数字右侧的竖线',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(8), RBD()))\n)',
    exampleNote: '竖线画在 8 的右边，不影响 5 的格子。',
    practiceTask: '给 8 的右边界补一条边框。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(8)))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(8), RBD()))\n)',
    practiceHint: 'RBD 必须放在 CELL 内。',
  }),
  createBorderPage({
    slug: 'bbd',
    name: 'BBD',
    title: 'BBD · 单元格下边框',
    edge: 'bottom',
    edgeLabel: '下',
    purpose: 'BBD 在单元格的下边界画线，常用于给个别结果格加下划线，或补充局部横线。',
    useCase: '如果横线要覆盖整行，优先使用 `LINE`；只需要某一格的下边线时使用 BBD。',
    exampleTitle: '给结果格加下划线',
    exampleCode: 'GRID(\n  ROW(CELL(MM(3), BBD()), CELL(MM(4), BBD()))\n)',
    exampleNote: '两个单元格各自画下边框，视觉上连成一条局部横线。',
    practiceTask: '给 8 的下边界补一条边框。',
    starter: 'GRID(\n  ROW(CELL(MM(8)))\n)',
    answer: 'GRID(\n  ROW(CELL(MM(8), BBD()))\n)',
    practiceHint: 'BBD 只画当前格的下边；整行横线应使用 LINE。',
  }),
  createBorderPage({
    slug: 'lbd',
    name: 'LBD',
    title: 'LBD · 单元格左边框',
    edge: 'left',
    edgeLabel: '左',
    purpose: 'LBD 在单元格的左边界画线，用于强调某一格的左侧分隔，或补充竖式左侧的短竖线。',
    useCase: '左边框跟随单元格的左边界；与 RBD 配合可以给一个格子加左右两条竖线。',
    exampleTitle: '数字左侧的竖线',
    exampleCode: 'GRID(\n  ROW(CELL(MM(8), LBD()), MM(4))\n)',
    exampleNote: '竖线画在 8 的左边，4 保持普通单元格。',
    practiceTask: '给 8 的左边界补一条边框。',
    starter: 'GRID(\n  ROW(CELL(MM(8)), MM(4))\n)',
    answer: 'GRID(\n  ROW(CELL(MM(8), LBD()), MM(4))\n)',
    practiceHint: 'LBD 必须放在 CELL 内。',
  }),
]
