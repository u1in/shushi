<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolveGridMetrics } from '@u1in/shushi-grid'
import { renderDomGrid, renderSvgGrid } from '@u1in/shushi-renderers'
import type { GridScene } from '@u1in/shushi-grid'

const props = withDefaults(defineProps<{
  scene: GridScene
  mode: 'dom' | 'svg' | 'both'
  /** 检查器需要捕获渲染元素点击；普通预览保持纯展示。 */
  interactive?: boolean
  /** 可选的已选元素 ID，仅用于交互预览的视觉反馈。 */
  selectedElementId?: string
}>(), { interactive: false, selectedElementId: undefined })
const emit = defineEmits<{ elementClick: [elementId: string] }>()

const svgHost = ref<HTMLElement>()
const domHost = ref<HTMLElement>()
const metrics = computed(() => resolveGridMetrics(props.scene))

/** 渲染器保持无状态；选中样式由宿主按元素 ID 追加，避免污染 GridScene。 */
const syncSelectedElement = (): void => {
  for (const host of [svgHost.value, domHost.value]) {
    host?.querySelectorAll<HTMLElement | SVGElement>('[data-grid-element-id]').forEach((node) => {
      node.classList.toggle('grid-element--selected', node.getAttribute('data-grid-element-id') === props.selectedElementId)
    })
  }
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
  syncSelectedElement()
}

onMounted(render)
watch(() => props.scene, render)
watch(() => props.selectedElementId, syncSelectedElement)

/** 通过渲染器写入的通用元素 ID 向上抛出事件，AST 查询由调用方自行处理。 */
const handleElementClick = (event: MouseEvent): void => {
  if (!props.interactive || !(event.target instanceof Element)) return
  const elementId = event.target.closest('[data-grid-element-id]')?.getAttribute('data-grid-element-id')
  if (elementId) emit('elementClick', elementId)
}
</script>

<template>
  <div class="renderer-comparison" :class="{ 'renderer-comparison--both': mode === 'both', 'renderer-comparison--interactive': interactive }">
    <section v-if="mode !== 'dom'" class="renderer-panel">
      <h3>SVG</h3>
      <div class="stage-scroll">
        <!-- 该相对定位容器为渲染器返回的绝对定位图元提供统一坐标系。 -->
        <div ref="svgHost" class="division-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }" @click="handleElementClick"></div>
      </div>
    </section>
    <section v-if="mode !== 'svg'" class="renderer-panel">
      <h3>DIV + CSS</h3>
      <div class="stage-scroll">
        <div ref="domHost" class="division-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }" @click="handleElementClick"></div>
      </div>
    </section>
  </div>
</template>
