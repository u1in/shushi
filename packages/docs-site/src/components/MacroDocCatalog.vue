<script setup lang="ts">
import { computed } from 'vue'
import { macroDocPageBySlug, macroDocNavGroups, type DocGroupId } from '@u1in/shushi-docs/macro'
import MacroDocBlocks from '../macro-docs-components/MacroDocBlocks.vue'

/**
 * 把集中式宏文档内容清单嵌入 VuePress。
 * 站点负责分区、发布和展示，宏命令示例与图例仍由 docs 包统一维护并测试。
 */
const props = defineProps<{
  area: 'macro' | 'technical'
  /** 只展示指定阅读章节，避免把全部宏命令挤在一个超长页面中。 */
  groups?: string
  /** 单页模式：只渲染一个宏或 API 页面，供 VuePress 逐页发布。 */
  slug?: string
}>()
const apiGroups: DocGroupId[] = ['api']
const requestedGroups = computed(
  () =>
    props.groups
      ?.split(',')
      .map((group) => group.trim())
      .filter(Boolean) as DocGroupId[] | undefined,
)

const visibleGroups = computed(() =>
  macroDocNavGroups.filter(({ id }) => {
    if (requestedGroups.value) return requestedGroups.value.includes(id)
    return props.area === 'technical' ? apiGroups.includes(id) : !apiGroups.includes(id)
  }),
)

const singlePage = computed(() => (props.slug ? macroDocPageBySlug.get(props.slug) : undefined))

const pageRoutes: Record<string, string> = {
  intro: '/macro/语法基础',
  syntax: '/macro/语法基础',
  compileMacro: '/technical/api/compileMacro',
  parseMacro: '/technical/api/parseMacro',
  completeMacro: '/technical/api/completeMacro',
  unformatMacro: '/technical/api/unformatMacro',
  computeCompositeArithmetic: '/technical/api/computeCompositeArithmetic',
  shushi: '/technical/api/shushi',
  shushiCore: '/technical/api/shushiCore',
  createCompositeArithmeticMacroSource: '/technical/api/createCompositeArithmeticMacroSource',
  getCompositeArithmeticStepCount: '/technical/api/getCompositeArithmeticStepCount',
  formatMacro: '/technical/api/formatMacro',
  minifyMacro: '/technical/api/minifyMacro',
  minifyMacroAst: '/technical/api/minifyMacroAst',
  minifyMacroForCopy: '/technical/api/minifyMacroForCopy',
  minifyMacroForCopyAst: '/technical/api/minifyMacroForCopyAst',
  createMacroAstInspection: '/technical/api/createMacroAstInspection',
  renderSvgGrid: '/technical/api/renderSvgGrid',
  renderSvgString: '/technical/api/renderSvgString',
  renderDomGrid: '/technical/api/renderDomGrid',
  GridScene: '/technical/api/GridScene',
  resolveGridMetrics: '/technical/api/resolveGridMetrics',
  extractVisibleTextRows: '/technical/api/extractVisibleTextRows',
  grid: '/macro/basic/GRID',
  row: '/macro/basic/ROW',
  cell: '/macro/basic/CELL',
  empty: '/macro/basic/EMPTY',
  line: '/macro/basic/LINE',
  div: '/macro/basic/DIV',
  value: '/macro/basic/VALUE',
  style: '/macro/basic/STYLE',
  kv: '/macro/basic/KV',
  lt: '/macro/orientation/LT',
  mt: '/macro/orientation/MT',
  mtd: '/macro/orientation/MTD',
  rt: '/macro/orientation/RT',
  ml: '/macro/orientation/ML',
  mm: '/macro/orientation/MM',
  mr: '/macro/orientation/MR',
  lb: '/macro/orientation/LB',
  mb: '/macro/orientation/MB',
  rb: '/macro/orientation/RB',
  rbl: '/macro/orientation/RBL',
  dot: '/macro/symbol/DOT',
  bracket: '/macro/symbol/BRACKET',
  square: '/macro/symbol/SQUARE',
  triangle: '/macro/symbol/TRIANGLE',
  round: '/macro/symbol/ROUND',
  tbd: '/macro/symbol/TBD',
  rbd: '/macro/symbol/RBD',
  bbd: '/macro/symbol/BBD',
  lbd: '/macro/symbol/LBD',
  'row-shorthand': '/macro/sugar/顶层分号行',
  'cell-shorthand': '/macro/sugar/方括号CELL简写',
  'zero-argument': '/macro/sugar/零参数省略',
  examples: '/macro/录入示例',
  cautions: '/macro/注意事项',
}

/** 把宏包原有的运行时路由映射为新的分组页锚点，避免卡片链接落到旧入口。 */
const resolveLink = (path: string): string => {
  const technical = path.startsWith('/macro-api')
  const rawSlug = path.replace(/^\/macro-(?:rules|api)\/?/, '')
  const slug = rawSlug || (technical ? 'shushi' : 'intro')
  const page = macroDocPageBySlug.get(slug)
  if (!page) return technical ? '/technical/api/shushi' : '/macro/语法基础'
  return pageRoutes[page.slug] ?? (technical ? `/technical/api/${page.slug}` : '/macro/语法基础')
}

/** 用户手册只保留可直接阅读的示例；旧版交互练习不进入 VuePress 页面。 */
const visibleSections = (page: (typeof macroDocNavGroups)[number]['pages'][number]) => {
  const rank = (id: string): number => {
    if (id === 'purpose') return 1
    if (['position', 'behavior', 'style', 'layout'].includes(id)) return 2
    if (['options', 'rules', 'scope', 'typing', 'aliases', 'zero-argument', 'formatting', 'when-not'].includes(id))
      return 3
    if (id === 'signature') return 4
    if (id === 'examples') return 5
    if (id === 'errors') return 6
    return 7
  }
  return [...page.sections]
    .filter(({ id }) => id !== 'practice' && id !== 'related')
    .sort((left, right) => rank(left.id) - rank(right.id))
}

/** 单页模式把数据层通用章节映射为面向读者的固定阅读顺序。 */
const sectionTitle = (section: { id: string; title: string }): string => {
  if (section.id === 'purpose') return '介绍：这是什么'
  if (section.id === 'position' || section.id === 'behavior' || section.id === 'style' || section.id === 'layout')
    return '特殊说明'
  if (
    ['options', 'rules', 'scope', 'typing', 'aliases', 'zero-argument', 'formatting', 'when-not'].includes(section.id)
  )
    return '使用方式'
  if (section.id === 'signature') return '函数签名和参数说明'
  if (section.id === 'examples') return '完整示例'
  if (section.id === 'errors') return '注意事项'
  return section.title
}
</script>

<template>
  <article v-if="singlePage" class="docs-macro-single">
    <h1>{{ singlePage.title }}</h1>
    <p class="docs-macro-summary">{{ singlePage.summary }}</p>
    <section
      v-for="section in visibleSections(singlePage)"
      :id="`${singlePage.slug}-${section.id}`"
      :key="section.id"
      class="docs-macro-section"
    >
      <h2>{{ sectionTitle(section) }}</h2>
      <MacroDocBlocks :blocks="section.blocks" :link-resolver="resolveLink" />
    </section>
  </article>

  <div class="docs-macro-catalog">
    <template v-if="!singlePage">
      <section v-for="group in visibleGroups" :key="group.id" class="docs-macro-group">
        <h2 v-if="visibleGroups.length > 1" :id="group.id">{{ group.title }}</h2>
        <p v-if="visibleGroups.length > 1" class="docs-macro-group-description">{{ group.description }}</p>

        <article v-for="page in group.pages" :id="page.slug" :key="page.slug" class="docs-macro-page">
          <h3>{{ page.title }}</h3>
          <p class="docs-macro-summary">{{ page.summary }}</p>
          <section
            v-for="section in visibleSections(page)"
            :id="`${page.slug}-${section.id}`"
            :key="section.id"
            class="docs-macro-section"
          >
            <h4>{{ sectionTitle(section) }}</h4>
            <MacroDocBlocks :blocks="section.blocks" :link-resolver="resolveLink" />
          </section>
        </article>
      </section>
    </template>
  </div>
</template>

<style>
.docs-macro-catalog {
  margin-top: 1.5rem;
}
.docs-macro-single {
  margin-top: 1rem;
}
.docs-macro-single h1 {
  margin-bottom: 0.75rem;
  color: var(--vp-c-text-1);
}
.docs-macro-single > .docs-macro-summary {
  max-width: 52rem;
}
.docs-macro-group + .docs-macro-group {
  margin-top: 4rem;
}
.docs-macro-group-description {
  color: var(--vp-c-text-2);
}
.docs-macro-page {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  counter-reset: macro-section;
}
.docs-macro-page h3 {
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-size: 1.45rem;
}
.docs-macro-summary {
  color: var(--vp-c-text-2);
}
.docs-macro-section {
  margin-top: 1.75rem;
}
/* 只给章节自己的直接 h4 编号，避免把嵌套展示组件的标题误当成章节标题。 */
.docs-macro-section > h4 {
  display: flex;
  gap: 0.55rem;
  align-items: baseline;
  margin-bottom: 0.75rem;
  color: var(--vp-c-text-1);
  font-size: 1.05rem;
}
.docs-macro-section > h4::before {
  counter-increment: macro-section;
  content: counter(macro-section, decimal-leading-zero);
  color: var(--vp-c-accent);
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  font-weight: 800;
}
</style>
