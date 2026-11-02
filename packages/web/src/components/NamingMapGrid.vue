<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getGridElementRect, resolveGridMetrics } from '@vertical-arithmetic/grid'
import { renderDomGrid } from '@vertical-arithmetic/renderers'
import type { GridElement, GridScene } from '@vertical-arithmetic/grid'

type Bounds = { left: number, top: number, width: number, height: number }
type HighlightSource = 'text' | 'cell' | 'edge' | 'rendered-text' | 'scene'

export interface NamingMapItem {
  key: string
  name: string
  description: string
  token: string
  tone: string
  source: HighlightSource
  rows?: boolean
  badgeClass?: string
}

const props = defineProps<{
  scene: GridScene
  items: NamingMapItem[]
}>()

const renderHost = ref<HTMLElement>()
const contentLayer = ref<HTMLElement>()
const highlightLayer = ref<HTMLElement>()
const selected = ref<Record<string, boolean>>({})

const metrics = computed(() => resolveGridMetrics(props.scene))
const allSelected = computed(() => props.items.every(({ key }) => selected.value[key]))
const someSelected = computed(() => props.items.some(({ key }) => selected.value[key]))

const expandBounds = (bounds: Bounds, padding = 5): Bounds => ({
  left: bounds.left - padding,
  top: bounds.top - padding,
  width: bounds.width + padding * 2,
  height: bounds.height + padding * 2,
})

const isTextToken = (element: GridElement, token: string): boolean => (
  element.content.kind === 'text' && element.content.styleToken === token
)

const getElementBounds = (elements: GridElement[]): Bounds | null => {
  if (elements.length === 0) return null
  const rects = elements.map((element) => getGridElementRect(element, metrics.value))
  const left = Math.min(...rects.map((rect) => rect.left))
  const top = Math.min(...rects.map((rect) => rect.top))
  const right = Math.max(...rects.map((rect) => rect.left + rect.width))
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height))
  return { left, top, width: right - left, height: bottom - top }
}

const getLineBounds = (element: GridElement): Bounds => {
  const rect = getGridElementRect(element, metrics.value)
  const isHorizontal = element.position.kind === 'edge' && (element.position.edge === 'top' || element.position.edge === 'bottom')
  return isHorizontal
    ? { left: rect.left, top: rect.top - 1.5, width: rect.width, height: 3 }
    : { left: rect.left - 1.5, top: rect.top, width: 3, height: rect.height }
}

const addHighlight = (bounds: Bounds, item: NamingMapItem, showBadge = true): void => {
  if (!highlightLayer.value) return
  const highlight = document.createElement('span')
  highlight.className = `naming-map-highlight ${item.tone}${showBadge ? '' : ' naming-map-highlight--repeat'}${item.badgeClass ? ` ${item.badgeClass}` : ''}`
  highlight.style.left = `${bounds.left}px`
  highlight.style.top = `${bounds.top}px`
  highlight.style.width = `${bounds.width}px`
  highlight.style.height = `${bounds.height}px`
  highlight.dataset.highlightKey = item.key
  if (showBadge) highlight.dataset.name = item.name
  highlightLayer.value.appendChild(highlight)
}

const addElementHighlights = (item: NamingMapItem, elements: GridElement[]): void => {
  if (item.rows) {
    const rows = [...new Set(elements.flatMap(({ position }) => (
      'row' in position ? [position.row] : []
    )))]
    rows.forEach((row, index) => {
      const bounds = getElementBounds(elements.filter((element) => 'row' in element.position && element.position.row === row))
      if (bounds) addHighlight(expandBounds(bounds), item, index === 0)
    })
    return
  }
  const bounds = getElementBounds(elements)
  if (bounds) addHighlight(expandBounds(bounds), item)
}

const addRenderedTextHighlights = (item: NamingMapItem): void => {
  if (!renderHost.value || !contentLayer.value) return
  const gridRect = renderHost.value.getBoundingClientRect()
  contentLayer.value.querySelectorAll<HTMLElement>(`.grid-text[data-style-token="${item.token}"]`).forEach((node, index) => {
    const rect = node.getBoundingClientRect()
    addHighlight(expandBounds({
      left: rect.left - gridRect.left,
      top: rect.top - gridRect.top,
      width: rect.width,
      height: rect.height,
    }, 4), item, index === 0)
  })
}

const renderHighlights = (): void => {
  if (!highlightLayer.value) return
  highlightLayer.value.replaceChildren()
  props.items.forEach((item) => {
    if (item.source === 'scene') {
      addHighlight({ left: 0, top: 0, width: metrics.value.width, height: metrics.value.height }, item)
      return
    }
    if (item.source === 'rendered-text') {
      addRenderedTextHighlights(item)
      return
    }
    if (item.source === 'edge') {
      props.scene.elements.filter((element) => element.styleToken === item.token).forEach((element, index) => {
        addHighlight(expandBounds(getLineBounds(element)), item, index === 0)
      })
      return
    }
    const elements = item.source === 'text'
      ? props.scene.elements.filter((element) => isTextToken(element, item.token))
      : props.scene.elements.filter((element) => element.styleToken === item.token)
    addElementHighlights(item, elements)
  })
  syncHighlightVisibility()
}

const syncHighlightVisibility = (): void => {
  if (!highlightLayer.value) return
  highlightLayer.value.querySelectorAll<HTMLElement>('[data-highlight-key]').forEach((highlight) => {
    highlight.classList.toggle('naming-map-highlight--hidden', !selected.value[highlight.dataset.highlightKey ?? ''])
  })
}

const renderGrid = async (): Promise<void> => {
  props.items.forEach(({ key }) => { if (selected.value[key] === undefined) selected.value[key] = true })
  await nextTick()
  if (!renderHost.value) return
  const stage = renderDomGrid(props.scene)
  stage.classList.add('division-dom')
  renderHost.value.replaceChildren(stage)
  contentLayer.value = stage.querySelector<HTMLElement>('.grid-content-layer') ?? undefined
  renderHighlights()
}

const setAll = (visible: boolean): void => {
  props.items.forEach(({ key }) => { selected.value[key] = visible })
  syncHighlightVisibility()
}

onMounted(renderGrid)
watch(() => props.scene, renderGrid)
watch(selected, syncHighlightVisibility, { deep: true })
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(430px,1.15fr)_minmax(330px,.9fr)]">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
      <h2 class="text-xl font-bold text-slate-800">图中物件</h2>
      <div class="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div class="min-w-[600px]">
          <div class="naming-map-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }">
            <div ref="renderHost" class="naming-map-render-host"></div>
            <div ref="highlightLayer" class="naming-map-highlight-layer" aria-hidden="true"></div>
          </div>
        </div>
      </div>
      <p class="mt-4 text-sm leading-6 text-slate-500">彩色框围绕真实网格元素；通过右侧目录控制每类标注的可见性。</p>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-bold text-slate-800">完整名称目录</h2>
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600">
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
            class="size-4 accent-blue-700"
            @change="setAll(($event.target as HTMLInputElement).checked)"
          />
          全部显示
        </label>
      </div>
      <div class="mt-4 grid gap-2">
        <label v-for="item in items" :key="item.key" class="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-slate-50">
          <input v-model="selected[item.key]" type="checkbox" class="mt-1 size-4 shrink-0 accent-blue-700" />
          <span><strong class="text-sm text-slate-800">{{ item.name }}</strong><span class="ml-2 text-xs leading-5 text-slate-500">{{ item.description }}</span></span>
        </label>
      </div>
    </section>
  </div>
</template>
