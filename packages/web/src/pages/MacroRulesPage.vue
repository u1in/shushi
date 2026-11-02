<script setup lang="ts">
import { compileMacro } from '@vertical-arithmetic/macro'
import GridPreview from '../components/GridPreview.vue'

/** 基础录入只展示结构宏与配置；定位文本宏留到语法糖章节再引入。 */
const basicStructureSource = [
  'GRID(',
  '  KV(columns, 2),',
  '  ROW(EMPTY(), EMPTY()),',
  '  LINE(),',
  '  ROW(EMPTY(), EMPTY())',
  ')',
].join('\n')

/** 命名调用版与语法糖版呈现相同的数字行和横线结构。 */
const expandedCallSource = [
  'GRID(',
  '  ROW(MM(5), MM(6)),',
  '  ROW(MM(×), CELL(MM(5), RB(1)), MM(6)),',
  '  LINE(),',
  '  ROW(MM(6), MM(3), MM(4))',
  ')',
].join('\n')

const shorthandSource = '5,6;×,[5,RB(1)],6;LN;6,3,4;'
const expandedCallScene = compileMacro(expandedCallSource)

interface BasicCommand {
  name: string
  signature: string
  properties: string[]
  rules: string
  caution: string
  example: string
  /** 九宫格定位宏额外提供可视位置板，避免仅从缩写猜测锚点。 */
  positions?: Array<{ macro: string, label: string }>
}

const positionMacros = [
  { macro: 'LT', label: '左上' }, { macro: 'MT', label: '中上' }, { macro: 'RT', label: '右上' },
  { macro: 'ML', label: '左中' }, { macro: 'MM', label: '居中' }, { macro: 'MR', label: '右中' },
  { macro: 'LB', label: '左下' }, { macro: 'MB', label: '中下' }, { macro: 'RB', label: '右下' },
]

const basicCommands: BasicCommand[] = [
  {
    name: 'GRID',
    signature: 'GRID(...children)',
    properties: ['子项：ROW、LINE、KV。', '常用 KV：columns、unitWidth、unitHeight、padding / paddingX / paddingY、fontSizeRatio / fontSize、showGrid、autoColor、style、ariaLabel。'],
    rules: '省略 columns 时按最长 ROW 推导；显式 columns 不能小于实际所需列数。',
    caution: 'autoColor 默认开启且最多支持 40 条 ROW；开启时线条的显式颜色和粗细不会生效。',
    example: 'GRID(KV(columns, 4), ROW(EMPTY()))',
  },
  {
    name: 'ROW',
    signature: 'ROW(...cells, ...options)',
    properties: ['单元格：CELL、EMPTY 或单个定位宏 / DOT。', 'KV(align, left | right)，默认 right。'],
    rules: '至少包含一个单元格；短行会按 align 与场景列宽对齐。',
    caution: 'ROW 只接收单元格内容，LINE、STYLE、任意裸文本都不能直接放入。',
    example: 'ROW(EMPTY(), EMPTY(), KV(align, right))',
  },
  {
    name: 'CELL',
    signature: 'CELL(...elements, ...options)',
    properties: ['图元：定位文本、DOT、边框或 BRACKET。', 'KV(columnSpan, 正整数)、KV(style, token)。'],
    rules: '它是多个图元共用同一格的唯一组合边界。',
    caution: 'BRACKET 必须独占 CELL，且 columnSpan 只能为 1。',
    example: 'CELL(KV(columnSpan, 1), KV(style, macro.input))',
  },
  {
    name: 'EMPTY · EP',
    signature: 'EMPTY(...options) · EP(...options)',
    properties: ['KV(columnSpan, 正整数)、KV(style, token)。'],
    rules: '占用列而不产生可见图元。',
    caution: '不能包含 MM、DOT 或任何边框等内容。',
    example: 'EMPTY(KV(columnSpan, 2))',
  },
  {
    name: 'LINE · LN',
    signature: 'LINE(STYLE(...), ...options) · LN(STYLE(...), ...options)',
    properties: ['可选 STYLE：color、thickness。', 'KV(span, previous | longest | full)、KV(style, token)。'],
    rules: '始终附着于上一条 ROW 的下边缘，不创建额外行高。',
    caution: '前面必须已经有 ROW；默认 span 是 previous。',
    example: 'LINE(STYLE(KV(thickness, 2)), KV(span, previous))',
  },
  {
    name: 'STYLE',
    signature: 'STYLE(...options)',
    properties: ['KV(color, 色值)、KV(thickness, 正数)。'],
    rules: '仅由 LINE 与单元格边框读取，是跨 DOM/SVG 的受限样式声明。',
    caution: '不能放入普通 ROW；除 color 和 thickness 外的属性都会报错。',
    example: 'STYLE(KV(color, "#6d83ae"), KV(thickness, 2))',
  },
  {
    name: 'KV',
    signature: 'KV(key, value)',
    properties: ['每个调用必须恰有一个键和一个值。', '可被 GRID、ROW、CELL、EMPTY、LINE、STYLE 等各自读取。'],
    rules: '同一作用域中的重复 key 会报错。',
    caution: '键的可用范围取决于宿主宏；应只写该宏已支持的属性。',
    example: 'KV(showGrid, true)',
  },
  {
    name: 'LT / MT / RT · ML / MM / MR · LB / MB / RB',
    signature: '定位宏(text, ...options)',
    properties: ['九个宏分别放置到单元格的左/中/右 × 上/中/下。', 'KV(style, token)、KV(fontSizeRatio, 正数)。'],
    rules: '每个定位宏恰好接收一个文字参数；MM 保持正常字号，其余八个默认使用 0.42 教学字号。',
    caution: '它们只能作为 ROW 的单元格内容或 CELL 内图元；数字与进位叠放时必须使用 CELL。',
    example: 'CELL(MM(6), RB(1))',
    positions: [
      ...positionMacros,
    ],
  },
]

/** 四个边框宏共用一套样式参数，但各自绑定不同的单元格边。 */
const borderMacros = [
  { name: 'TBD', edge: '上边', example: 'CELL(MM(8), TBD())' },
  { name: 'RBD', edge: '右边', example: 'CELL(MM(8), RBD())' },
  { name: 'BBD', edge: '下边', example: 'CELL(MM(8), BBD())' },
  { name: 'LBD', edge: '左边', example: 'CELL(MM(8), LBD())' },
]

/** RBL 与四个边框宏都依附真实单元格边界，因此在同一板块说明。 */
const edgeTextMacro = { name: 'RBL', edge: '右侧文字', example: 'CELL(MM(7), RBL(.))' }
</script>

<template>
  <main class="macro-rules-page">
    <RouterLink to="/" class="macro-rules-back">← 返回首页</RouterLink>
    <header class="macro-rules-header">
      <p class="eyebrow">GRID MACRO · ENTRY RULES</p>
      <h1>网格宏录入规则</h1>
      <p>从完整命令开始理解结构与配置；确认布局后，再使用分号、中心文字与方括号简写压缩源码。</p>
    </header>

    <div class="macro-rules-layout">
      <aside class="macro-rules-sidebar">
        <nav class="macro-rules-toc" aria-label="宏规则页面目录">
          <p>ON THIS PAGE</p>
          <ol>
            <li><a href="#entry-basics">01 · 基础录入规则</a></li>
            <li><a href="#basic-commands">02 · 基础宏命令</a></li>
            <li><a href="#syntax-sugar">03 · 语法糖</a></li>
            <li><a href="#examples">04 · 例子对照</a></li>
            <li><a href="#cautions">05 · 注意事项</a></li>
          </ol>
        </nav>
      </aside>

      <div class="macro-rules-content">
        <section id="entry-basics" class="macro-rules-card macro-rules-section">
          <p class="macro-section-kicker">01 · FOUNDATION</p>
          <h2>基础录入规则：先写完整宏命令</h2>
          <p class="macro-card-copy">基础阶段只使用结构宏、圆括号和逗号：先写 <code>GRID</code>，在其中依次写 <code>ROW</code>、<code>LINE()</code> 与配置 <code>KV</code>。以下示例没有使用定位文本宏、分号、方括号或零参数省略。</p>
          <div class="macro-code-block"><code>{{ basicStructureSource }}</code></div>
          <ol class="macro-rule-steps">
            <li><strong>逗号只分隔同一层参数。</strong>函数内的子项、配置与文字参数都以逗号分隔。</li>
            <li><strong>ROW 默认右对齐。</strong>编译器按最长 ROW 推导列数，短行会贴齐个位列。</li>
            <li><strong>CELL 决定同格组合。</strong>它定义一个真实单元格；后续可在其中放入定位文本、边框等图元。</li>
            <li><strong>LINE 绑定上一行。</strong>它是边缘图元，不是新的数字行。</li>
          </ol>
        </section>

        <section id="basic-commands" class="macro-rules-section">
          <div class="macro-section-heading">
            <div><p class="eyebrow">02 · BASE COMMANDS</p><h2>基础宏命令、属性与限制</h2></div>
          </div>
          <div class="macro-command-grid">
            <article v-for="command in basicCommands" :key="command.name" class="macro-rules-card macro-command-card">
              <header><h3><code>{{ command.name }}</code></h3><p>{{ command.signature }}</p></header>
              <dl>
                <div><dt>属性</dt><dd><ul><li v-for="property in command.properties" :key="property">{{ property }}</li></ul></dd></div>
                <div><dt>规则</dt><dd>{{ command.rules }}</dd></div>
                <div><dt>注意</dt><dd>{{ command.caution }}</dd></div>
              </dl>
              <div class="macro-inline-code"><code>{{ command.example }}</code></div>
            </article>
          </div>
          <div class="macro-position-reference">
            <div class="macro-border-heading"><h3>九宫格文本宏位置</h3><p>九个定位宏共用同一组文字与样式参数；图例中的位置就是它们在 CELL 内的锚点。</p></div>
            <div class="macro-position-board" aria-label="九宫格文本宏位置示意">
              <div v-for="position in positionMacros" :key="position.macro" class="macro-position-cell"><code>{{ position.macro }}</code><span>{{ position.label }}</span></div>
            </div>
            <p class="macro-position-reference-note"><code>MM</code> 居中并使用正常字号；其他定位宏默认使用 0.42 教学字号，可用 <code>KV(fontSizeRatio, 1)</code> 覆盖。</p>
          </div>
          <div class="macro-border-reference">
            <div class="macro-border-heading"><h3>单元格边界宏</h3><p><code>RBL</code> 使用单元格右侧边界放置文字；四个边框宏使用单元格边界画线。它们都只能放在 CELL 内。</p></div>
            <div class="macro-border-layout">
              <div class="macro-border-board" aria-label="单元格边界宏位置示意">
                <div class="macro-border-label macro-border-label--top"><code>TBD</code><span>上边</span></div>
                <div class="macro-border-label macro-border-label--right"><code>RBD</code><span>右边框</span><div class="macro-rbl-marker" aria-label="RBL 右侧基线锚点"><span class="macro-rbl-dot"></span><span class="macro-rbl-baseline" aria-hidden="true"></span><span class="macro-rbl-caption"><code>RBL</code><small>右侧基线</small></span></div></div>
                <div class="macro-border-label macro-border-label--bottom"><code>BBD</code><span>下边</span></div>
                <div class="macro-border-label macro-border-label--left"><code>LBD</code><span>左边</span></div>
                <div class="macro-border-center"><span>CELL</span><small>完整单元格</small></div>
              </div>
              <div class="macro-border-list">
                <article class="macro-edge-text-card"><h4><code>{{ edgeTextMacro.name }}</code><span>{{ edgeTextMacro.edge }}</span></h4><p>文字使用当前单元格右侧的 edgeMidpoint 行框位置，不改变网格轨道或行高；可追加 KV(style, token) 与 KV(fontSizeRatio, 正数)。</p><div class="macro-inline-code"><code>{{ edgeTextMacro.example }}</code></div></article>
                <article v-for="border in borderMacros" :key="border.name"><h4><code>{{ border.name }}</code><span>{{ border.edge }}</span></h4><p>可省略空括号；默认使用黑色 2px 线，autoColor 开启时使用主题线条。</p><div class="macro-inline-code"><code>{{ border.example }}</code></div></article>
              </div>
            </div>
          </div>
        </section>

        <section id="syntax-sugar" class="macro-rules-card macro-rules-section">
          <p class="macro-section-kicker">03 · SYNTAX SUGAR</p>
          <h2>语法糖：在结构稳定后缩短录入</h2>
          <p class="macro-card-copy">语法糖不会改变 GridScene 契约；它们只在解析阶段还原为上面的完整命令与通用图元。</p>
          <div class="macro-sugar-grid">
            <article><h3>分号行与中心文字</h3><p>仅顶层可用。每个普通分号段自动成为 ROW，裸文字自动补成 <code>MM(text)</code>，所以 <code>5, 6;</code> 等价于 <code>ROW(MM(5), MM(6))</code>。</p></article>
            <article><h3>方括号单元格 <code>[]</code></h3><p><code>[5, RB(1)]</code> 等价于 <code>CELL(MM(5), RB(1))</code>；仅第一项可省略 MM，后续定位宏必须完整写为 <code>RB(1)</code>。</p></article>
            <article><h3>零参数与短别名</h3><p><code>LN</code>、<code>EP</code>、<code>BK</code> 分别是 <code>LINE</code>、<code>EMPTY</code>、<code>BRACKET</code> 的别名；它们与四种边框宏都可省略空括号。</p></article>
          </div>
          <div class="macro-sugar-note">
            <p><code>DOT</code> 是宏命令 <code>RBL(.)</code> 的快捷写法。<code>BK</code>（<code>BRACKET</code>）生成厂字弯，独占一格且不能设置 columnSpan。<code>TBD / RBD / BBD / LBD</code> 只能放在 CELL 内，分别画上、右、下、左边。</p>
          </div>
        </section>

        <section id="examples" class="macro-rules-section">
          <div class="macro-section-heading">
            <div><p class="eyebrow">04 · REWRITE EXAMPLE</p><h2>将完整命令优化为快捷写法</h2></div>
            <RouterLink to="/" class="macro-rules-back">回到网格宏试验区录入 →</RouterLink>
          </div>
          <div class="macro-example-comparison">
            <article class="macro-rules-card"><h3>命名调用版</h3><div class="macro-code-block"><code>{{ expandedCallSource }}</code></div></article>
            <article class="macro-rules-card"><h3>语法糖版</h3><div class="macro-code-block"><code>{{ shorthandSource }}</code></div></article>
          </div>
          <div class="macro-preview-frame"><GridPreview :scene="expandedCallScene" mode="svg" /></div>
        </section>

        <section id="cautions" class="macro-rules-card macro-rules-section">
          <p class="macro-section-kicker">05 · CAUTIONS</p>
          <h2>录入前的注意事项</h2>
          <ul class="macro-caution-list">
            <li>含逗号、圆括号、双引号或方括号的普通文字必须使用双引号；反斜杠可转义引号与反斜杠。</li>
            <li>裸文字只在顶层分号行及方括号首项中自动补成 MM；<code>[5, 1]</code> 与 <code>[5, RB]</code> 都会报错。</li>
            <li>显式 GRID 的 columns 不足时会报错，不会截断内容；需要配置时不要使用只含语法糖的顶层简写。</li>
            <li>LN（LINE）必须在至少一个 ROW 之后；CELL 内的 BK（BRACKET）必须独占，EP（EMPTY）不能携带图元。</li>
            <li>autoColor 默认覆盖 LINE 与边框的可视颜色、线宽；如需精确 STYLE，写 KV(autoColor, false)。</li>
            <li>宏层只描述语义与网格结构，不应写入 DOM、CSS 类名、SVG 节点或像素坐标。</li>
          </ul>
        </section>
      </div>
    </div>
  </main>
</template>
