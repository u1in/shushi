<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { resolveGridMetrics } from '@vertical-arithmetic/grid'
import { renderDomGrid, renderSvgGrid } from '@vertical-arithmetic/renderers'
import type { GridScene } from '@vertical-arithmetic/grid'

const props = defineProps<{ scene: GridScene, mode: 'dom' | 'svg' | 'both' }>()

const svg = ref<SVGSVGElement>()
const dom = ref<HTMLElement>()
const lines = ref<HTMLElement>()
const digits = ref<HTMLElement>()
const metrics = computed(() => resolveGridMetrics(props.scene))

/**
 * 等待条件渲染的 SVG / DOM 面板挂载后再写入图元，避免切换渲染模式时向已卸载节点绘制。
 */
const render = async (): Promise<void> => {
  await nextTick()
  if (svg.value) {
    svg.value.replaceChildren()
    renderSvgGrid(svg.value, props.scene)
  }
  if (dom.value && lines.value && digits.value) {
    lines.value.replaceChildren()
    digits.value.replaceChildren()
    renderDomGrid(lines.value, digits.value, props.scene)
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
        <!-- 该相对定位容器为绝对定位的 SVG 与 DOM 网格图元提供统一坐标系。 -->
        <div class="division-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }">
          <svg ref="svg" :width="metrics.width" :height="metrics.height" class="division-svg" role="img" :aria-label="scene.ariaLabel"></svg>
        </div>
      </div>
    </section>
    <section v-if="mode !== 'svg'" class="renderer-panel">
      <h3>DIV + CSS</h3>
      <div class="stage-scroll">
        <div class="division-stage" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }">
          <div ref="dom" class="division-dom" :style="{ width: `${metrics.width}px`, height: `${metrics.height}px` }" :aria-label="scene.ariaLabel">
            <div ref="lines" class="division-line-layer" aria-hidden="true"></div>
            <div ref="digits" class="division-digit-layer"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
