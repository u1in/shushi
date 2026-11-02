import type { MacroDocPage } from './types'

/** 基础宏第三组：受限线条样式与全局配置写法。 */
export const basicPagesPartThree: MacroDocPage[] = [
  {
    slug: 'style',
    title: 'STYLE · 受限线条样式',
    navLabel: 'STYLE',
    kicker: 'BASE MACRO · 08',
    group: 'basic',
    summary: 'STYLE 只声明线条颜色与线宽，并只由 LINE 和单元格边框宏读取。它是跨 DOM/SVG 的受限声明，不是任意浏览器 CSS。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`STYLE` 目前只支持 `color` 与 `thickness` 两个键。它可以作为 `LINE(...)` 的第一个参数，也可以作为边框宏 `TBD / RBD / BBD / LBD` 的第一个参数。除此之外的位置都不合法。',
          },
          {
            type: 'list',
            items: [
              '`STYLE` 本身是零参数宏，可以写成 `STYLE` 或 `STYLE()`。',
              '颜色使用 DOM/SVG 共同支持的颜色值，例如 `#2563eb`。',
              '线宽必须是正数，单位为像素。',
              '`autoColor` 开启时，STYLE 的颜色和线宽会被主题覆盖。',
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
            code: 'STYLE(...styleOptions)',
          },
          {
            type: 'table',
            columns: ['键', '取值', '默认值', '说明'],
            rows: [
              ['`color`', '颜色值', '渲染器黑色基线', '线条颜色；自动配色开启时被主题替换。'],
              ['`thickness`', '正数（px）', '2', '线宽；自动配色开启时被主题替换。'],
            ],
          },
          {
            type: 'paragraph',
            text: '未知键会直接报错，例如 `STYLE(KV(dash, 4))` 会提示当前仅支持 `color` 与 `thickness`。这与多数宿主宏“忽略未知键”的行为不同。',
          },
        ],
      },
      {
        id: 'behavior',
        title: '生效规则',
        blocks: [
          {
            type: 'list',
            items: [
              '未写 `STYLE` 时，LINE 与边框宏默认使用黑色、2px。',
              '只写 `KV(style, token)` 而不写 `STYLE` 时，线宽交给 token 或渲染器主题决定，不会强制 2px。',
              '同时写 `STYLE` 与 `KV(style, token)` 时，显式颜色/线宽与 token 都会保留；autoColor 仍可覆盖可视结果。',
              'STYLE 不能放进普通 ROW；它必须由 LINE 或边框宏读取。',
              '宏层不输出 CSS 类名或 SVG 属性，最终只把受限颜色与线宽放进 GridScene。',
            ],
          },
          {
            type: 'callout',
            tone: 'warn',
            title: '想要精确样式，先关闭 autoColor',
            text: '`autoColor` 默认开启，因此直接写 `LINE(STYLE(KV(color, "#2563eb")))` 通常看不到蓝色。需要在 GRID 上写 `KV(autoColor, false)`。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '自定义横线颜色与线宽',
            code: 'GRID(\n  KV(autoColor, false),\n  ROW(MM(5), MM(6)),\n  LINE(STYLE(KV(color, "#2563eb"), KV(thickness, 3)))\n)',
            note: '关闭自动配色后，蓝色 3px 横线才会生效。',
          },
          {
            type: 'example',
            title: '给单元格边框上色',
            code: 'GRID(\n  KV(autoColor, false),\n  ROW(CELL(MM(8), BBD(STYLE(KV(color, "#e11d48"), KV(thickness, 3)))))\n)',
            note: 'STYLE 作为 BBD 的参数，只影响这条下边框。',
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
              ['`STYLE 内只能使用 KV 配置。`', '把文字或图元放进了 STYLE。', '只保留 `KV`。'],
              ['`STYLE 不支持 ...，当前仅支持 color 与 thickness。`', '写了其他键。', '删除未知键，或改用语义样式 token。'],
              ['`线条 thickness 必须是正数。`', '写了 0、负数或非数字。', '改成 1、2、3 等正数。'],
              ['`LINE 的样式必须使用 STYLE(...)。`', '把其他宏当作 LINE 的第一个参数。', '改用 `STYLE(...)`。'],
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
            title: '让横线变成蓝色 3px',
            task: '给左侧横线加上 STYLE，并关闭自动配色，让颜色与线宽真正生效。',
            starter: 'GRID(\n  ROW(MM(5), MM(6)),\n  LINE\n)',
            answer: 'GRID(\n  KV(autoColor, false),\n  ROW(MM(5), MM(6)),\n  LINE(STYLE(KV(color, "#2563eb"), KV(thickness, 3)))\n)',
            hint: 'STYLE 是 LINE 的第一个参数；autoColor 必须写在 GRID 上。',
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
              { title: 'LINE · 行级横线', text: 'STYLE 最常用的宿主。', to: '/macro-rules/line' },
              { title: 'TBD · 上边框', text: '在单元格边界上使用 STYLE。', to: '/macro-rules/tbd' },
              { title: 'KV · 配置键值', text: '区分样式声明与普通配置。', to: '/macro-rules/kv' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'kv',
    title: 'KV · 配置键值对',
    navLabel: 'KV',
    kicker: 'BASE MACRO · 09',
    group: 'basic',
    summary: 'KV 是所有宏共用的配置写法。它把键和值成对交给宿主宏，由宿主决定哪些键有效、值如何解析。',
    sections: [
      {
        id: 'purpose',
        title: '作用与位置',
        blocks: [
          {
            type: 'paragraph',
            text: '`KV(key, value)` 不是图元，也不产生行列。它出现在宿主宏的参数列表中，被解析器拆出来后交给对应宏读取。例如 GRID 读取 `columns`，ROW 读取 `align`，CELL 读取 `columnSpan`。',
          },
          {
            type: 'list',
            items: [
              '每次调用必须恰好两个参数：键与值。',
              '同一作用域中重复设置同一个键会报错。',
              '键的可用范围由宿主宏决定；值可以是数字、布尔、枚举或语义 token。',
              'KV 不占行、不占列，也不参与渲染元素列表。',
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
            code: 'KV(key, value)',
          },
          {
            type: 'table',
            columns: ['参数', '类型', '必填', '说明'],
            rows: [
              ['`key`', '文本或保留常量', '是', '配置名，例如 `columns`、`align`、`span`。'],
              ['`value`', '文本、数字或保留常量', '是', '配置值，由宿主宏按自己的类型规则解析。'],
            ],
          },
        ],
      },
      {
        id: 'scope',
        title: '各宿主宏支持的键',
        blocks: [
          {
            type: 'table',
            columns: ['宿主宏', '支持的键', '说明'],
            rows: [
              ['`GRID`', '`columns`、`trackUnit`、`unitWidth`、`unitHeight`、`padding`、`paddingX`、`paddingY`、`fontSizeRatio`、`fontSize`、`showGrid`、`showGuideGrid`、`autoColor`、`style`、`ariaLabel`', '场景级配置；`showGuideGrid` 是旧别名。'],
              ['`ROW`', '`align`', '`left` 或 `right`。'],
              ['`CELL`', '`columnSpan`、`style`', '跨度与单元格样式 token。'],
              ['`EMPTY`', '`columnSpan`、`style`', '跨度有效；样式因无图元而不产生视觉差异。'],
              ['`LINE`', '`span`、`style`', '跨度枚举与线条样式 token。'],
              ['`STYLE`', '`color`、`thickness`', '只接受这两个键，其他键报错。'],
              ['定位宏（`LT`…`RB`、`RBL`）', '`style`、`fontSizeRatio`', '文字样式 token 与字号比例。'],
              ['边框宏（`TBD`…`LBD`）', '`style`', '线条样式 token；颜色与线宽用 `STYLE` 参数。'],
              ['`DIV` / `VALUE` / `BRACKET`', '无', '不接受配置。'],
            ],
          },
          {
            type: 'paragraph',
            text: '多数宏会忽略自己不认识的键，只有 `STYLE` 会对未知键报错。这种差异是为了兼容历史源码；新写的源码应只使用目标宏明确列出的键。',
          },
        ],
      },
      {
        id: 'typing',
        title: '值的类型与校验',
        blocks: [
          {
            type: 'table',
            columns: ['值类型', '示例', '校验规则'],
            rows: [
              ['正数', '`KV(unitWidth, 36)`', '必须大于 0；非数字会报错。'],
              ['正整数', '`KV(columns, 4)`、`KV(columnSpan, 2)`', '必须是正整数；0、负数、小数都会报错。'],
              ['布尔', '`KV(showGrid, true)`', '只接受小写 `true` 或 `false`。'],
              ['枚举', '`KV(align, left)`、`KV(span, full)`', '只接受该宏列出的枚举值。'],
              ['token / 文本', '`KV(style, macro.input)`', '按原样传递，由渲染器或主题解释。'],
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '显式配置优先',
            text: '配置的生效顺序是显式配置 > 自动推导 > 默认值。显式 `columns` 小于最长行时会报错，而不是悄悄截断；这是为了尽早暴露结构问题。',
          },
        ],
      },
      {
        id: 'examples',
        title: '示例',
        blocks: [
          {
            type: 'example',
            title: '三个不同宿主上的 KV',
            code: 'GRID(\n  KV(columns, 3),\n  KV(showGrid, true),\n  ROW(MM(5), MM(6), KV(align, left)),\n  ROW(CELL(MM(7), KV(columnSpan, 2)), MM(8))\n)',
            note: 'GRID 读取列数与辅助网格，ROW 读取对齐，CELL 读取跨度；同一个 KV 语法在不同层级生效。',
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
              ['`KV 必须包含键和值两个参数，例如 KV(span, previous)。`', '只写一个参数或写了三个。', '改成 `KV(key, value)`。'],
              ['`配置 ... 被重复设置。`', '同一宏里写了两次同名键。', '删除其中一个，保留期望的值。'],
              ['`GRID 的 showGrid 只能是 true 或 false。`', '布尔值写成了 `yes` 或 `1`。', '改成小写 `true` / `false`。'],
              ['`GRID 的 columns 必须是正整数。`', '写了小数或 0。', '改成 1、2、3 等正整数。'],
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
            title: '用 KV 补齐场景配置',
            task: '把两列网格改成三列、显示辅助网格，并让唯一一行左对齐。',
            starter: 'GRID(\n  ROW(MM(5), MM(6))\n)',
            answer: 'GRID(\n  KV(columns, 3),\n  KV(showGrid, true),\n  ROW(MM(5), MM(6), KV(align, left))\n)',
            hint: '前两个 KV 属于 GRID，最后一个属于 ROW。',
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
              { title: '基础语法规则', text: '配置的拆分、重复检查与优先级。', to: '/macro-rules/syntax' },
              { title: 'GRID · 网格根节点', text: '完整的场景配置表。', to: '/macro-rules/grid' },
              { title: 'STYLE · 受限线条样式', text: '唯一会对未知键报错的宿主。', to: '/macro-rules/style' },
            ],
          },
        ],
      },
    ],
  },
]
