import type { MacroDocPage } from './types'

/**
 * 基础宏第一组：网格、行、单元格与空单元格。
 * 每个页面都按“作用 → 签名 → 配置 → 规则 → 示例 → 错误 → 练习”展开，便于横向查阅。
 */
export const basicPagesPartOne: MacroDocPage[] = [
  {
    slug: 'grid',
    title: 'GRID · 网格根节点',
    navLabel: 'GRID',
    kicker: 'BASE MACRO · 01',
    group: 'basic',
    summary:
      'GRID 是整份宏源码的根节点。它收集 ROW、LINE 与场景配置，推导列数，并决定单位格尺寸、留白、自动配色和无障碍标签。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '所有宏最终都会被编译成一个 `GridScene`，而 `GRID` 就是这个场景的唯一根。它本身不产生文字或线条，只负责组织子节点并给出场景级参数。',
          },
          {
            type: 'list',
            items: [
              '直接子项只有三类：`ROW`、`LINE` 与 `KV` 配置。',
              '至少需要一个 `ROW`；没有数字行的网格无法推导列数，也没有可渲染内容。',
              '省略根节点时可以写隐式 GRID：顶层 `ROW`、`LINE` 列表会被自动包进 `GRID(...)`。',
              '只有需要 `columns`、`showGrid`、`unitWidth` 等场景配置时，才必须显式写 `GRID(`。',
              '任意 `ROW` 直接包含 `DIV` 时，整个 GRID 会自动切换到短除法半格模式。',
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
            code: 'GRID(...children)',
          },
          {
            type: 'table',
            columns: ['参数', '类型', '必填', '说明'],
            rows: [
              [
                '`children`',
                '`ROW`、`LINE` 或 `KV`',
                '至少一个 `ROW`',
                '按出现顺序组织数字行与横线；`KV` 在解析阶段被拆出，不占行。',
              ],
            ],
          },
          {
            type: 'paragraph',
            text: '显式列数的推导规则是：先取所有 `ROW` 的单元格跨度之和的最大值，再与 `KV(columns, n)` 比较。显式值更小会报错，不会截断内容。',
          },
        ],
      },
      {
        id: 'options',
        title: '配置项',
        blocks: [
          {
            type: 'table',
            columns: ['键', '取值', '默认值', '作用'],
            rows: [
              ['`columns`', '正整数', '按最长 ROW 推导', '场景真实列数。短行会按对齐方式贴齐这个宽度。'],
              [
                '`trackUnit`',
                '`full` 或 `half`',
                '`full`',
                '`half` 把每条真实轨道设为 0.5u；普通单元格默认跨两条轨道。含 `DIV` 时自动强制为 `half`。',
              ],
              ['`unitWidth`', '正数（px）', '30', '单位格宽；短除法中每个数字仍占两个半格轨道。'],
              ['`unitHeight`', '正数（px）', '46', '单行行高。'],
              ['`padding`', '正数（px）', '未设置', '同时覆盖上下左右留白；设置后优先于 `paddingX` / `paddingY`。'],
              ['`paddingX`', '正数（px）', '20', '左右留白。'],
              ['`paddingY`', '正数（px）', '12', '上下留白。'],
              ['`fontSizeRatio`', '正数', '1', '字号比例：实际字号 = `unitWidth × fontSizeRatio`。'],
              ['`fontSize`', '正数（px）', '未设置', '绝对字号覆盖；设置后优先于比例计算。'],
              ['`showGrid`', '`true` 或 `false`', '`false`', '显示辅助网格轨道。旧写法 `showGuideGrid` 仍兼容。'],
              [
                '`lineSpan`',
                '`previous`、`adjacent`、`longest` 或 `full`',
                '默认 `adjacent`；可显式改为 `previous`、`longest` 或 `full`',
                '为多条横线设置共同跨度；`adjacent` 会按横线前后两行的可见图元边界取跨度，个别横线可用自身的 `span` 覆盖。',
              ],
              [
                '`autoColor`',
                '`true` 或 `false`',
                '`true`',
                '启用固定语义区域的自动配色，并覆盖线条的显式颜色与粗细；颜色由编译选项中的 `colorTheme` 配置。',
              ],
              ['`style`', '语义样式 token', '未设置', '场景默认文本样式 token；单元格或图元可以覆盖。'],
              ['`ariaLabel`', '文本', '`宏公式预览`', '渲染结果的 ARIA 标签；短除法模式默认是 `短除法宏公式预览`。'],
            ],
          },
          {
            type: 'callout',
            tone: 'warn',
            title: '自动配色的两个副作用',
            text: '`autoColor` 默认开启：它会按固定语义区域分配文字颜色，并让 LINE、边框、BRACKET 使用主题线条；默认颜色来自内置 JavaScript 主题，此时 `STYLE` 里的颜色和线宽只保留在源码，不参与最终输出。需要精确样式时写 `KV(autoColor, false)`。',
          },
        ],
      },
      {
        id: 'layout',
        title: '布局推导规则',
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              '**推导列数**：取所有 ROW 的 `columnSpan` 之和的最大值。',
              '**定位每一行**：默认右对齐，从推导出的列数向左回退；`KV(align, left)` 的行从第 0 列开始。',
              '**定位每一个单元格**：`CELL` 与 `EMPTY` 按自身的 `columnSpan` 前进；裸定位宏默认占一个完整数字格。',
              '**附着横线**：`LINE` 不创建新行，只在上一条 ROW 的下边缘生成线条。',
              '**输出场景**：列轨道、行轨道、留白、字号与元素列表一次性交给 GridScene。',
            ],
          },
          {
            type: 'paragraph',
            text: '`LINE` 与 `ROW` 之间没有隐藏的空白行。连续 ROW 之间只存在逻辑分隔边界，不会产生可见轨道；需要可见横线时必须显式写 `LINE`。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '最小网格',
            code: 'GRID(\n  ROW(MM(1), MM(2)),\n  ROW(MM(3), MM(4))\n)',
            note: '省略 `columns`，按两列推导；两行都默认右对齐。',
          },
          {
            type: 'example',
            title: '显式尺寸与辅助网格',
            code: 'GRID(\n  KV(columns, 4),\n  KV(unitWidth, 36),\n  KV(unitHeight, 52),\n  KV(paddingX, 28),\n  KV(paddingY, 16),\n  KV(showGrid, true),\n  ROW(MM(1), MM(2)),\n  ROW(MM(3), MM(4))\n)',
            note: '`columns=4` 让两列内容整体右对齐到第 3、4 列；`showGrid` 会显示所有真实轨道。',
          },
        ],
      },
      {
        id: 'errors',
        title: '常见错误',
        blocks: [
          {
            type: 'table',
            columns: ['错误信息或现象', '触发原因', '修正'],
            rows: [
              ['`GRID 至少需要一个 ROW。`', '只写了 KV 或空 GRID。', '加入至少一个 `ROW(...)`。'],
              [
                '`GRID 只能包含 ROW、LINE 或 KV 配置。`',
                '把定位宏、`STYLE` 或裸文字直接放在 GRID 下。',
                '先包一层 `ROW`，图元放进 `CELL`。',
              ],
              [
                '`GRID 的 columns=... 小于最长 ROW 所需的 ... 列。`',
                '显式列数不足。',
                '增大 `columns`，或删除该配置交给自动推导。',
              ],
              [
                '`autoColor` 不再有 40 行限制。',
                '自动配色使用固定语义颜色，不依赖行号色板。',
                '通过 `colorTheme` 配置主题颜色。',
              ],
              ['`GRID 不支持子节点 ...`', '在显式 GRID 里混入了简写行。', '不要混用顶层分号简写与显式 GRID。'],
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
            title: '补全场景配置',
            task: '把左侧的最小网格补成：显式 4 列、显示辅助网格、两行内容仍然只有两格。',
            starter: 'GRID(\n  ROW(MM(1), MM(2))\n)',
            answer: 'GRID(\n  KV(columns, 4),\n  KV(showGrid, true),\n  ROW(MM(1), MM(2))\n)',
            hint: '两个 `KV` 都写在 `ROW` 之前，仍然是 GRID 的直接子项。',
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
              { title: 'ROW · 数字行', text: '学习行内单元格、对齐与短行回退。', to: '/macro-rules/row' },
              { title: 'KV · 配置键值', text: '查看每个宿主宏支持的键和取值规则。', to: '/macro-rules/kv' },
              { title: 'DIV · 短除法分割线', text: '了解 GRID 如何自动切换到半格模式。', to: '/macro-rules/div' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'row',
    title: 'ROW · 数字行',
    navLabel: 'ROW',
    kicker: 'BASE MACRO · 02',
    group: 'basic',
    summary: 'ROW 表示一条数字行。它按顺序放置单元格，决定行内对齐，并成为 LINE 的附着对象。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`ROW` 是 GRID 的直接子项。每个 ROW 对应一条真实行高，行内可以包含 `CELL`、`EMPTY`、单个定位宏或 `DOT`。它不负责画线；横线是独立的 `LINE` 图元。',
          },
          {
            type: 'list',
            items: [
              '至少包含一个单元格；空 `ROW` 会报错。',
              '默认右对齐；短行会贴齐场景最右侧，而不是从左侧留空。',
              '裸写的 `MM(5)`、`RB(1)` 会各自归一化为独立 `CELL`；需要同格叠放时必须显式 `CELL`。',
              '`LINE`、`STYLE`、裸文字、`KV` 之外的任意裸宏都不是合法的 ROW 内容。',
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
            code: 'ROW(...cells, ...options)',
          },
          {
            type: 'table',
            columns: ['参数', '类型', '必填', '说明'],
            rows: [
              [
                '`cells`',
                '`CELL`、`EMPTY`、定位宏或 `DOT`',
                '至少一项',
                '按顺序占用列；每个单元格的跨度由 `columnSpan` 决定。',
              ],
              ['`KV(align, ...)`', '`left` 或 `right`', '否', '行内对齐方式，默认 `right`。'],
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
              '**右对齐**：行宽小于场景列数时，整行向右贴齐个位列。',
              '**左对齐**：写 `KV(align, left)` 后，整行从第 0 列开始。',
              '**跨度**：`CELL` 与 `EMPTY` 的 `columnSpan` 按真实轨道计数；`trackUnit=half` 时普通单元格默认跨两条轨道。',
              '**同格关系**：一个 ROW 中的相邻定位宏默认是两个独立单元格；要叠在同一格必须用 `CELL` 或 `[]`。',
              '**横线依附**：`LINE` 永远贴在上一条 ROW 的下边缘，不会成为新的行。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: 'ROW 不接收 LINE',
            text: '`ROW(MM(5), LINE)` 会报错。横线是行级图元，必须写成 `ROW(MM(5)), LINE`，或放进 `GRID` 的直接子项。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '短行自动右对齐',
            code: 'GRID(\n  ROW(MM(5), MM(6), MM(7)),\n  ROW(MM(8))\n)',
            note: '两行都按三列场景对齐；第二行只有 8，会落在最右列。',
          },
          {
            type: 'example',
            title: '改为左对齐',
            code: 'GRID(\n  ROW(MM(5), MM(6), MM(7)),\n  ROW(MM(8), MM(9), KV(align, left))\n)',
            note: '第一行有三格，列数推导为 3；第二行只有两格，左对齐后从第 0 列开始，而不是贴齐右侧。',
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
              ['`ROW 至少需要一个单元格。`', '写了 `ROW()` 或只有配置。', '加入至少一个 `CELL`、`EMPTY` 或定位宏。'],
              [
                '`ROW 的 align 只能是 left 或 right。`',
                '写了其他值。',
                '改成 `KV(align, left)` 或 `KV(align, right)`。',
              ],
              [
                '`ROW 只能包含 CELL、EMPTY、定位宏或 DOT。`',
                '把 `LINE`、`STYLE` 或裸文字塞进行内。',
                '横线移到 ROW 外；文字先包 `MM(...)`。',
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
            title: '补全第二行',
            task: '让这个网格显示两行三列：第一行 1 2 3，第二行 4 5 6。',
            starter: 'GRID(\n  ROW(MM(1)),\n  ROW(MM(4))\n)',
            answer: 'GRID(\n  ROW(MM(1), MM(2), MM(3)),\n  ROW(MM(4), MM(5), MM(6))\n)',
            hint: '每行三个单元格，列数会自动推导为 3。',
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
              { title: 'CELL · 单元格', text: '在同一个格子里组合数字、进位点和小数点。', to: '/macro-rules/cell' },
              { title: 'LINE · 行级横线', text: '把横线附着到刚写完的 ROW 下边缘。', to: '/macro-rules/line' },
              { title: '顶层分号行', text: '用分号省掉 ROW 包裹，让每一行更紧凑。', to: '/macro-rules/row-shorthand' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'cell',
    title: 'CELL · 同格图元容器',
    navLabel: 'CELL',
    kicker: 'BASE MACRO · 03',
    group: 'basic',
    summary:
      'CELL 定义一个真实单元格，也是多个图元共用同一格的唯一组合边界。数字、进位点、借位点、小数点与边框都必须先在 CELL 内组织。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`CELL` 既是布局单位，也是组合边界。`ROW(MM(5), MM(6))` 会归一化成两个独立单元格；如果 9 和借位点要叠在同一格，就必须写成 `CELL(MM(9), MTD)`，也可使用方括号简写 `[9, MTD]`；`MTD` 是 `MT(·)` 的零参数简写。',
          },
          {
            type: 'list',
            items: [
              'CELL 是 ROW 的合法内容之一。',
              '允许的图元：九宫格定位宏、`RBL`、四个边框宏、`BRACKET` 与 `DOT`。',
              '允许的配置：`KV(columnSpan, 正整数)` 与 `KV(style, token)`。',
              '`BRACKET` 必须独占一个 CELL，且 `columnSpan` 只能为 1。',
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
            code: 'CELL(...elements, ...cellOptions)',
          },
          {
            type: 'table',
            columns: ['项', '类型', '必填', '说明'],
            rows: [
              ['`elements`', '定位宏、边框宏、`BRACKET`、`DOT`', '否', '可以放多个图元，它们共享同一个单元格范围。'],
              ['`KV(columnSpan, n)`', '正整数', '否', '单元格跨越的真实轨道数，默认 1；半个轨道模式中普通格默认跨 2。'],
              ['`KV(style, token)`', '语义样式 token', '否', '写入单元格样式 token，供图元或渲染器主题读取。'],
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
              'CELL 的图元共享同一个 `position`：同一个列索引、行索引与跨度。',
              '多个定位宏可以叠放：例如 `MM(6)` 在中心，`RB(1)` 在右下角。',
              '`columnSpan` 会占用多列，但不会让内部图元自动居中到整个跨度；定位仍按单元格锚点计算。',
              '边框宏只画在当前单元格的边界上；要画跨两格的边框，应把 `columnSpan` 设在 CELL 上，而不是设在边框宏上。',
              'CELL 内的 `style` 会被没有显式样式 token 的图元继承。',
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
            title: '数字与进位点同格',
            code: 'GRID(\n  ROW(MM(5), CELL(MM(6), RB(1)))\n)',
            note: '6 保持中心位置，1 落在同一格右下角；两个图元共享一个 CELL。',
          },
          {
            type: 'example',
            title: '小数点与跨度',
            code: 'GRID(\n  ROW(CELL(MM(7), DOT), CELL(MM(8), KV(columnSpan, 2), TBD()))\n)',
            note: '第一格放了 7 和小数点；第二格跨两列，并在上边界画线。',
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
                '`CELL 内只能包含定位宏、边框宏、BRACKET、DOT 或 KV 配置。`',
                '把 `LINE`、`VALUE`、裸文字或另一个 CELL 放进 CELL。',
                '只保留单元格图元；结构宏放回 ROW 或 GRID。',
              ],
              [
                '`BRACKET 必须独占一个 columnSpan 为 1 的 CELL。`',
                'BRACKET 与数字、边框同格，或设置了跨度。',
                '为 BRACKET 单独开一个 `CELL(BRKT)`。',
              ],
              ['`CELL 的 columnSpan 必须是正整数。`', '写了 0、负数或小数。', '改成 1、2、3 等正整数。'],
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
            title: '把进位点放进同一格',
            task: '把左侧的 5 与 6 改成：5 正常居中，6 与进位点 1 叠在同一格。',
            starter: 'GRID(\n  ROW(MM(5), MM(6))\n)',
            answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), RB(1)))\n)',
            hint: '需要同格时，用 `CELL(...)` 包住数字与定位宏。',
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
              { title: 'RB · 右下角文字', text: '最常用的进位标记位置。', to: '/macro-rules/rb' },
              { title: '方括号 []', text: 'CELL 的短写形式，首项可省略 MM。', to: '/macro-rules/cell-shorthand' },
              { title: '边框宏 TBD/RBD/BBD/LBD', text: '在单元格边界上画线。', to: '/macro-rules/tbd' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'empty',
    title: 'EMPTY · 占位空单元格',
    navLabel: 'EMPTY / EMP',
    kicker: 'BASE MACRO · 04',
    group: 'basic',
    summary: 'EMPTY 只占列，不产生任何可见图元。它用于补位、对齐和跨列留空；别名 EMP，并可省略空括号。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`EMPTY` 是“有位置、没内容”的单元格。它参与列跨度计算，让后续单元格落在正确的列上，但不会生成文字、线条或边框。常见场景是让短行中的数字避开某个位置。',
          },
          {
            type: 'list',
            items: [
              '`EMPTY` 可以写成 `EMPTY()`、`EMPTY(KV(...))`、`EMP()` 或直接写 `EMP`。',
              '它不能包含任何图元；写了 `MM`、`DOT` 或边框都会报错。',
              '`KV(columnSpan, n)` 可以让它一次空出多列。',
              '`KV(style, token)` 会被保留在归一化单元格上，但因为没有可见图元，目前不会产生视觉差异。',
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
            code: 'EMPTY(...cellOptions)\nEP(...cellOptions)',
          },
          {
            type: 'table',
            columns: ['项', '类型', '必填', '说明'],
            rows: [
              ['`KV(columnSpan, n)`', '正整数', '否', '空出的真实轨道数，默认 1。'],
              ['`KV(style, token)`', '语义样式 token', '否', '保留在单元格上，但 EMPTY 没有图元可消费。'],
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
              'EMPTY 的宽度计入行宽，因此会影响整行的右对齐起点。',
              '在 `trackUnit=half` 下，普通 EMPTY 默认跨两条轨道，即一个完整数字格。',
              '如果只是想让行短一点，不需要在行尾补 EMPTY；短行会自动右对齐。',
              '要让某个数字落在指定列，可以组合多个 EMPTY 或直接使用 `columnSpan`。',
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: 'EMPTY 与空字符串不同',
            text: '`MM("")` 是一个有文本图元的单元格（只是文字为空），而 `EMPTY` 完全没有图元。两者在元素列表和边框、选中区域上的表现不同，补位应使用 `EMPTY`。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '让 3 落在第二列',
            code: 'GRID(\n  ROW(MM(8), MM(4), MM(2)),\n  ROW(MM(3), EMPTY(), MM(6))\n)',
            note: '第二行的 3 占第一列，EMPTY 占第二列，6 落在第三列；两行都按三列场景对齐。',
          },
          {
            type: 'example',
            title: '一次空出两列',
            code: 'GRID(\n  ROW(MM(1), EMPTY(KV(columnSpan, 2)), MM(2))\n)',
            note: '中间的空单元格跨两列，整行共占四列。',
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
                '`EMPTY 只能包含配置，不能包含单元格图元。`',
                '写了 `EMPTY(MM(5))` 或加了边框。',
                '删除图元；只需要占位时保留 `KV`。',
              ],
              ['`EMPTY 的 columnSpan 必须是正整数。`', '写了 0、负数或小数。', '改成 1、2、3 等正整数。'],
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
            title: '补一个空位',
            task: '让第二行的 3 与 6 之间空出一格，使 6 落在第三列。',
            starter: 'GRID(\n  ROW(MM(8), MM(4), MM(2)),\n  ROW(MM(3), MM(6))\n)',
            answer: 'GRID(\n  ROW(MM(8), MM(4), MM(2)),\n  ROW(MM(3), EMPTY(), MM(6))\n)',
            hint: '也可以用别名 `EMP` 省略空括号。',
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
              {
                title: '零参数省略与别名',
                text: '`EMP`、`LN`、`BRKT`、`SQ`、`TRI`、`RND` 的完整规则。',
                to: '/macro-rules/zero-argument',
              },
              { title: 'ROW · 数字行', text: '理解短行右对齐为什么有时不需要 EMPTY。', to: '/macro-rules/row' },
            ],
          },
        ],
      },
    ],
  },
]
