<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolveGridMetrics } from '@u1in/shushi-grid'
import { renderDomGrid, renderSvgGrid } from '@u1in/shushi-renderers'
import type { GridScene } from '@u1in/shushi-grid'

const props = defineProps<{ scene: GridScene, mode: 'dom' | 'svg' | 'both' }>()

const svgHost = ref<HTMLElement>()
const domHost = ref<HTMLElement>()
const metrics = computed(() => resolveGridMetrics(props.scene))

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
}

onMounted(render)
watch(() => props.scene, render)
</script>

<template>
  <div class="renderer-comparison" :class="{ 'renderer-comparison--both': mode === 'both' }">
    <section v-if="mode !== 'dom'" class="renderer-panel">
      <h3>SVG</h3>
      <div class="stage-scroll">
        <!-- 该相对定位容器为渲染器返回的绝对定位图元提供统一坐标系。 -->
        <div ref="svgHost" class="division-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }"></div>
      </div>
    </section>
    <section v-if="mode !== 'svg'" class="renderer-panel">
      <h3>DIV + CSS</h3>
      <div class="stage-scroll">
        <div ref="domHost" class="division-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }"></div>
      </div>
    </section>
  </div>
</template>
