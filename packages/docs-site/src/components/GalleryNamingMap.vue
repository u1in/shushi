<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getGridElementRect, renderDomGrid, resolveGridMetrics, type GridElement, type GridScene } from '@u1in/shushi-core'
import type { GalleryItem } from '@u1in/shushi-docs/gallery'

type Bounds = { left: number, top: number, width: number, height: number }

const props = defineProps<{ scene: GridScene, items: GalleryItem[] }>()
const renderHost = ref<HTMLElement>()
const contentLayer = ref<HTMLElement>()
const highlightLayer = ref<HTMLElement>()
const selected = ref<Record<string, boolean>>({})
const metrics = computed(() => resolveGridMetrics(props.scene))
const allSelected = computed(() => props.items.every(({ key }) => selected.value[key]))
const someSelected = computed(() => props.items.some(({ key }) => selected.value[key]))

const expandBounds = (bounds: Bounds, padding = 5): Bounds => ({ left: bounds.left - padding, top: bounds.top - padding, width: bounds.width + padding * 2, height: bounds.height + padding * 2 })
const isTextToken = (element: GridElement, token: string): boolean => element.content.kind === 'text' && element.content.styleToken === token
const getElementBounds = (elements: GridElement[]): Bounds | null => {
  if (elements.length === 0) return null
  const rects = elements.map((element) => getGridElementRect(element, metrics.value))
  const left = Math.min(...rects.map((rect) => rect.left)); const top = Math.min(...rects.map((rect) => rect.top))
  const right = Math.max(...rects.map((rect) => rect.left + rect.width)); const bottom = Math.max(...rects.map((rect) => rect.top + rect.height))
  return { left, top, width: right - left, height: bottom - top }
}
const getLineBounds = (element: GridElement): Bounds => {
  const rect = getGridElementRect(element, metrics.value)
  const horizontal = element.position.kind === 'edge' && (element.position.edge === 'top' || element.position.edge === 'bottom')
  return horizontal ? { left: rect.left, top: rect.top - 1.5, width: rect.width, height: 3 } : { left: rect.left - 1.5, top: rect.top, width: 3, height: rect.height }
}
const addHighlight = (bounds: Bounds, item: GalleryItem, showBadge = true): void => {
  if (!highlightLayer.value) return
  const highlight = document.createElement('span')
  highlight.className = `gallery-map-highlight ${item.tone}${showBadge ? '' : ' gallery-map-highlight--repeat'}${item.badgeClass ? ` ${item.badgeClass}` : ''}`
  highlight.style.left = `${bounds.left}px`; highlight.style.top = `${bounds.top}px`; highlight.style.width = `${bounds.width}px`; highlight.style.height = `${bounds.height}px`
  highlight.dataset.highlightKey = item.key
  if (showBadge) highlight.dataset.name = item.name
  highlightLayer.value.appendChild(highlight)
}
const addElementHighlights = (item: GalleryItem, elements: GridElement[]): void => {
  if (item.rows) {
    const rows = [...new Set(elements.flatMap(({ position }) => ('row' in position ? [position.row] : [])))]
    rows.forEach((row, index) => { const bounds = getElementBounds(elements.filter((element) => 'row' in element.position && element.position.row === row)); if (bounds) addHighlight(expandBounds(bounds), item, index === 0) })
    return
  }
  const bounds = getElementBounds(elements); if (bounds) addHighlight(expandBounds(bounds), item)
}
const addRenderedTextHighlights = (item: GalleryItem): void => {
  if (!renderHost.value || !contentLayer.value) return
  const gridRect = renderHost.value.getBoundingClientRect()
  contentLayer.value.querySelectorAll<HTMLElement>(`.grid-text[data-style-token="${item.token}"]`).forEach((node, index) => {
    const rect = node.getBoundingClientRect(); addHighlight(expandBounds({ left: rect.left - gridRect.left, top: rect.top - gridRect.top, width: rect.width, height: rect.height }, 4), item, index === 0)
  })
}
const syncHighlightVisibility = (): void => highlightLayer.value?.querySelectorAll<HTMLElement>('[data-highlight-key]').forEach((highlight) => highlight.classList.toggle('gallery-map-highlight--hidden', !selected.value[highlight.dataset.highlightKey ?? '']))
const renderHighlights = (): void => {
  if (!highlightLayer.value) return
  highlightLayer.value.replaceChildren()
  props.items.forEach((item) => {
    if (item.source === 'scene') { addHighlight({ left: 0, top: 0, width: metrics.value.width, height: metrics.value.height }, item); return }
    if (item.source === 'rendered-text') { addRenderedTextHighlights(item); return }
    if (item.source === 'edge') { props.scene.elements.filter((element) => element.styleToken === item.token).forEach((element, index) => addHighlight(expandBounds(getLineBounds(element)), item, index === 0)); return }
    const elements = item.source === 'text' ? props.scene.elements.filter((element) => isTextToken(element, item.token)) : props.scene.elements.filter((element) => element.styleToken === item.token)
    addElementHighlights(item, elements)
  })
  syncHighlightVisibility()
}
const renderGrid = async (): Promise<void> => {
  props.items.forEach(({ key }) => { if (selected.value[key] === undefined) selected.value[key] = true })
  await nextTick(); if (!renderHost.value) return
  const stage = renderDomGrid(props.scene); stage.classList.add('gallery-map-dom'); renderHost.value.replaceChildren(stage)
  contentLayer.value = stage.querySelector<HTMLElement>('.grid-content-layer') ?? undefined; renderHighlights()
}
const setAll = (visible: boolean): void => { props.items.forEach(({ key }) => { selected.value[key] = visible }); syncHighlightVisibility() }
onMounted(renderGrid)
watch(() => props.scene, renderGrid)
watch(selected, syncHighlightVisibility, { deep: true })
</script>

<template>
  <div class="gallery-map-layout">
    <section class="gallery-map-panel">
      <h2>交互式图例</h2>
      <div class="gallery-map-canvas-wrap"><div class="gallery-map-canvas-inner"><div class="gallery-map-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }"><div ref="renderHost" class="gallery-map-render-host"></div><div ref="highlightLayer" class="gallery-map-highlight-layer" aria-hidden="true"></div></div></div></div>
      <p class="gallery-map-muted">彩色框围绕真实网格元素；右侧说明滚动时，此图谱保持在左侧，便于持续对照。</p>
    </section>
    <section class="gallery-map-panel">
      <div class="gallery-map-heading"><h3>图例开关</h3><label><input type="checkbox" :checked="allSelected" :indeterminate.prop="someSelected && !allSelected" @change="setAll(($event.target as HTMLInputElement).checked)" /> 全部显示</label></div>
      <div class="gallery-map-items"><label v-for="item in items" :key="item.key" class="gallery-map-item"><input v-model="selected[item.key]" type="checkbox" /><span><strong>{{ item.name }}</strong><small>{{ item.description }}</small></span></label></div>
    </section>
  </div>
</template>

<style>
.gallery-map-layout { display: block; }
.gallery-map-panel { border: 1px solid var(--vp-c-divider); border-radius: .85rem; padding: .9rem; background: var(--vp-c-bg-elv); }
.gallery-map-panel + .gallery-map-panel { margin-top: .65rem; }
.gallery-map-panel h2, .gallery-map-panel h3 { margin: 0 0 .6rem; font-size: 1rem; }
.gallery-map-panel h3 { margin: 0; font-size: .85rem; }
/* 画布只允许横向滚动；纵向尺寸由 GridScene 明确提供，避免内联高度与边距叠加出多余滚动条。 */
.gallery-map-canvas-wrap { overflow-x: auto; overflow-y: hidden; border: 1px solid var(--vp-c-divider); border-radius: .65rem; padding: .4rem; background: var(--vp-c-bg-alt); }
.gallery-map-canvas-inner { width: max-content; min-width: 100%; }
.gallery-map-stage { position: relative; margin: .75rem auto; color: var(--vp-c-text-1); }
.gallery-map-render-host, .gallery-map-render-host .gallery-map-dom { position: relative; width: 100%; height: 100%; }
.gallery-map-render-host .grid-text {
  position: absolute;
  display: block;
  width: max-content;
  white-space: nowrap;
  color: var(--vp-c-text);
  font-family: var(--site-font-family);
  font-size: var(--grid-font-size, 27px);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}
.gallery-map-render-host .grid-edge,
.gallery-map-render-host .grid-corner,
.gallery-map-render-host .grid-guide-line { position: absolute; }
.gallery-map-render-host .grid-edge { background: var(--vp-c-text); }
.gallery-map-render-host .grid-corner {
  border-right: var(--division-stroke, 3px) solid var(--vp-c-text);
  border-bottom: var(--division-stroke, 3px) solid var(--vp-c-text);
  border-bottom-right-radius: var(--grid-corner-radius);
}
.gallery-map-render-host .grid-edge--top,
.gallery-map-render-host .grid-edge--bottom {
  height: var(--grid-line-thickness, 2px) !important;
  border-radius: 0;
  transform: translateY(-1px);
}
.gallery-map-render-host .grid-edge--left,
.gallery-map-render-host .grid-edge--right {
  width: var(--grid-line-thickness, var(--division-stroke, 3px)) !important;
  transform: translateX(calc(var(--division-stroke, 3px) / -2));
}

/* 与主演示页及 macro autoColor 色板保持一致，确保同一 GridScene 在文档站中不换主题。 */
.gallery-map-render-host .grid-text[data-style-token="division.divisor"] { color: #c43e49; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="division.quotient"] { color: #be4c00; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="division.dividend"] { color: #b2468a; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="division.appended-zero"] { color: #c9a3bd; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="division.partial-minuend"],
.gallery-map-render-host .grid-text[data-style-token="division.remainder"] { color: #4f9b3e; font-weight: 600; }
.gallery-map-render-host .grid-text[data-style-token="division.partial-subtrahend"] { color: #9752b4; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="division.decimal-separator"],
.gallery-map-render-host .grid-text[data-style-token="division.dividend-decimal-separator"] { color: #c2185b; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="multiplication.multiplicand"] { color: #c43e49; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="multiplication.multiplier"],
.gallery-map-render-host .grid-text[data-style-token="multiplication.operator"] { color: #0096c9; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="multiplication.carry"],
.gallery-map-render-host .grid-text[data-style-token="addition.carry"],
.gallery-map-render-host .grid-text[data-style-token="subtraction.borrow"] { color: #00a079; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="multiplication.addition-carry"] { color: #9752b4; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="multiplication.partial-product"] { color: #4f9b3e; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="multiplication.product"],
.gallery-map-render-host .grid-text[data-style-token="addition.sum"],
.gallery-map-render-host .grid-text[data-style-token="subtraction.difference"] { color: #be4c00; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="addition.addend"],
.gallery-map-render-host .grid-text[data-style-token="subtraction.minuend"] { color: #c43e49; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="addition.operator"],
.gallery-map-render-host .grid-text[data-style-token="subtraction.operator"],
.gallery-map-render-host .grid-text[data-style-token="subtraction.negative-sign"] { color: #7b3fa0; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="subtraction.subtrahend"] { color: #0096c9; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="short-division.divisor"],
.gallery-map-render-host .grid-text[data-style-token="short-division.remainder-label"] { color: #c43e49; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="short-division.dividend"] { color: #b2468a; font-weight: 700; }
.gallery-map-render-host .grid-text[data-style-token="short-division.remainder"] { color: #4f9b3e; font-weight: 800; }
.gallery-map-render-host .grid-text[data-style-token="short-division.final"] { color: #be4c00; font-weight: 800; }

.gallery-map-render-host {
  /* 命名图谱与主页面保持同一厂字颜色，横线不能脱离厂字弯单独配色。 */
  --division-bracket-color: #4a5f78;
}
.gallery-map-render-host .grid-edge[data-style-token="division.bracket"],
.gallery-map-render-host .grid-edge[data-style-token="division.bracket-top-line"] { background: var(--division-bracket-color); }
.gallery-map-render-host .grid-corner[data-style-token="division.bracket"] { border-right-color: var(--division-bracket-color); border-bottom-color: var(--division-bracket-color); }
.gallery-map-render-host .grid-edge[data-style-token="division.subtraction-bar"],
.gallery-map-render-host .grid-edge[data-style-token="multiplication.input-bar"],
.gallery-map-render-host .grid-edge[data-style-token="multiplication.sum-bar"],
.gallery-map-render-host .grid-edge[data-style-token="addition.sum-bar"],
.gallery-map-render-host .grid-edge[data-style-token="subtraction.difference-bar"],
.gallery-map-render-host .grid-edge[data-style-token="short-division.bar"] { background: #4a5f78; }
.gallery-map-render-host .grid-edge[data-style-token="short-division.separator"] { width: 2px !important; background: #3986e4; transform: translateX(-1px); }
.gallery-map-render-host .grid-guide-line--horizontal { background: repeating-linear-gradient(90deg, #a7bbdd 0 2px, transparent 2px 7px); opacity: .68; }
.gallery-map-render-host .grid-guide-line--vertical { background: repeating-linear-gradient(0deg, #a7bbdd 0 2px, transparent 2px 7px); opacity: .68; }
.gallery-map-highlight-layer { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.gallery-map-highlight { position: absolute; border: 2px solid var(--highlight-color); border-radius: 8px; background: color-mix(in srgb, var(--highlight-color) 9%, transparent); box-shadow: 0 0 0 2px rgba(255,255,255,.78); }
.gallery-map-highlight::after { position: absolute; top: -13px; right: -10px; display: grid; min-width: 24px; height: 24px; padding: 0 8px; place-items: center; border: 2px solid var(--highlight-color); border-radius: 999px; color: #fff; background: var(--highlight-color); content: attr(data-name); font: 800 11px/1 var(--vp-font-family); white-space: nowrap; }
.gallery-map-highlight--repeat::after, .gallery-map-highlight--hidden { display: none; }
.gallery-map-highlight--badge-left::after { right: auto; left: -10px; }
.gallery-map-heading { display: flex; align-items: center; justify-content: space-between; gap: .65rem; margin-bottom: .45rem; }
.gallery-map-heading label { font-size: .76rem; font-weight: 700; color: var(--vp-c-text-2); white-space: nowrap; }
.gallery-map-heading input, .gallery-map-item input { accent-color: var(--vp-c-accent); }
.gallery-map-items { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .3rem; margin-top: 0; }
.gallery-map-item { display: flex; min-width: 0; align-items: flex-start; gap: .4rem; padding: .45rem .5rem; border: 1px solid var(--vp-c-divider); border-radius: .55rem; cursor: pointer; }
.gallery-map-item input { flex: 0 0 auto; width: .9rem; height: .9rem; margin: .08rem 0 0; }
.gallery-map-item span { min-width: 0; }
.gallery-map-item strong { display: block; overflow: hidden; color: var(--vp-c-text-1); font-size: .76rem; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.gallery-map-item small { display: -webkit-box; overflow: hidden; margin-top: .1rem; color: var(--vp-c-text-2); font-size: .63rem; line-height: 1.2; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
.gallery-map-muted { margin: .6rem 0 0; color: var(--vp-c-text-2); font-size: .72rem; line-height: 1.4; }
.gallery-map-item { min-height: 2.65rem; }
@media (max-width: 560px) { .gallery-map-items { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.tone-blue { --highlight-color: #4166b6; }.tone-ink { --highlight-color: #192642; }.tone-muted { --highlight-color: #7d8eac; }.tone-green { --highlight-color: #1e8b83; }.tone-subtraction { --highlight-color: #6d83ae; }.tone-partial { --highlight-color: #5a709f; }.tone-grid { --highlight-color: #a7bbdd; border-style: dashed; }.tone-sum { --highlight-color: #8a5db0; }.tone-carry { --highlight-color: #a56823; }.tone-addcarry { --highlight-color: #b64671; }.tone-product { --highlight-color: #227e69; }
</style>
