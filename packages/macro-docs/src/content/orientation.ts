import type { DocBlock, MacroDocPage } from './types'

/**
 * 九宫格定位宏与右边界文字宏。
 * 十个宏的参数完全一致，差异只在锚点与自动配色约定，因此共用工厂生成页面，
 * 但每个页面的用途、示例、练习与易错点都单独给出。
 */
interface PositionPageConfig {
  slug: string
  name: string
  title: string
  purpose: string
  anchor: string
  defaultRatio: string
  colorRole: string
  exampleTitle: string
  exampleCode: string
  exampleNote: string
  starter: string
  answer: string
  practiceTask: string
  practiceHint: string
  extraTips?: string[]
  related?: Array<{ title: string, text: string, to: string }>
}

const commonErrors = (name: string): DocBlock => ({
  type: 'table',
  columns: ['错误信息', '触发原因', '修正'],
  rows: [
    [`\`${name} 必须包含一个文本参数。\``, '传了零个或多个参数。', `只保留一个文字，例如 \`${name}(5)\`。`],
    [`\`${name} 的 fontSizeRatio 必须是正数。\``, '比例写成 0、负数或非数字。', '改成 1、0.42 等正数。'],
    ['`ROW 只能包含 CELL、EMPTY、定位宏或 DOT。`', `把 \`${name}\` 放进了 GRID 或其他结构宏。`, '先放进 `ROW(...)` 或 `CELL(...)`。'],
  ],
})

const createPositionPage = (config: PositionPageConfig): MacroDocPage => {
  const isEdgeText = config.name === 'RBL'
  const safeName = config.name
  return {
    slug: config.slug,
    title: config.title,
    navLabel: safeName,
    kicker: isEdgeText ? 'ORIENTATION MACRO · EDGE TEXT' : 'ORIENTATION MACRO · POSITION',
    group: 'orientation',
    summary: config.purpose,
    sections: [
      {
        id: 'position',
        title: '位置与作用',
        blocks: [
          { type: 'paragraph', text: config.purpose },
          isEdgeText
            ? { type: 'edge-text-board', note: 'RBL 不在九宫格内：它把文字放在单元格右侧边框中点，并与数字的行框基线对齐。' }
            : { type: 'position-board', active: safeName, note: '高亮格就是该宏在当前单元格内的锚点。' },
          { type: 'paragraph', text: config.anchor },
        ],
      },
      {
        id: 'signature',
        title: '签名与参数',
        blocks: [
          { type: 'code', title: '签名', code: `${safeName}(text, ...options)` },
          {
            type: 'table',
            columns: ['参数', '类型', '必填', '说明'],
            rows: [
              ['`text`', '文本、数字或保留常量', '是', '恰好一个文字参数；包含分隔符时用双引号包裹。'],
              ['`KV(style, token)`', '语义样式 token', '否', '文字样式 token；autoColor 仍可能覆盖颜色。'],
              ['`KV(fontSizeRatio, n)`', '正数', '否', `字号比例；${safeName === 'MM' ? 'MM 默认 1' : '该宏默认 0.42'}。`],
            ],
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
              `**默认字号**：${config.defaultRatio}。`,
              `**自动配色**：${config.colorRole}。`,
              '**约束**：只能作为 ROW 的单元格内容，或 CELL 内的图元；不能直接放在 GRID 下。',
              '**同格叠放**：与数字叠放时必须使用 `CELL(...)` 或 `[...]`，否则会变成两个独立单元格。',
              '**文字格式**：一个宏只放一个文字参数；更长的文字要写成带引号的字符串。',
              ...(config.extraTips ?? []),
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
        blocks: [commonErrors(safeName)],
      },
      {
        id: 'practice',
        title: '动手练习',
        blocks: [
          {
            type: 'sandbox',
            title: `练习 ${safeName} 的锚点`,
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
            items: config.related ?? [
              { title: 'MM · 中心文字', text: '正常字号与中心锚点。', to: '/macro-rules/mm' },
              { title: 'CELL · 单元格', text: '把定位宏与数字放进同一格。', to: '/macro-rules/cell' },
              { title: '方括号 []', text: '同格图元的短写形式。', to: '/macro-rules/cell-shorthand' },
            ],
          },
        ],
      },
    ],
  }
}

export const orientationPages: MacroDocPage[] = [
  createPositionPage({
    slug: 'lt',
    name: 'LT',
    title: 'LT · 左上角文字',
    purpose: 'LT 把文字放在当前单元格的左上角。它适合放小号索引、说明标记，或任何不抢占中心数字位置的教学标注。',
    anchor: '锚点是单元格的左上角：水平左对齐、垂直上对齐。文字不会改变单元格宽度、行高或其他图元的定位。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；如果文字本身是 `+`、`−`、`×`、`÷` 等运算符，则使用运算符独占色',
    exampleTitle: '在数字 6 的左上角做标记',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), LT(·)), MM(7))\n)',
    exampleNote: '6 保持中心，LT 的圆点落在同一格左上角；两个图元共享一个 CELL。',
    practiceTask: '在第二格的 6 左上角补一个圆点标记。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), LT(·)), MM(7))\n)',
    practiceHint: '先保留 CELL，再把 `LT(·)` 作为第二个图元放进去。',
  }),
  createPositionPage({
    slug: 'mt',
    name: 'MT',
    title: 'MT · 中上文字',
    purpose: 'MT 把文字放在当前单元格的上边缘中央。竖式减法中，它约定用来表示借位点，因此自动配色会使用独立的借位色板。',
    anchor: '锚点是单元格的中上位置：水平居中、垂直上对齐。它与中心数字错开，因此不会遮住数字本身。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '自动配色把它当作借位标记，按行取借位色；即使文本不是点，也按 MT 的约定着色',
    exampleTitle: '减法借位标记',
    exampleCode: 'GRID(\n  ROW(CELL(MM(3), MT(·)), CELL(MM(5), MT(·)), MM(6)),\n  ROW(MM(−), MM(2), MM(7), MM(8)),\n  LINE,\n  ROW(MM(7), MM(8))\n)',
    exampleNote: '两个 MT 点分别落在 3 与 5 的上方中央，表示向高位借位；356 − 278 = 78。',
    practiceTask: '在 6 的上方中央补一个借位点。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), MT(·)), MM(7))\n)',
    practiceHint: 'MT 与数字必须共享同一个 CELL。',
  }),
  createPositionPage({
    slug: 'rt',
    name: 'RT',
    title: 'RT · 右上角文字',
    purpose: 'RT 把文字放在当前单元格的右上角。它适合放右侧补充标记，或需要在数字上方靠右显示的小号提示。',
    anchor: '锚点是单元格的右上角：水平右对齐、垂直上对齐。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；运算符文本使用运算符独占色',
    exampleTitle: '右上角标记',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), RT(·)), MM(7))\n)',
    exampleNote: '圆点落在 6 的右上角，数字仍保持中心。',
    practiceTask: '在 6 的右上角补一个标记。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), RT(·)), MM(7))\n)',
    practiceHint: '`RT(·)` 放在 CELL 内，锚点会自动靠右上。',
  }),
  createPositionPage({
    slug: 'ml',
    name: 'ML',
    title: 'ML · 左中文字',
    purpose: 'ML 把文字放在当前单元格的左侧中部。它适合在数字左边放小号说明、步骤编号或方向标记。',
    anchor: '锚点是单元格的左中位置：水平左对齐、垂直居中。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；运算符文本使用运算符独占色',
    exampleTitle: '左侧中部标记',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), ML(·)), MM(7))\n)',
    exampleNote: '圆点与 6 在同一垂直中心线上，但贴左侧。',
    practiceTask: '在 6 的左侧中部补一个标记。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), ML(·)), MM(7))\n)',
    practiceHint: '`ML(·)` 与中心数字共享一个 CELL。',
  }),
  createPositionPage({
    slug: 'mm',
    name: 'MM',
    title: 'MM · 中心文字',
    purpose: 'MM 是默认的文字定位宏：把文字放在单元格正中央，并使用正常字号。普通数字、运算符和大部分正文都应该用它。',
    anchor: '锚点是单元格的正中心：水平居中、垂直居中。',
    defaultRatio: '默认字号比例为 1，即与题目数字同样大小；可以用 `KV(fontSizeRatio, n)` 覆盖',
    colorRole: '普通文字取所在行颜色；`+`、`−`、`×`、`÷` 等运算符取各自的全局独占色',
    exampleTitle: '最普通的数字行',
    exampleCode: 'GRID(\n  ROW(MM(5), MM(6), MM(7))\n)',
    exampleNote: '三个 MM 都是独立单元格，居中并使用正常字号。',
    practiceTask: '把只有两格的数字行补成 5、6、7。',
    starter: 'GRID(\n  ROW(MM(5), MM(6))\n)',
    answer: 'GRID(\n  ROW(MM(5), MM(6), MM(7))\n)',
    practiceHint: '继续加一个 `MM(7)` 即可；列数会自动推导为 3。',
    extraTips: [
      '分号行中的裸文字会自动补成 MM，所以 `5,6;` 与 `ROW(MM(5), MM(6))` 等价。',
      '方括号首项也可以省略 MM，例如 `[6, RB(1)]`。',
    ],
    related: [
      { title: 'RBL · 右边界文字', text: '把文字放到右侧边框中点。', to: '/macro-rules/rbl' },
      { title: 'DOT · 小数点', text: 'RBL(.) 的专用简写。', to: '/macro-rules/dot' },
      { title: '顶层分号行', text: '裸文字自动补 MM 的场景。', to: '/macro-rules/row-shorthand' },
    ],
  }),
  createPositionPage({
    slug: 'mr',
    name: 'MR',
    title: 'MR · 右中文字',
    purpose: 'MR 把文字放在当前单元格的右侧中部。它适合在数字右边放小号说明或方向标记。',
    anchor: '锚点是单元格的右中位置：水平右对齐、垂直居中。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；运算符文本使用运算符独占色',
    exampleTitle: '右侧中部标记',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), MR(·)), MM(7))\n)',
    exampleNote: '圆点与 6 同高，但贴右侧。',
    practiceTask: '在 6 的右侧中部补一个标记。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), MR(·)), MM(7))\n)',
    practiceHint: '`MR(·)` 放在 CELL 内。',
  }),
  createPositionPage({
    slug: 'lb',
    name: 'LB',
    title: 'LB · 左下角文字',
    purpose: 'LB 把文字放在当前单元格的左下角。它适合在数字下方靠左放小号注释或辅助标记。',
    anchor: '锚点是单元格的左下角：水平左对齐、垂直下对齐。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；运算符文本使用运算符独占色',
    exampleTitle: '左下角标记',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), LB(·)), MM(7))\n)',
    exampleNote: '圆点落在 6 的左下角。',
    practiceTask: '在 6 的左下角补一个标记。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), LB(·)), MM(7))\n)',
    practiceHint: '`LB(·)` 与数字共享一个 CELL 才能落在同一格。',
  }),
  createPositionPage({
    slug: 'mb',
    name: 'MB',
    title: 'MB · 中下文字',
    purpose: 'MB 把文字放在当前单元格的下边缘中央。它适合在数字正下方放小号说明或步骤标记。',
    anchor: '锚点是单元格的中下位置：水平居中、垂直下对齐。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；运算符文本使用运算符独占色',
    exampleTitle: '下方中央标记',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(6), MB(·)), MM(7))\n)',
    exampleNote: '圆点落在 6 的正下方中央。',
    practiceTask: '在 6 的正下方中央补一个标记。',
    starter: 'GRID(\n  ROW(MM(5), CELL(MM(6)), MM(7))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), MB(·)), MM(7))\n)',
    practiceHint: '`MB(·)` 放在 CELL 内，锚点会自动靠下居中。',
  }),
  createPositionPage({
    slug: 'rb',
    name: 'RB',
    title: 'RB · 右下角文字',
    purpose: 'RB 把文字放在当前单元格的右下角。竖式加法中，它约定用来表示进位标记；自动配色会使用独立的进位色板。',
    anchor: '锚点是单元格的右下角：水平右对齐、垂直下对齐。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '自动配色把它当作进位标记，按行取进位色；即使文本不是数字，也按 RB 的约定着色',
    exampleTitle: '完整加法中的进位点',
    exampleCode: 'GRID(\n  ROW(MM(3), MM(5), MM(6)),\n  ROW(MM(+), CELL(MM(2), RB(1)), CELL(MM(7), RB(1)), MM(8)),\n  LINE,\n  ROW(MM(6), MM(3), MM(4))\n)',
    exampleNote: '2 与 7 的右下角各有一个 1，表示从个位、十位进上来的进位。',
    practiceTask: '给第二格的 6 右下角补一个进位点 1。',
    starter: 'GRID(\n  ROW(MM(5), MM(6))\n)',
    answer: 'GRID(\n  ROW(MM(5), CELL(MM(6), RB(1)))\n)',
    practiceHint: '进位点必须与数字同格；方括号写法是 `[6, RB(1)]`。',
    extraTips: [
      'RB 只负责位置与配色约定，不会自动计算进位数值。',
    ],
    related: [
      { title: 'CELL · 单元格', text: '进位点与数字同格的组合边界。', to: '/macro-rules/cell' },
      { title: '方括号 []', text: '`[6, RB(1)]` 的短写形式。', to: '/macro-rules/cell-shorthand' },
      { title: 'MT · 中上文字', text: '减法借位点的对应位置。', to: '/macro-rules/mt' },
    ],
  }),
  createPositionPage({
    slug: 'rbl',
    name: 'RBL',
    title: 'RBL · 右边界文字',
    purpose: 'RBL 把文字放在当前单元格右侧边框中点的位置，用于附属小数点等贴着数字右边缘的标记。DOT 就是 RBL(.) 的简写。',
    anchor: '锚点不是九宫格，而是 `edgeMidpoint` 的右边界：列索引、行索引与跨度取自当前 CELL，文字在右侧边框中垂直居中。',
    defaultRatio: '未显式设置 `fontSizeRatio` 时使用 0.42 的教学字号',
    colorRole: '默认取所在行的普通文字色；DOT 简写例外，它始终使用小数点独占色',
    exampleTitle: '数字旁的小数点',
    exampleCode: 'GRID(\n  ROW(MM(5), CELL(MM(7), RBL(.)))\n)',
    exampleNote: '小数点贴在 7 的右边界中点，不占用新的列，也不改变行高。',
    practiceTask: '给 7 的右边界补一个小数点。',
    starter: 'GRID(\n  ROW(MM(7))\n)',
    answer: 'GRID(\n  ROW(CELL(MM(7), RBL(.)))\n)',
    practiceHint: '通常直接写 `DOT` 更短：`CELL(MM(7), DOT)`。',
    extraTips: [
      'RBL 的文字仍然是一个普通文本图元，不参与网格轨道尺寸计算。',
      '小数点建议使用 DOT，以便自动配色始终选中小数点专用颜色。',
    ],
    related: [
      { title: 'DOT · 小数点', text: 'RBL(.) 的零参数简写。', to: '/macro-rules/dot' },
      { title: 'MM · 中心文字', text: '九宫格的中心锚点。', to: '/macro-rules/mm' },
      { title: 'CELL · 单元格', text: 'RBL 必须与左侧数字同格。', to: '/macro-rules/cell' },
    ],
  }),
]
