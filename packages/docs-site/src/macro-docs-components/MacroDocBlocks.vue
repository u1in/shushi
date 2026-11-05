<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { DocBlock } from '@u1in/shushi-docs/macro/types'
import DocText from './DocText.vue'
import MacroCodeBlock from './MacroCodeBlock.vue'
import MacroCompare from './MacroCompare.vue'
import MacroExampleCard from './MacroExampleCard.vue'

/** 文档块渲染器：把纯数据块分派到对应的展示组件。 */
const props = withDefaults(defineProps<{
  blocks: DocBlock[]
  /** VuePress 等外部文档站的内部链接前缀；主应用保留原有绝对路径。 */
  linkPrefix?: string
  /** 文档站可按新的阅读目录把旧宏路由映射到分组页锚点。 */
  linkResolver?: (path: string) => string
}>(), {
  linkPrefix: '',
  linkResolver: undefined,
})

/** 把旧的宏文档路由映射到发布站点的集中式入口。 */
const resolveDocLink = (path: string): string => {
  if (props.linkResolver) return props.linkResolver(path)
  if (!props.linkPrefix) return path
  const slug = path.replace(/^\/macro-(?:rules|api)\/?/, '')
  return `${props.linkPrefix}${slug}`.replace(/\/$/, '') || props.linkPrefix
}

/** 九宫格顺序固定为从左到右、从上到下。 */
const positions = [
  { macro: 'LT', label: '左上' }, { macro: 'MT', label: '中上' }, { macro: 'RT', label: '右上' },
  { macro: 'ML', label: '左中' }, { macro: 'MM', label: '居中' }, { macro: 'MR', label: '右中' },
  { macro: 'LB', label: '左下' }, { macro: 'MB', label: '中下' }, { macro: 'RB', label: '右下' },
]

const borderEdgeLabels = {
  top: '上边框',
  right: '右边框',
  bottom: '下边框',
  left: '左边框',
} as const
</script>

<template>
  <template v-for="(block, blockIndex) in props.blocks" :key="blockIndex">
    <p v-if="block.type === 'paragraph'" class="mdocs-p">
      <DocText :text="block.text" />
    </p>

    <component
      :is="block.ordered ? 'ol' : 'ul'"
      v-else-if="block.type === 'list'"
      class="mdocs-list"
      :class="{ 'mdocs-list--ordered': block.ordered }"
    >
      <li v-for="(item, index) in block.items" :key="index"><DocText :text="item" /></li>
    </component>

    <figure v-else-if="block.type === 'table'" class="mdocs-table-figure">
      <div class="mdocs-table-wrap">
        <table>
          <thead>
            <tr><th v-for="column in block.columns" :key="column">{{ column }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex"><DocText :text="cell" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
    </figure>

    <MacroCodeBlock v-else-if="block.type === 'code'" :code="block.code" :title="block.title" :language="block.language" />

    <MacroExampleCard
      v-else-if="block.type === 'example'"
      :title="block.title"
      :code="block.code"
      :note="block.note"
      :language="block.language"
    />

    <aside
      v-else-if="block.type === 'callout'"
      class="mdocs-callout"
      :class="`mdocs-callout--${block.tone}`"
    >
      <strong>{{ block.title }}</strong>
      <p><DocText :text="block.text" /></p>
    </aside>

    <MacroCompare
      v-else-if="block.type === 'compare'"
      :left-title="block.leftTitle"
      :left-code="block.leftCode"
      :right-title="block.rightTitle"
      :right-code="block.rightCode"
      :note="block.note"
      :equivalent="block.equivalent"
    />

    <ol v-else-if="block.type === 'steps'" class="mdocs-steps">
      <li v-for="(item, index) in block.items" :key="item.title">
        <span class="mdocs-step-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <strong>{{ item.title }}</strong>
          <p><DocText :text="item.text" /></p>
        </div>
      </li>
    </ol>

    <div v-else-if="block.type === 'cards'" class="mdocs-cards">
      <template v-for="item in block.items" :key="item.title">
        <RouterLink v-if="item.to" :to="resolveDocLink(item.to)" class="mdocs-card">
          <strong>{{ item.title }}</strong>
          <span>{{ item.text }}</span>
          <small>继续阅读 →</small>
        </RouterLink>
        <div v-else class="mdocs-card">
          <strong>{{ item.title }}</strong>
          <span>{{ item.text }}</span>
        </div>
      </template>
    </div>

    <div v-else-if="block.type === 'position-board'" class="mdocs-board-block">
      <div class="mdocs-position-board" aria-label="九宫格定位宏位置">
        <div
          v-for="position in positions"
          :key="position.macro"
          class="mdocs-position-cell"
          :class="{ 'is-active': block.active === position.macro }"
        >
          <code>{{ position.macro }}</code>
          <span>{{ position.label }}</span>
        </div>
      </div>
      <p v-if="block.note" class="mdocs-board-note"><DocText :text="block.note" /></p>
    </div>

    <div v-else-if="block.type === 'bracket-board'" class="mdocs-board-block">
      <div class="mdocs-bracket-board" role="img" aria-label="BRACKET 厂字弯与厂字横示意">
        <div class="mdocs-bracket-scene">
          <div class="mdocs-bracket-divisor">
            <span>25</span>
            <small>除数</small>
          </div>
          <div class="mdocs-bracket-slot" aria-hidden="true"></div>
          <div class="mdocs-bracket-dividend">
            <span>1</span><span>0</span><span>2</span><span>3</span><span>0</span>
            <small>被除数</small>
          </div>

          <span class="mdocs-bracket-head" aria-hidden="true"></span>
          <span class="mdocs-bracket-corner" aria-hidden="true"></span>

          <span class="mdocs-bracket-label"><code>BRACKET</code></span>
          <span class="mdocs-bracket-size">0.5u</span>
          <span class="mdocs-bracket-head-label">厂字横</span>
        </div>
      </div>
      <p v-if="block.note" class="mdocs-board-note"><DocText :text="block.note" /></p>
    </div>

    <div v-else-if="block.type === 'border-board'" class="mdocs-board-block">
      <div class="mdocs-border-board" role="img" :aria-label="`${block.macro} 是当前单元格的${borderEdgeLabels[block.edge]}线`">
        <div class="mdocs-border-cell">
          <span class="mdocs-border-line mdocs-border-line--top" :class="{ 'is-active': block.edge === 'top' }"></span>
          <span class="mdocs-border-line mdocs-border-line--right" :class="{ 'is-active': block.edge === 'right' }"></span>
          <span class="mdocs-border-line mdocs-border-line--bottom" :class="{ 'is-active': block.edge === 'bottom' }"></span>
          <span class="mdocs-border-line mdocs-border-line--left" :class="{ 'is-active': block.edge === 'left' }"></span>

          <span class="mdocs-border-center">
            <span>CELL</span>
            <small>当前单元格</small>
          </span>

          <span class="mdocs-border-label" :class="`mdocs-border-label--${block.edge}`">
            <span class="mdocs-border-swatch" aria-hidden="true"></span>
            <code>{{ block.macro }}</code>
          </span>
        </div>
      </div>
      <p v-if="block.note" class="mdocs-board-note"><DocText :text="block.note" /></p>
    </div>

    <div v-else-if="block.type === 'edge-text-board'" class="mdocs-board-block">
      <div class="mdocs-edge-text-board" role="img" aria-label="RBL 位于当前单元格右侧边框中点">
        <div class="mdocs-edge-text-cell">
          <span class="mdocs-edge-text-value">7</span>
          <span class="mdocs-edge-text-edge"></span>
          <span class="mdocs-edge-text-marker">.</span>
        </div>
      </div>
      <p v-if="block.note" class="mdocs-board-note"><DocText :text="block.note" /></p>
    </div>
  </template>
</template>
