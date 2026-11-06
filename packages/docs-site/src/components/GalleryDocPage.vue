<script setup lang="ts">
import { computed } from 'vue'
import { galleryPageByOperation, type GalleryOperation } from '@u1in/shushi-docs/gallery'
import { shushiCore } from '@u1in/shushi-core'
import GalleryNamingMap from './GalleryNamingMap.vue'
import type { GridScene } from '@u1in/shushi-core'

const props = defineProps<{ operation: GalleryOperation }>()
const page = computed(() => galleryPageByOperation.get(props.operation))
const scenario = computed<GridScene>(() => {
  switch (props.operation) {
    // 图例页采用紧凑的展示尺寸，保证左栏在常见桌面高度内能同时容纳画布和全部开关。
    case 'addition': return shushiCore({ operation: 'addition', values: ['356', '278'], settings: { cellWidth: 60, rowHeight: 64, fontSizeRatio: 0.8, showGuideGrid: true, showCarrySteps: true } }).scene
    case 'subtraction': return shushiCore({ operation: 'subtraction', operands: ['502', '137'], settings: { cellWidth: 60, rowHeight: 64, fontSizeRatio: 0.8, showGuideGrid: true, showBorrowSteps: true } }).scene
    case 'multiplication': return shushiCore({ operation: 'multiplication', operands: ['97', '89'], settings: { cellWidth: 60, rowHeight: 64, fontSizeRatio: 0.8, showGuideGrid: true, uniformMultiplicationBars: false, showCarrySteps: true } }).scene
    case 'division': return shushiCore({ operation: 'division', divisor: '25', dividend: '10230', calculation: { maxDecimalDigits: 24 }, settings: { cellWidth: 44, rowHeight: 42, fontSizeRatio: 0.82, bracketBend: 1, showGuideGrid: true, uniformSubtractionBars: false, showZeroQuotientSteps: false } }).scene
    case 'short-division': return shushiCore({ operation: 'shortDivision', mode: 'baseConversion', values: ['13'], targetBase: 2, settings: { cellWidth: 44, rowHeight: 48, fontSizeRatio: 0.82, showGuideGrid: true, showRemainders: true } }).scene
  }
})
</script>

<template>
  <article v-if="page" class="docs-gallery-page">
    <div class="docs-gallery-layout">
      <aside class="docs-gallery-sticky"><GalleryNamingMap :scene="scenario" :items="page.items" /></aside>
      <div class="docs-gallery-content">
        <p class="docs-gallery-eyebrow">{{ page.eyebrow }}</p>
        <h1>{{ page.title }}</h1>
        <p class="docs-gallery-intro">{{ page.intro }}</p>
        <p class="docs-gallery-sample">示例：<code>{{ page.sample }}</code></p>

        <section class="docs-gallery-section">
          <h2>图例说明</h2>
          <p>下面的名称、语义 token 和来源类型来自 <code>@u1in/shushi-docs</code>。左侧交互图谱与此表使用同一份数据。</p>
      <div class="docs-gallery-table-wrap">
        <table>
          <thead><tr><th>编号</th><th>名称</th><th>说明</th><th>语义 token</th><th>来源</th></tr></thead>
          <tbody>
            <tr v-for="item in page.items" :key="item.key">
              <td><code>{{ item.key }}</code></td>
              <td><strong>{{ item.name }}</strong></td>
              <td>{{ item.description }}</td>
              <td><code>{{ item.token }}</code></td>
              <td><code>{{ item.source }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
        </section>
        <!-- 滚动内容末尾预留空白，避免表格最后一行贴住滚动容器底部。 -->
        <div class="docs-gallery-scroll-spacer" aria-hidden="true"></div>
      </div>
    </div>
  </article>
</template>

<style>
.docs-gallery-page {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  margin-top: 0;
  overflow: hidden;
}
.vp-page:has(.docs-gallery-page) { padding-top: 0; padding-bottom: 0; overflow: hidden; }
.vp-page:has(.docs-gallery-page) [vp-content] {
  max-width: none;
  height: 100vh;
  box-sizing: border-box;
  padding-top: var(--navbar-height);
  padding-bottom: 0;
  overflow: hidden;
}
.vp-page:has(.docs-gallery-page) #content { max-width: none; height: 100%; }
/* 图例页面自身已经提供了完整目录，底部不再重复显示编辑入口和相邻页面导航。 */
.vp-page:has(.docs-gallery-page) .vp-page-meta,
.vp-page:has(.docs-gallery-page) .vp-page-nav { display: none; }
/* 左侧交互图不是正文锚点，清除 VuePress 标题跳转补偿；右侧正文保留原有布局。 */
.vp-page:has(.docs-gallery-page) aside.docs-gallery-sticky h1,
.vp-page:has(.docs-gallery-page) aside.docs-gallery-sticky h2,
.vp-page:has(.docs-gallery-page) aside.docs-gallery-sticky h3,
.vp-page:has(.docs-gallery-page) aside.docs-gallery-sticky h4,
.vp-page:has(.docs-gallery-page) aside.docs-gallery-sticky h5,
.vp-page:has(.docs-gallery-page) aside.docs-gallery-sticky h6 { padding-top: 0 !important; }
/* 正文标题不需要 VuePress 为锚点额外预留 header-offset，避免图例标题上方出现大块空白。 */
.vp-page:has(.docs-gallery-page) [vp-content] .docs-gallery-content h1,
.vp-page:has(.docs-gallery-page) [vp-content] .docs-gallery-content h2,
.vp-page:has(.docs-gallery-page) [vp-content] .docs-gallery-content h3,
.vp-page:has(.docs-gallery-page) [vp-content] .docs-gallery-content h4,
.vp-page:has(.docs-gallery-page) [vp-content] .docs-gallery-content h5,
.vp-page:has(.docs-gallery-page) [vp-content] .docs-gallery-content h6 {
  margin-top: .5rem;
  margin-bottom: 0;
  padding-top: 0 !important;
}
.docs-gallery-layout { display: grid; grid-template-columns: minmax(520px, .95fr) minmax(0, 1.65fr); gap: 1.5rem; height: 100%; min-height: 0; align-items: start; }
/* 让左侧交互式图例与页面的水平留白保持一致，避免贴住导航栏。 */
.docs-gallery-sticky { position: sticky; top: 0; align-self: start; height: 100%; margin-top: 2rem; overflow: visible; }
.docs-gallery-content { box-sizing: border-box; min-width: 0; min-height: 0; height: 100%; overflow-x: hidden; overflow-y: auto; padding-right: .75rem; }
.docs-gallery-scroll-spacer { height: 4rem; flex: none; }
.docs-gallery-eyebrow { color: var(--vp-c-accent); font-size: .78rem; font-weight: 800; letter-spacing: .08em; }
.docs-gallery-intro { color: var(--vp-c-text-2); font-size: 1.05rem; }
.docs-gallery-section { margin-top: 2.25rem; }
.docs-gallery-section p, .docs-gallery-sample, .docs-gallery-table-wrap { font-size: .88rem; line-height: 1.7; }
.docs-gallery-table-wrap { overflow-x: auto; border: 1px solid var(--vp-c-divider); border-radius: .75rem; margin-top: 1rem; }
.docs-gallery-table-wrap table { display: table; width: 100%; min-width: 760px; margin: 0; border-collapse: separate; border-spacing: 0; font-size: .84rem; line-height: 1.65; }
.docs-gallery-table-wrap th, .docs-gallery-table-wrap td { border: 0; padding: 10px 13px; border-bottom: 1px solid var(--vp-c-divider); text-align: left; vertical-align: top; }
.docs-gallery-table-wrap tbody tr { background: transparent; }
.docs-gallery-table-wrap th { color: var(--vp-c-text-2); background: color-mix(in srgb, var(--vp-c-accent) 8%, transparent); font-size: .72rem; font-weight: 800; letter-spacing: .04em; white-space: nowrap; }
.docs-gallery-table-wrap th + th, .docs-gallery-table-wrap td + td { border-left: 1px solid var(--vp-c-divider); }
.docs-gallery-table-wrap tr:last-child td { border-bottom: 0; }
html[data-theme='dark'] .docs-gallery-table-wrap th { background: color-mix(in srgb, var(--vp-c-accent) 16%, transparent); }
@media (max-width: 980px) {
  .vp-page:has(.docs-gallery-page) { overflow: visible; }
  .vp-page:has(.docs-gallery-page) [vp-content] { height: auto; padding-top: var(--navbar-height); overflow: visible; }
  .vp-page:has(.docs-gallery-page) #content { height: auto; }
  .docs-gallery-page { height: auto; min-height: calc(100vh - var(--navbar-height)); overflow: visible; }
  .docs-gallery-layout { grid-template-columns: 1fr; height: auto; }
  .docs-gallery-sticky { position: static; height: auto; margin-top: 0; }
  .docs-gallery-content { height: auto; overflow: visible; padding-right: 0; }
}
</style>
