<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { resolveGridMetrics } from '@u1in/shushi-grid'
import { renderDomGrid, renderSvgGrid } from '@u1in/shushi-renderers'
import type { GridScene } from '@u1in/shushi-grid'
import {
  DEFAULT_RENDERER_FONT,
  getRendererFontFace,
  rendererFontOptions,
  type RendererFontFamily,
} from './rendererFonts'

const props = withDefaults(defineProps<{
  scene: GridScene
  mode: 'dom' | 'svg' | 'both'
  /** 检查器需要捕获渲染元素点击；普通预览保持纯展示。 */
  interactive?: boolean
  /** 可选的已选元素 ID，仅用于交互预览的视觉反馈。 */
  selectedElementId?: string
  /** 当前场景的编译字体；选择器只请求父组件重新编译，绝不在渲染后改写样式。 */
  fontFamily?: RendererFontFamily
}>(), { interactive: false, selectedElementId: undefined })
const emit = defineEmits<{
  elementClick: [elementId: string]
  fontChange: [fontFamily: RendererFontFamily]
}>()

const svgHost = ref<HTMLElement>()
const domHost = ref<HTMLElement>()
const svgViewport = ref<HTMLElement>()
const domViewport = ref<HTMLElement>()
const metrics = computed(() => resolveGridMetrics(props.scene))
const viewportWidths = ref({ svg: 0, dom: 0 })
const fontError = ref('')
let resizeObserver: ResizeObserver | undefined

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/** 渲染器保持无状态；选中样式由宿主按元素 ID 追加，避免污染 GridScene。 */
const syncSelectedElement = (): void => {
  for (const host of [svgHost.value, domHost.value]) {
    host?.querySelectorAll<HTMLElement | SVGElement>('[data-grid-element-id]').forEach((node) => {
      node.classList.toggle('grid-element--selected', node.getAttribute('data-grid-element-id') === props.selectedElementId)
    })
  }

  const svg = svgHost.value?.querySelector('svg')
  svg?.querySelectorAll('.grid-element--selection-border').forEach((node) => node.remove())
  if (!svg || !props.selectedElementId) return

  const selectedNode = Array.from(svg.querySelectorAll<SVGGraphicsElement>('[data-grid-element-id]'))
    .find((node) => node.getAttribute('data-grid-element-id') === props.selectedElementId)
  if (!selectedNode) return

  const bounds = selectedNode.getBBox()
  const border = document.createElementNS(SVG_NAMESPACE, 'rect')
  border.setAttribute('class', 'grid-element--selection-border')
  border.setAttribute('x', String(bounds.x - 3))
  border.setAttribute('y', String(bounds.y - 3))
  border.setAttribute('width', String(bounds.width + 6))
  border.setAttribute('height', String(bounds.height + 6))
  border.setAttribute('rx', '4')
  svg.appendChild(border)
}

/** 窄容器时缩小固定坐标的 GridScene，宽容器时保持原始字号，避免数字被意外放大。 */
const getStageScale = (viewportWidth: number): number => {
  if (!viewportWidth || !metrics.value.width) return 1
  return Math.min(1, viewportWidth / metrics.value.width)
}

const svgScale = computed(() => getStageScale(viewportWidths.value.svg))
const domScale = computed(() => getStageScale(viewportWidths.value.dom))
const svgStageHeight = computed(() => metrics.value.height * svgScale.value)
const domStageHeight = computed(() => metrics.value.height * domScale.value)

const syncStageScale = (): void => {
  const stages: Array<[HTMLElement | SVGElement | undefined, number]> = [
    [svgHost.value?.querySelector('.grid-svg') as SVGElement | undefined, svgScale.value],
    [domHost.value?.querySelector('.grid-dom-stage') as HTMLElement | undefined, domScale.value],
  ]
  stages.forEach(([stage, scale]) => {
    if (!stage) return
    stage.style.transformOrigin = 'top right'
    stage.style.transform = 'scale(' + scale + ')'
  })
}

const updateViewportWidths = (): void => {
  viewportWidths.value = {
    svg: svgViewport.value?.clientWidth ?? 0,
    dom: domViewport.value?.clientWidth ?? 0,
  }
  syncStageScale()
}

/**
 * 渲染器直接返回创建好的 SVG/DOM 舞台；这里只负责挂载，并补充主应用的样式类。
 */
const render = async (): Promise<void> => {
  await nextTick()
  if (svgHost.value) {
    const svg = renderSvgGrid(props.scene)
    svg.classList.add('division-svg')
    svgHost.value.replaceChildren(svg)
  }
  if (domHost.value) {
    const stage = renderDomGrid(props.scene)
    stage.classList.add('division-dom')
    domHost.value.replaceChildren(stage)
  }
  syncStageScale()
  syncSelectedElement()
}

onMounted(() => {
  render()
  if (typeof ResizeObserver === 'undefined') {
    updateViewportWidths()
    return
  }
  resizeObserver = new ResizeObserver(updateViewportWidths)
  if (svgViewport.value) resizeObserver.observe(svgViewport.value)
  if (domViewport.value) resizeObserver.observe(domViewport.value)
  updateViewportWidths()
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
watch(() => props.scene, render)
watch(() => props.selectedElementId, syncSelectedElement)
watch([svgScale, domScale], syncStageScale)

/** 字体确认可用后交由父组件重新编译 GridScene，避免预览区出现渲染后样式旁路。 */
const handleFontChange = async (event: Event): Promise<void> => {
  const select = event.target
  if (!(select instanceof HTMLSelectElement)) return
  const nextFont = rendererFontOptions.find(({ value }) => value === select.value)
  if (!nextFont) return

  const previousFont = props.fontFamily ?? DEFAULT_RENDERER_FONT
  try {
    const loadedFonts = await document.fonts.load(getRendererFontFace(nextFont.value))
    if (loadedFonts.length === 0) throw new Error('Font was not loaded')
    fontError.value = ''
    emit('fontChange', nextFont.value)
  } catch {
    select.value = previousFont
    fontError.value = `${nextFont.label} 加载失败，已保留当前字体。`
  }
}

/** 通过渲染器写入的通用元素 ID 向上抛出事件，AST 查询由调用方自行处理。 */
const handleElementClick = (event: MouseEvent): void => {
  if (!props.interactive || !(event.target instanceof Element)) return
  const elementId = event.target.closest('[data-grid-element-id]')?.getAttribute('data-grid-element-id')
  if (elementId) emit('elementClick', elementId)
}
</script>

<template>
  <div class="renderer-comparison" :class="{ 'renderer-comparison--both': mode === 'both', 'renderer-comparison--interactive': interactive }">
    <div class="renderer-font-picker">
      <label>
        <span>竖式字体</span>
        <select :value="fontFamily ?? DEFAULT_RENDERER_FONT" aria-label="选择竖式渲染字体" @change="handleFontChange">
          <option v-for="font in rendererFontOptions" :key="font.value" :value="font.value">{{ font.label }}</option>
        </select>
      </label>
      <slot name="theme-control" />
      <small v-if="fontError" class="renderer-font-picker__error" role="status">{{ fontError }}</small>
    </div>
    <section v-if="mode !== 'dom'" class="renderer-panel">
      <h3>SVG</h3>
      <div ref="svgViewport" class="stage-scroll">
        <!-- 该相对定位容器为渲染器返回的绝对定位图元提供统一坐标系。 -->
        <div ref="svgHost" class="division-stage" :style="{ width: '100%', height: svgStageHeight + 'px' }" @click="handleElementClick"></div>
      </div>
    </section>
    <section v-if="mode !== 'svg'" class="renderer-panel">
      <h3>DIV + CSS</h3>
      <div ref="domViewport" class="stage-scroll">
        <div ref="domHost" class="division-stage" :style="{ width: '100%', height: domStageHeight + 'px' }" @click="handleElementClick"></div>
      </div>
    </section>
  </div>
</template>
